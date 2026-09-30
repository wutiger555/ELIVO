"""LLM 供應商抽象層（ADR-0002）：同一個介面 complete_json(system, prompt, schema) → (Pydantic 物件, usage)。

供應商：
  ica        IBM Consulting Advantage（OpenAI 相容、無 structured outputs：schema 放在 prompt，回覆用 Pydantic 驗證）。
             金鑰：環境變數 ICA_API_KEY，或鑰匙圈 elivo-ica-api-key。
  anthropic  Anthropic API（structured outputs 保證格式）。
             金鑰：環境變數 ANTHROPIC_API_KEY，或鑰匙圈 elivo-anthropic-api-key。

不要把金鑰 export 在 .zshrc：ANTHROPIC_API_KEY 會讓 Claude Code 也改用這把金鑰計費。

列出 ICA 可用的模型：python llm.py --list-ica-models
"""
import argparse
import asyncio
import json
import os
import re
import subprocess

import httpx
from pydantic import BaseModel, ValidationError


class Disable(Exception):
    """無法恢復（金鑰無效、額度不足）：停用這個功能。"""


class Retry(Exception):
    """暫時性錯誤（限流、網路、5xx）：下一輪重試。"""


class Skip(Exception):
    """這一輪失敗（格式錯誤等），不重試同一份輸入。"""


class QuotaExceeded(Exception):
    """這個模型的額度用完了（例如 ICA 的 Frontier Models 額度），可以換別的模型再試。"""


def keychain(service: str) -> str | None:
    r = subprocess.run(["security", "find-generic-password", "-s", service, "-w"], capture_output=True, text=True)
    if r.returncode != 0:
        return None
    return r.stdout.strip() or None


def require_key(env: str, service: str) -> str:
    key = os.environ.get(env) or keychain(service)
    if not key:
        raise SystemExit(f"找不到金鑰：請設定 {env}，或執行\n  security add-generic-password -a \"$USER\" -s {service} -w")
    return key


class AnthropicProvider:
    name = "anthropic"
    price_per_mtok = {"claude-haiku-4-5": (1.0, 5.0), "claude-sonnet-4-6": (3.0, 15.0)}  # US$ input／output

    def __init__(self):
        import anthropic

        self.anthropic = anthropic
        self.client = anthropic.AsyncAnthropic(api_key=require_key("ANTHROPIC_API_KEY", "elivo-anthropic-api-key"))

    async def complete_json(self, model: str, system: str, prompt: str, schema: type[BaseModel], max_tokens: int = 8192,
                            format_hint: str | None = None):
        a = self.anthropic
        try:
            resp = await self.client.messages.parse(
                # system 固定不變，標記快取：前綴長度達到模型的最低門檻時，重複的部分以快取價計費（門檻待驗證）
                model=model, max_tokens=max_tokens, system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
                messages=[{"role": "user", "content": prompt}], output_format=schema,
            )
        except a.AuthenticationError:
            raise Disable("API 金鑰無效")
        except (a.RateLimitError, a.APIConnectionError, a.InternalServerError) as e:
            raise Retry(type(e).__name__)
        except a.APIStatusError as e:
            if "credit balance" in str(e.message):
                raise Disable("API 帳戶額度不足（Claude Console › Plans & Billing）")
            raise Skip(f"API 錯誤 {e.status_code}：{e.message}")
        if resp.stop_reason != "end_turn" or resp.parsed_output is None:
            raise Skip(f"沒有取得結果（stop_reason={resp.stop_reason}）")
        return resp.parsed_output, {"input_tokens": resp.usage.input_tokens, "output_tokens": resp.usage.output_tokens}


class ICAProvider:
    """IBM Consulting Advantage。OpenAI 相容的 /chat-models/chat/completions，Bearer 驗證。"""

    name = "ica"
    base_url = "https://api.nextgen-beta.ica.ibm.com/ica/v1"
    price_per_mtok = {}  # 文件沒有公開價格

    def __init__(self):
        self.client = httpx.AsyncClient(
            base_url=self.base_url, timeout=120,
            headers={"Authorization": f"Bearer {require_key('ICA_API_KEY', 'elivo-ica-api-key')}"},
        )

    async def complete_json(self, model: str, system: str, prompt: str, schema: type[BaseModel], max_tokens: int = 8192,
                            format_hint: str | None = None):
        # 沒有 structured outputs：把格式寫進 system prompt，回覆再用 Pydantic 驗證。
        # 有精簡的格式範例就用範例（完整 JSON Schema 約多 650 tokens，每次呼叫都要付）
        spec = format_hint or ("格式必須符合這個 JSON Schema：\n" + json.dumps(schema.model_json_schema(), ensure_ascii=False))
        system = system + "\n\n只輸出一個 JSON 物件，不要有任何說明文字或 Markdown。" + spec
        body = {
            "model": model, "temperature": 0, "max_tokens": max_tokens,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        }
        try:
            r = await self.client.post("/chat-models/chat/completions", json=body)
        except httpx.TransportError as e:
            raise Retry(type(e).__name__)
        if r.status_code in (401, 403):
            raise Disable(f"ICA 拒絕存取（HTTP {r.status_code}），請檢查 ICA API key 與模型權限")
        if r.status_code == 429 or r.status_code >= 500:
            raise Retry(f"HTTP {r.status_code}")
        if r.status_code != 200:
            if "credits" in r.text:
                raise QuotaExceeded(f"{model} 額度用完：{r.text[:200]}")
            raise Skip(f"HTTP {r.status_code}：{r.text[:300]}")
        data = r.json()
        choice = data["choices"][0]
        if choice.get("finish_reason") == "length":
            raise Skip("輸出被截斷（max_tokens）")
        try:
            parsed = schema.model_validate_json(_strip_fence(choice["message"]["content"]))
        except ValidationError as e:
            err = e.errors()[0]
            raise Skip(f"回覆不是合格的 JSON：{err['msg']}（{'.'.join(map(str, err['loc']))}）")
        usage = data.get("usage") or {}
        return parsed, {"input_tokens": usage.get("prompt_tokens"), "output_tokens": usage.get("completion_tokens")}


def _strip_fence(text: str) -> str:
    """有些模型會包 ```json … ```，或在 JSON 前後多講話；取第一個 { 到最後一個 }。"""
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    start, end = text.find("{"), text.rfind("}")
    return text[start:end + 1] if start >= 0 and end > start else text


PROVIDERS = {"ica": ICAProvider, "anthropic": AnthropicProvider}


def llm_cost(records: list[dict]) -> float | None:
    """只有公開價格的供應商與模型才算得出費用；任何一筆算不出就回傳 None。"""
    total = 0.0
    for r in records:
        price = PROVIDERS[r["provider"]].price_per_mtok.get(r["model"])
        if price is None or r.get("input_tokens") is None:
            return None
        total += r["input_tokens"] * price[0] / 1e6 + r["output_tokens"] * price[1] / 1e6
    return total


async def _list_ica_models():
    key = require_key("ICA_API_KEY", "elivo-ica-api-key")
    async with httpx.AsyncClient(base_url=ICAProvider.base_url, timeout=30, headers={"Authorization": f"Bearer {key}"}) as c:
        r = await c.get("/chat-models/models")
    r.raise_for_status()
    for m in r.json().get("data", []):
        tier = (m.get("x_ica_info") or {}).get("cost_tier", "")
        print(f"{m.get('id'):55} {m.get('name', ''):45} {tier}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--list-ica-models", action="store_true")
    if ap.parse_args().list_ica_models:
        asyncio.run(_list_ica_models())
