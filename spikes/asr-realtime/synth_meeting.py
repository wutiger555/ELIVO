"""把 fixtures/<name>.txt 的台詞用 macOS 語音合成成兩軌音檔（「我」一軌、「他人」一軌，時間軸對齊）。

另一個人說話時該軌是靜音，所以兩軌可以直接餵給 stream_demo.py 的兩路：
  python synth_meeting.py meeting-reversal
  python stream_demo.py --minutes --once \\
    --replay ~/ELIVO-data/eval/datasets/synthetic/meeting-reversal-me.wav \\
    --replay-system ~/ELIVO-data/eval/datasets/synthetic/meeting-reversal-other.wav

合成語音不含真人資料，只用於驗證管線與會議記錄邏輯，不能代表真實會議的辨識品質。
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

from config import DATASET_DIR, SAMPLE_RATE

VOICES = {"我": "Meijia", "他人": "Flo (中文（台灣）)"}
GAP_S = 1.2


def tts(voice: str, text: str, tmp: Path) -> np.ndarray:
    aiff = tmp / "line.aiff"
    subprocess.run(["say", "-v", voice, "-o", str(aiff), text], check=True)
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(aiff), "-f", "f32le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name", help="fixtures/ 底下的台詞檔名（不含 .txt）")
    args = ap.parse_args()
    script = Path(__file__).parent / "fixtures" / f"{args.name}.txt"
    lines = [l.split("|", 1) for l in script.read_text().splitlines() if l.strip() and not l.startswith("#")]

    tracks = {who: [] for who in VOICES}
    gap = np.zeros(int(GAP_S * SAMPLE_RATE), dtype=np.float32)
    with tempfile.TemporaryDirectory() as d:
        for who, text in lines:
            pcm = tts(VOICES[who], text, Path(d))
            for other in VOICES:
                tracks[other].append(pcm if other == who else np.zeros_like(pcm))
                tracks[other].append(gap)

    out = DATASET_DIR / "synthetic"
    out.mkdir(parents=True, exist_ok=True)
    for who, suffix in (("我", "me"), ("他人", "other")):
        sf.write(out / f"{args.name}-{suffix}.wav", np.concatenate(tracks[who]), SAMPLE_RATE, subtype="PCM_16")
    (out / f"{args.name}.ref.txt").write_text("\n".join(f"{who}：{text}" for who, text in lines) + "\n")
    dur = sum(len(x) for x in tracks["我"]) / SAMPLE_RATE
    print(f"{len(lines)} 句、{dur:.0f} 秒 → {out}/{args.name}-{{me,other}}.wav")


if __name__ == "__main__":
    main()
