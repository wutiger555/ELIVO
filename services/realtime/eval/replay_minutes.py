"""會議記錄的成本與品質量測：用台詞文字模擬會議時間軸（跳過 ASR），跑真的 LLM。

每句的時間依字數估算（每秒 4.5 字、句間停頓 1.2 秒），引擎依策略決定何時呼叫 fast／reflect。
輸出：呼叫次數、token、推估每會議小時成本、以及對照 fixtures/<名稱>.expect.json 的正確率。

  python -m eval.replay_minutes meeting-long --policy economy
  python -m eval.replay_minutes meeting-long --policy quality --policy economy     # 並排比較
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from elivo.minutes import POLICIES, MinutesEngine  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"
CHARS_PER_SEC, GAP_S = 4.5, 1.2
# US$／百萬 tokens。Claude 為 Anthropic 公開價；ICA 上的其他模型沒有公開價，按同級公開模型估算（見 docs/research/B）
PRICE = {
    "claude-haiku-4-5": (1.0, 5.0), "claude-sonnet-4-6": (3.0, 15.0),
    "gemini-3.6-flash": (0.75, 3.75),              # Gemini 3.6 Flash 公開價（2026 年底前）
    "gpt-5.6-luna-dzus": (0.25, 2.0),              # 以 GPT-5-mini 級估算（偏保守）
    "gemma-4-26b-a4b-it": (0.05, 0.40),            # 開源模型自架，以 nano 級估算
    "meta-llama/llama-4-maverick-17b-128e-instruct-fp8": (0.20, 0.60),   # 開源模型託管，以常見託管價估算
}


def load_script(name: str) -> list[dict]:
    rows = [l.split("|", 1) for l in (FIXTURES / f"{name}.txt").read_text().splitlines() if l.strip() and not l.startswith("#")]
    t, lines, n = 0.0, [], {}
    for speaker, text in rows:
        dur = max(1.5, len(text) / CHARS_PER_SEC)
        t += dur
        n[speaker] = n.get(speaker, 0) + 1
        lines.append({"id": f"{speaker}-{n[speaker]}", "speaker": speaker, "committed": text, "t": round(t, 1)})
        t += GAP_S
    return lines


def haystack(item: dict) -> str:
    return " ".join(str(item.get(k) or "") for k in ("text", "value", "answer", "owner")).lower()


def check(items: list[dict], c: dict) -> bool:
    if "any_of" in c:   # 同一件事有幾種合理的記法（例如「決策」或「問題已回答」）
        return any(check(items, sub) for sub in c["any_of"])
    ok = lambda it: (
        it["kind"] in (c["kind"] if isinstance(c["kind"], list) else [c["kind"]]) and it["status"] != "retracted"
        and any(m.lower() in haystack(it) for m in c.get("match", [""]))
        and all(m.lower() in haystack(it) for m in c.get("match_all", []))
        and not any(x.lower() in haystack(it) for x in c.get("exclude", []))
        and it["status"] in c["status"]
        and (not c.get("owner") or any(o in (it.get("owner") or "") for o in c["owner"]))
        and (not c.get("answer") or any(a in (it.get("answer") or "") for a in c["answer"]))
    )
    return any(ok(it) for it in items)


async def replay(name: str, policy: str, fast_model: str, reflect_model: str, provider: str):
    lines = load_script(name)
    glossary_file = FIXTURES / f"{name}.glossary.txt"
    glossary = glossary_file.read_text().split() if glossary_file.exists() else None
    clock = {"t": 0.0}
    records = []
    engine = MinutesEngine(lambda ev: None, records.append, clock=lambda: clock["t"], provider=provider,
                           fast_model=fast_model, reflect_model=reflect_model, policy=policy, glossary=glossary)
    for line in lines:
        # 句子之間每秒 tick 一次，跟即時服務的節奏一樣
        while clock["t"] + 1.0 < line["t"]:
            clock["t"] += 1.0
            await engine.tick()
        clock["t"] = line["t"]
        engine.add_final(line)
        await engine.tick()
    clock["t"] += 5.0
    await engine.finish()

    duration = lines[-1]["t"] + GAP_S
    llm = [r for r in records if r["type"] == "llm"]
    cost = sum(r["input_tokens"] * PRICE[r["model"]][0] / 1e6 + r["output_tokens"] * PRICE[r["model"]][1] / 1e6
               for r in llm if r.get("input_tokens") is not None and r["model"] in PRICE)
    spec = json.loads((FIXTURES / f"{name}.expect.json").read_text())
    items = engine.export()["items"]
    results = [(c["name"], check(items, c)) for c in spec["checks"]]
    from elivo.config import RUNS_DIR
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    stem = RUNS_DIR / f"replay-{name}-{policy}-{fast_model.replace('/', '_')}"
    stem.with_suffix(".md").write_text(engine.to_markdown())
    stem.with_suffix(".json").write_text(json.dumps({"minutes": engine.export(), "llm": llm}, ensure_ascii=False, indent=1))
    return {
        "policy": f"{policy}／fast={fast_model}", "duration_min": duration / 60,
        "fast_calls": sum(r["pass"] == "fast" for r in llm), "reflect_calls": sum(r["pass"] == "reflect" for r in llm),
        "input_tokens": sum(r.get("input_tokens") or 0 for r in llm), "output_tokens": sum(r.get("output_tokens") or 0 for r in llm),
        "cost": cost, "cost_per_hour": cost / duration * 3600,
        "score": sum(ok for _, ok in results), "total": len(results), "results": results, "markdown": engine.to_markdown(),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--policy", action="append", choices=list(POLICIES), help="可重複，並排比較")
    ap.add_argument("--fast-model", default="claude-haiku-4-5")
    ap.add_argument("--reflect-model", default="claude-haiku-4-5")
    ap.add_argument("--provider", default="ica")
    ap.add_argument("--show", action="store_true", help="印出最後的會議記錄")
    args = ap.parse_args()
    out = []
    for policy in args.policy or ["economy"]:
        r = asyncio.run(replay(args.name, policy, args.fast_model, args.reflect_model, args.provider))
        out.append(r)
        print(f"\n== {policy}：{r['duration_min']:.1f} 分鐘會議，fast {r['fast_calls']} 次、reflect {r['reflect_calls']} 次，"
              f"tokens {r['input_tokens']:,}／{r['output_tokens']:,}，成本 US${r['cost']:.3f}（每小時 US${r['cost_per_hour']:.2f}），"
              f"正確 {r['score']}/{r['total']}")
        for n, ok in r["results"]:
            print(f"  {'✅' if ok else '❌'} {n}")
        if args.show:
            print(r["markdown"])
    if len(out) > 1:
        print("\n| 策略 | fast | reflect | input／output tokens | 每小時成本 | 正確 |\n|---|---|---|---|---|---|")
        for r in out:
            print(f"| {r['policy']} | {r['fast_calls']} | {r['reflect_calls']} | {r['input_tokens']:,}／{r['output_tokens']:,} | "
                  f"US${r['cost_per_hour']:.2f} | {r['score']}/{r['total']} |")


if __name__ == "__main__":
    main()
