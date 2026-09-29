"""Step A：離線基準。

對 DATASET_DIR 裡每個音檔、每個模型量測：
  - 整段轉寫的 RTF（處理時間 ÷ 音訊長度）
  - 滑動視窗延遲：3/5/10/15/20 秒視窗各取樣數次，看 p50/p95（這才是即時模式的瓶頸）
  - MER（有 <檔名>.ref.txt 時）與術語召回率（有 glossary.txt 時）
  - whisper-server 的 CPU、記憶體，以及溫度、GPU、功耗（macmon）

用法：
  python bench_offline.py
  python bench_offline.py --models breeze-q8,turbo --files meeting01
"""
import argparse
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

import numpy as np

from config import DATASET_DIR, MODELS, RUNS_DIR, SAMPLE_RATE
from monitor import ResourceMonitor
from textnorm import mer, term_recall
from whisper_server import WhisperServer

AUDIO_EXT = {".wav", ".m4a", ".mp3", ".mp4", ".mov", ".flac", ".aac"}


def load_audio(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def pct(vals, q):
    return float(np.percentile(vals, q)) if vals else None


def find_audio(names: list[str] | None) -> list[Path]:
    files = sorted(p for p in DATASET_DIR.rglob("*") if p.suffix.lower() in AUDIO_EXT)
    if names:
        files = [p for p in files if p.stem in names]
    if not files:
        raise SystemExit(f"{DATASET_DIR} 裡沒有音檔")
    return files


def bench_model(model: str, files: list[Path], audio: dict, windows: list[int], k: int, out: Path, glossary: list[str]):
    server = WhisperServer(model)
    load_s = server.start()
    rows = []
    try:
        server.transcribe(audio[files[0]][: SAMPLE_RATE * 3])  # 暖機，第一次會編譯 Metal kernel
        for f in files:
            pcm = audio[f]
            dur = len(pcm) / SAMPLE_RATE
            with ResourceMonitor(server.pid) as mon:
                full = server.transcribe(pcm, fallback=True)
            (out / f"{f.stem}.{model}.txt").write_text(full.text + "\n")
            (out / f"{f.stem}.{model}.segments.json").write_text(json.dumps(full.segments, ensure_ascii=False, indent=1))

            win = {}
            for sec in windows:
                if dur < sec:
                    continue
                offsets = np.linspace(0, dur - sec, k)
                lat = [server.transcribe(pcm[int(o * SAMPLE_RATE): int((o + sec) * SAMPLE_RATE)]).elapsed for o in offsets]
                win[sec] = {"p50": pct(lat, 50), "p95": pct(lat, 95)}

            row = {
                "file": f.stem, "model": model, "duration_s": dur, "load_s": load_s,
                "elapsed_s": full.elapsed, "rtf": full.elapsed / dur, "windows": win,
                "resources": mon.summary(),
            }
            ref = f.with_suffix(".ref.txt")
            if ref.exists():
                ref_text = ref.read_text()
                row["mer"] = mer(ref_text, full.text)
                if glossary:
                    row["terms"] = term_recall(ref_text, full.text, glossary)
            rows.append(row)
            print(f"  {f.stem}: RTF {row['rtf']:.3f}" + (f", MER {row['mer']['mer']:.1%}" if "mer" in row else ""), flush=True)
    finally:
        server.stop()
    return rows


def to_markdown(rows: list[dict], windows: list[int]) -> str:
    head = ["檔案", "模型", "長度", "RTF"] + [f"{w}s 視窗 p50/p95" for w in windows] + ["MER", "術語召回", "CPU% 平均", "RSS MB", "CPU°C 最高", "GPU°C 最高", "功耗 W 平均"]
    lines = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    for r in rows:
        res = r["resources"]
        g = lambda k, s: f"{res[k][s]:.0f}" if k in res else "–"
        cells = [r["file"], r["model"], f"{r['duration_s']:.0f}s", f"{r['rtf']:.3f}"]
        for w in windows:
            v = r["windows"].get(w)
            cells.append(f"{v['p50']:.2f}/{v['p95']:.2f}s" if v else "–")
        cells.append(f"{r['mer']['mer']:.1%}" if "mer" in r else "–")
        t = r.get("terms", {}).get("recall")
        cells.append(f"{t:.0%}" if t is not None else "–")
        cells += [g("cpu_pct", "mean"), g("rss_mb", "max"), g("cpu_temp", "max"), g("gpu_temp", "max"), g("power_w", "mean")]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=",".join(MODELS))
    ap.add_argument("--files", help="只跑這些檔名（不含副檔名），逗號分隔")
    ap.add_argument("--windows", default="3,5,10,15,20")
    ap.add_argument("--window-samples", type=int, default=6)
    ap.add_argument("--cooldown", type=float, default=20, help="模型之間降溫秒數")
    args = ap.parse_args()

    files = find_audio(args.files.split(",") if args.files else None)
    windows = [int(w) for w in args.windows.split(",")]
    glossary_file = DATASET_DIR / "glossary.txt"
    glossary = [t.strip() for t in glossary_file.read_text().splitlines() if t.strip()] if glossary_file.exists() else []

    out = RUNS_DIR / datetime.now().strftime("bench-%Y%m%d-%H%M%S")
    out.mkdir(parents=True)
    audio = {f: load_audio(f) for f in files}
    print(f"{len(files)} 個音檔，共 {sum(len(a) for a in audio.values()) / SAMPLE_RATE / 60:.1f} 分鐘；輸出到 {out}")

    rows = []
    models = args.models.split(",")
    for i, m in enumerate(models):
        print(f"== {m}", flush=True)
        rows += bench_model(m, files, audio, windows, args.window_samples, out, glossary)
        if i < len(models) - 1:
            time.sleep(args.cooldown)

    (out / "results.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    md = to_markdown(rows, windows)
    (out / "results.md").write_text(md + "\n")
    print("\n" + md)


if __name__ == "__main__":
    main()
