"""Step D：卡片雛形。每隔一段時間把逐字稿送給 LLM，抽出決策、待辦、未回答問題、數字。

- 只在有新的定稿句子時才呼叫（沒人說話就不花錢）。
- 每次送「上一次的抽取結果＋最近的逐字稿」，讓模型延續並修正，而不是每次從零開始。
- 每一項都要附逐字稿原文與句子 id 作為來源（產品原則：每張卡片都有出處）。
- 依 ADR-0003：不判斷任何人的情緒、態度或參與度。
- 依 ADR-0002：LLM 供應商放在 Provider 介面後面，可用 --cards-provider 切換。

供應商：
  anthropic  Claude Haiku 4.5，structured outputs 保證 JSON 格式。
             金鑰：環境變數 ANTHROPIC_API_KEY，或鑰匙圈 elivo-anthropic-api-key。
  ica        IBM Consulting Advantage（OpenAI 相容、無 structured outputs：schema 放在 prompt，回覆用 Pydantic 驗證）。
             金鑰：環境變數 ICA_API_KEY，或鑰匙圈 elivo-ica-api-key。

不要把金鑰 export 在 .zshrc：ANTHROPIC_API_KEY 會讓 Claude Code 也改用這把金鑰計費。

列出 ICA 可用的模型：python cards.py --list-ica-models
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import time

import httpx
from pydantic import BaseModel, ValidationError

MAX_LINES = 150  # 只送最近這麼多句，避免長會議的輸入無限變大

SYSTEM = """你是會議助理 ELIVO 的抽取器。輸入是一場進行中會議的即時逐字稿，由語音辨識產生，可能有錯字、沒有標點、中英混雜。每行格式為「[句子 id] 說話者：內容」，說話者只有「我」與「他人」兩種。

從目前為止的逐字稿抽出：
- decisions：已經明確拍板的決定。提議、討論中、還在考慮的不算。
- action_items：有人承諾或被指派要做的事。owner 只在逐字稿明確說出時才填（例如「我來」就填該行的說話者），否則填 null；due 同理，沒有明確期限就填 null。
- open_questions：被提出、但到目前為止還沒有人回答的問題。後來有人回答了就移除。
- numbers：具體的數字，例如金額、日期、百分比、延遲、數量，並說明它代表什麼。

規則：
- 每一項都要附 quote（從逐字稿逐字複製的原文片段，40 字以內）與 utt_id（該句的 id）。找不到原文依據的就不要列。
- 只根據逐字稿內容，不要推測，也不要補充外部知識。
- 不判斷任何人的情緒、態度、語氣或參與度。
- 使用台灣正體中文，英文術語保留原文。
- 「目前狀態」是你上一次的輸出：延續它，修正被後來內容推翻的項目，不要重複列出同一件事。"""


class Decision(BaseModel):
    text: str
    quote: str
    utt_id: str


class ActionItem(BaseModel):
    task: str
    owner: str | None
    due: str | None
    quote: str
    utt_id: str


class OpenQuestion(BaseModel):
    question: str
    quote: str
    utt_id: str


class Number(BaseModel):
    value: str
    meaning: str
    quote: str
    utt_id: str


class Extraction(BaseModel):
    decisions: list[Decision]
    action_items: list[ActionItem]
    open_questions: list[OpenQuestion]
    numbers: list[Number]


class Disable(Exception):
    """無法恢復（金鑰無效、額度不足）：停用卡片。"""


class Retry(Exception):
    """暫時性錯誤（限流、網路、5xx）：下一輪重試。"""


class Skip(Exception):
    """這一輪失敗（格式錯誤等），不重試同一份輸入。"""


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
    default_model = "claude-haiku-4-5"
    price_per_mtok = {"input": 1.0, "output": 5.0}  # Haiku 4.5，US$

    def __init__(self, model: str | None = None):
        import anthropic

        self.anthropic = anthropic
        self.model = model or self.default_model
        self.client = anthropic.AsyncAnthropic(api_key=require_key("ANTHROPIC_API_KEY", "elivo-anthropic-api-key"))

    async def extract(self, prompt: str) -> tuple[Extraction, dict]:
        a = self.anthropic
        try:
            resp = await self.client.messages.parse(
                model=self.model, max_tokens=4096, system=SYSTEM,
                messages=[{"role": "user", "content": prompt}], output_format=Extraction,
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
    price_per_mtok = None  # 文件沒有公開價格

    def __init__(self, model: str | None = None):
        if not model:
            raise SystemExit("ICA 需要指定模型：--cards-model <id>（先用 python cards.py --list-ica-models 查）")
        self.model = model
        self.client = httpx.AsyncClient(
            base_url=self.base_url, timeout=60,
            headers={"Authorization": f"Bearer {require_key('ICA_API_KEY', 'elivo-ica-api-key')}"},
        )
        # 沒有 structured outputs：把 schema 寫進 system prompt，回覆再驗證
        self.system = (
            SYSTEM + "\n\n只輸出一個 JSON 物件，不要有任何說明文字或 Markdown，格式必須符合這個 JSON Schema：\n"
            + json.dumps(Extraction.model_json_schema(), ensure_ascii=False)
        )

    async def extract(self, prompt: str) -> tuple[Extraction, dict]:
        body = {
            "model": self.model, "temperature": 0, "max_tokens": 4096,
            "messages": [{"role": "system", "content": self.system}, {"role": "user", "content": prompt}],
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
            raise Skip(f"HTTP {r.status_code}：{r.text[:300]}")
        data = r.json()
        choice = data["choices"][0]
        if choice.get("finish_reason") == "length":
            raise Skip("輸出被截斷（max_tokens）")
        text = choice["message"]["content"]
        try:
            parsed = Extraction.model_validate_json(_strip_fence(text))
        except ValidationError as e:
            raise Skip(f"回覆不是合格的 JSON：{e.errors()[0]['msg']}")
        usage = data.get("usage") or {}
        return parsed, {"input_tokens": usage.get("prompt_tokens"), "output_tokens": usage.get("completion_tokens")}


def _strip_fence(text: str) -> str:
    """有些模型會包 ```json … ```，或在 JSON 前後多講話；取第一個 { 到最後一個 }。"""
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    start, end = text.find("{"), text.rfind("}")
    return text[start:end + 1] if start >= 0 and end > start else text


PROVIDERS = {"anthropic": AnthropicProvider, "ica": ICAProvider}


def to_cards(x: Extraction) -> list[dict]:
    src = lambda item: f"「{item.quote}」· {item.utt_id}"
    cards = [{"kind": "決策", "text": d.text, "source": src(d)} for d in x.decisions]
    for a in x.action_items:
        extra = "".join(f" · {label}：{v}" for label, v in (("負責", a.owner), ("期限", a.due)) if v)
        cards.append({"kind": "待辦", "text": a.task + extra, "source": src(a)})
    cards += [{"kind": "未回答問題", "text": q.question, "source": src(q)} for q in x.open_questions]
    cards += [{"kind": "數字", "text": f"{n.value}：{n.meaning}", "source": src(n)} for n in x.numbers]
    return cards


class CardExtractor:
    def __init__(self, emit, on_record, provider: str = "anthropic", model: str | None = None, interval: float = 18.0):
        self.provider = PROVIDERS[provider](model)
        self.emit, self.on_record, self.interval = emit, on_record, interval
        self.lines: list[str] = []
        self.state = Extraction(decisions=[], action_items=[], open_questions=[], numbers=[])
        self.dirty = False
        self.enabled = True

    def add_final(self, ev: dict):
        self.lines.append(f"[{ev['id']}] {ev['speaker']}：{ev['committed']}")
        self.dirty = True

    async def run(self):
        while self.enabled:
            await asyncio.sleep(self.interval)
            if self.dirty:
                await self.extract()

    async def extract(self):
        if not self.enabled:
            return
        self.dirty = False
        n_lines = len(self.lines)
        prompt = f"目前狀態：\n{self.state.model_dump_json()}\n\n逐字稿：\n" + "\n".join(self.lines[-MAX_LINES:])
        t0 = time.monotonic()
        try:
            self.state, usage = await self.provider.extract(prompt)
        except Disable as e:
            print(f"卡片：{e}，停用卡片", flush=True)
            self.enabled = False
            return
        except Retry as e:
            print(f"卡片：暫時失敗（{e}），下一輪重試", flush=True)
            self.dirty = True
            return
        except Skip as e:
            print(f"卡片：{e}", flush=True)
            return
        self.emit({"type": "cards", "cards": to_cards(self.state)})
        self.on_record({"type": "llm", "provider": self.provider.name, "model": self.provider.model,
                        "elapsed_s": time.monotonic() - t0, "n_lines": n_lines, **usage})


def llm_cost(records: list[dict]) -> float | None:
    """只有公開價格的供應商才算得出費用。"""
    total = 0.0
    for r in records:
        price = PROVIDERS[r["provider"]].price_per_mtok
        if price is None or r.get("input_tokens") is None:
            return None
        total += r["input_tokens"] * price["input"] / 1e6 + r["output_tokens"] * price["output"] / 1e6
    return total


async def _list_ica_models():
    key = require_key("ICA_API_KEY", "elivo-ica-api-key")
    async with httpx.AsyncClient(base_url=ICAProvider.base_url, timeout=30, headers={"Authorization": f"Bearer {key}"}) as c:
        r = await c.get("/chat-models/models")
    r.raise_for_status()
    for m in r.json().get("data", []):
        print(m.get("id"), "", {k: v for k, v in m.items() if k not in ("id", "object")})


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--list-ica-models", action="store_true")
    if ap.parse_args().list_ica_models:
        asyncio.run(_list_ica_models())
