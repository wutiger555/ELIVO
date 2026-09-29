"""Spike 共用設定。模型與測試資料一律放在 repo（以及 Box 同步資料夾）以外。"""
import os
from pathlib import Path

MODEL_DIR = Path(os.environ.get("ELIVO_MODEL_DIR", "~/.cache/whisper.cpp")).expanduser()
DATA_DIR = Path(os.environ.get("ELIVO_DATA_DIR", "~/ELIVO-data")).expanduser()
DATASET_DIR = DATA_DIR / "eval" / "datasets"
RUNS_DIR = DATA_DIR / "runs"

# 名稱 → ggml 檔名。對照組 large-v3-turbo 會輸出簡體，交給 textnorm 轉 s2twp。
MODELS = {
    "breeze-q8": "ggml-breeze-asr-25-q8_0.bin",
    "breeze-q5": "ggml-breeze-asr-25-q5_0.bin",
    "turbo": "ggml-large-v3-turbo.bin",
}

VAD_ONNX = MODEL_DIR / "silero_vad.onnx"
SAMPLE_RATE = 16000


def model_path(name: str) -> Path:
    path = MODEL_DIR / MODELS.get(name, name)
    if not path.exists():
        raise SystemExit(f"找不到模型：{path}（可用 ELIVO_MODEL_DIR 指定目錄）")
    return path
