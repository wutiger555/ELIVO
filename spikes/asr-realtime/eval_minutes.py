"""檢查會議記錄的最終狀態是否符合 fixtures/<name>.expect.json。

  python eval_minutes.py meeting-reversal                       # 用 runs/ 裡最新的 minutes-*.json
  python eval_minutes.py meeting-reversal --minutes path/to/minutes.json
"""
import argparse
import json
from pathlib import Path

from config import RUNS_DIR


def haystack(item: dict) -> str:
    return " ".join(str(item.get(k) or "") for k in ("text", "value", "answer", "owner")).lower()


def check(items: list[dict], c: dict) -> tuple[bool, list[dict]]:
    cands = [
        it for it in items
        if it["kind"] == c["kind"] and it["status"] != "retracted"
        and any(m.lower() in haystack(it) for m in c["match"])
        and not any(x.lower() in haystack(it) for x in c.get("exclude", []))
    ]
    ok = [
        it for it in cands
        if it["status"] in c["status"]
        and (not c.get("owner") or any(o in (it.get("owner") or "") for o in c["owner"]))
        and (not c.get("answer") or any(a in (it.get("answer") or "") for a in c["answer"]))
    ]
    return bool(ok), cands


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--minutes", type=Path)
    args = ap.parse_args()
    path = args.minutes or max(RUNS_DIR.glob("minutes-*.json"), key=lambda p: p.stat().st_mtime)
    items = json.loads(path.read_text())["items"]
    spec = json.loads((Path(__file__).parent / "fixtures" / f"{args.name}.expect.json").read_text())

    passed = 0
    for c in spec["checks"]:
        ok, cands = check(items, c)
        passed += ok
        print(f"{'✅' if ok else '❌'} {c['name']}")
        if not ok:
            for it in cands or [{"id": "—", "text": "（找不到符合的項目）", "status": ""}]:
                print(f"     {it['id']} [{it['status']}] {it.get('value') or ''} {it['text']} 負責={it.get('owner')} 答案={it.get('answer')}")
    print(f"\n{passed}/{len(spec['checks'])} 通過（{path.name}）")


if __name__ == "__main__":
    main()
