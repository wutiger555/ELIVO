"""ASR 比較：同一段錄音切成相同的片段，比較模型（Breeze-ASR-25／Qwen3-ASR）與術語校正（無／讀音相同直接改／再加 LLM 確認）。

  python -m eval.asr_compare ~/ELIVO-data/eval/datasets/synthetic/meeting-names-far.wav \\
      --ref …/meeting-names.ref.txt --glossary ../../spikes/asr-realtime/fixtures/meeting-names.glossary.txt
  python -m eval.asr_compare ~/ELIVO-data/audio/<會議 id>-me.flac --glossary terms.txt   # 真實會議：沒有 ref 時只輸出逐字稿比對

- 切段：依音量找 0.5 秒以上的停頓，每段最長 25 秒（兩個模型吃同樣的片段，比較才公平）。
- 指標：MER（中文按字、英文按詞）與術語召回率；沒有 ref 時列出兩個模型的逐段結果，人工比對。
- 結果存在 ~/ELIVO-data/runs/asr-compare-<檔名>.json。
Breeze 用另一個 port 的 whisper-server，不影響正在跑的 ELIVO 服務。
"""
import argparse
import asyncio
import json
import re
import subprocess
import tempfile
import time
from pathlib import Path

import numpy as np
import soundfile as sf

from elivo.asr.textnorm import mer, term_recall, to_tw
from elivo.asr.whisper_server import WhisperServer
from elivo.config import RUNS_DIR
from elivo.glossfix import GlossaryFixer
from elivo.llm import PROVIDERS
from elivo.minutes import FIX_FORMAT, FIX_SYSTEM, FixVerdict
from elivo.session import split_glossary

SR = 16000
QWEN_PY = Path("~/.venvs/qwen3-asr/bin/python").expanduser()
HERE = Path(__file__).parent


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def segments(pcm: np.ndarray, min_gap=0.5, max_len=25.0) -> list[tuple[int, int]]:
    """依音量切段：以 20 ms 為一格，低於（第 20 百分位 × 3）視為靜音。"""
    hop = SR // 50
    rms = np.sqrt(np.add.reduceat(pcm ** 2, np.arange(0, len(pcm), hop)) / hop)
    quiet = rms < max(np.percentile(rms, 20) * 3, 1e-4)
    segs, start, silent = [], None, 0
    for i, q in enumerate(quiet):
        if not q:
            start = i if start is None else start
            silent = 0
        elif start is not None:
            silent += 1
            if silent * 0.02 >= min_gap:
                segs.append((start, i - silent + 1))
                start, silent = None, 0
        if start is not None and (i - start) * 0.02 >= max_len:
            segs.append((start, i + 1))
            start, silent = None, 0
    if start is not None:
        segs.append((start, len(quiet)))
    return [(max(0, a * hop - SR // 5), min(len(pcm), b * hop + SR // 5)) for a, b in segs if (b - a) * 0.02 >= 0.3]


def breeze(pcm, segs, prompt, port):
    server = WhisperServer("breeze-q8", port=port)
    server.start()
    try:
        t0 = time.time()
        out = [to_tw(server.transcribe(pcm[a:b], prompt=prompt, fallback=True).text.strip()) for a, b in segs]
        return out, time.time() - t0
    finally:
        server.stop()


def qwen(pcm, segs, context):
    with tempfile.TemporaryDirectory() as tmp:
        files = []
        for i, (a, b) in enumerate(segs):
            f = Path(tmp) / f"{i:04d}.wav"
            sf.write(f, pcm[a:b], SR)
            files.append(str(f))
        r = subprocess.run([str(QWEN_PY), str(HERE / "qwen_transcribe.py"), "--context", context, *files],
                           check=True, capture_output=True, text=True)
    d = json.loads(r.stdout)
    return [to_tw(t.strip()) for t in d["texts"]], d["infer_s"], d


async def llm_fix(fixer, texts, provider, model):
    llm = PROVIDERS[provider]()
    out, calls = [], 0
    for i, text in enumerate(texts):
        f = fixer.fix(text)
        if f.candidates:
            calls += 1
            listed = "\n".join(f"{j}. 「{c['from']}」→「{c['to']}」" for j, c in enumerate(f.candidates))
            ctx = "\n".join(texts[max(0, i - 2):i])
            prompt = (f"前文：\n{ctx}\n" if ctx else "") + f"這句：{f.text}\n候選：\n{listed}"
            try:
                v, _ = await llm.complete_json(model, FIX_SYSTEM, prompt, FixVerdict, 100, format_hint=FIX_FORMAT)
                text = fixer.apply(f.text, f.candidates, v.accept)[0]
            except Exception as e:   # LLM 失敗就只用直接修改的結果
                print(f"  LLM 失敗：{e}")
                text = f.text
        else:
            text = f.text
        out.append(text)
    return out, calls


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio", type=Path)
    ap.add_argument("--ref", type=Path)
    ap.add_argument("--glossary", type=Path)
    ap.add_argument("--models", default="breeze,qwen")
    ap.add_argument("--llm", default="ica", help="術語候選的 LLM 確認：ica／anthropic／none")
    ap.add_argument("--llm-model", default="claude-haiku-4-5")
    ap.add_argument("--port", type=int, default=8189)
    a = ap.parse_args()

    terms = split_glossary(a.glossary.read_text()) if a.glossary else []
    fixer = GlossaryFixer(terms)
    pcm = load(a.audio)
    segs = segments(pcm)
    print(f"{a.audio.name}：{len(pcm) / SR:.0f} 秒，{len(segs)} 段，術語 {len(terms)} 個")
    # ref 每行可能帶「說話者：」前綴，計分前去掉
    ref = "\n".join(re.sub(r"^[^：]{1,6}：", "", l) for l in a.ref.read_text().splitlines()) if a.ref else None

    runs = {}
    if "breeze" in a.models.split(","):
        runs["breeze"], t = breeze(pcm, segs, fixer.prompt(), a.port)
        print(f"  Breeze-ASR-25：{t:.1f} 秒")
    models = a.models.split(",")
    if "qwen" in models:
        runs["qwen"], t, d = qwen(pcm, segs, ("術語：" + "、".join(terms)) if terms else "")
        print(f"  Qwen3-ASR-1.7B（{d['device']}）：載入 {d['load_s']} 秒、推論 {t} 秒")
    if "qwen-noctx" in models:   # 不給術語：看 context 偏置是幫忙還是造成幻覺
        runs["qwen-noctx"], t, d = qwen(pcm, segs, "")
        print(f"  Qwen3-ASR-1.7B 不給術語：推論 {t} 秒")

    variants = {}
    for name, texts in runs.items():
        variants[name] = texts
        if terms:
            variants[f"{name}+校正"] = [fixer.fix(t).text for t in texts]
            if a.llm != "none":
                variants[f"{name}+校正+LLM"], calls = asyncio.run(llm_fix(fixer, texts, a.llm, a.llm_model))
                print(f"  {name}：LLM 確認 {calls} 句")

    rows = []
    for name, texts in variants.items():
        hyp = "\n".join(texts)
        row = {"variant": name}
        if ref:
            m = mer(ref, hyp)
            row["mer"] = m["mer"] if isinstance(m, dict) else m
            if terms:
                tr = term_recall(ref, hyp, terms)
                row.update(term_recall=tr["recall"], term_hit=f"{tr['hit']}/{tr['total']}", missed=tr["missed"])
        rows.append(row)

    print()
    for r in rows:
        extra = f"  MER {r['mer']:.3f}" if "mer" in r else ""
        if "term_recall" in r:
            extra += f"  術語 {r['term_hit']}（{r['term_recall']:.0%}）  漏掉：{'、'.join(r['missed']) or '—'}"
        print(f"{r['variant']:<18}{extra}")

    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    out = RUNS_DIR / f"asr-compare-{a.audio.stem}.json"
    out.write_text(json.dumps({"audio": str(a.audio), "segments": [(s / SR, e / SR) for s, e in segs], "rows": rows,
                               "texts": variants}, ensure_ascii=False, indent=1))
    # 逐段並列（沒有標準答案時人工比對用）
    names = list(variants)
    md = [f"# {a.audio.name}", "", "| 時間 | " + " | ".join(names) + " |", "|---|" + "---|" * len(names)]
    for i, (st, en) in enumerate(segs):
        cells = [variants[n][i].replace("|", "｜") for n in names]
        md.append(f"| {int(st / SR) // 60:02d}:{int(st / SR) % 60:02d} | " + " | ".join(cells) + " |")
    out.with_suffix(".md").write_text("\n".join(md) + "\n")
    print(f"\n逐段結果：{out}\n並列比對：{out.with_suffix('.md')}")


if __name__ == "__main__":
    main()
