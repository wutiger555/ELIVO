"""「前面說過」提示的量測（不用 LLM）：用逐字稿句子當索引，列出每個提示的觸發句與目標。

  python -m eval.replay_recall meeting-long
fixtures/<名稱>.recall.json（選用）列出期望的「觸發句 id → 可接受的目標句 id」，用來算命中與誤報。
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from elivo.recall import Recall  # noqa: E402
from eval.replay_minutes import FIXTURES, load_script  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--threshold", type=float, default=4.0)
    args = ap.parse_args()
    lines = load_script(args.name)
    text = {l["id"]: l["committed"] for l in lines}
    glossary_file = FIXTURES / f"{args.name}.glossary.txt"
    r = Recall(glossary_file.read_text().split() if glossary_file.exists() else None, threshold=args.threshold)
    hints = [h for l in lines if (h := r.add_utt(l["id"], l["speaker"], l["committed"], l["t"]))]
    for h in hints:
        tgt = h["target"].split(":", 1)[1]
        print(f"[{h['t']:5.0f}s] {h['trigger']}「{text[h['trigger']][:28]}」\n        → {tgt}「{text.get(tgt, '')[:28]}」 分數 {h['score']} 相符 {h['matched']}")
    spec_file = FIXTURES / f"{args.name}.recall.json"
    if spec_file.exists():
        spec = json.loads(spec_file.read_text())["expect"]
        got = {h["trigger"]: h["target"].split(":", 1)[1] for h in hints}
        hit = sum(1 for trig, ok in spec.items() if got.get(trig) in ok)
        fp = [t for t in got if t not in spec]
        print(f"\n期望 {len(spec)} 個提示，命中 {hit}；其他 {len(fp)} 個提示：{fp}")
    print(f"共 {len(hints)} 個提示／{len(lines)} 句")


if __name__ == "__main__":
    main()
