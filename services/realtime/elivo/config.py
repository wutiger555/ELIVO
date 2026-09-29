"""服務設定。模型、資料庫、音訊暫存一律放在 repo 以外。"""
import os
from pathlib import Path

MODEL_DIR = Path(os.environ.get("ELIVO_MODEL_DIR", "~/.cache/whisper.cpp")).expanduser()
DATA_DIR = Path(os.environ.get("ELIVO_DATA_DIR", "~/ELIVO-data")).expanduser()
DB_PATH = DATA_DIR / "elivo.db"
SPOOL_DIR = DATA_DIR / "spool"   # 會議中的音訊暫存：正常結束時刪除（除非該場選擇保存），意外中斷時保留
AUDIO_DIR = DATA_DIR / "audio"   # 使用者選擇保存的錄音（FLAC）
RUNS_DIR = DATA_DIR / "runs"     # whisper-server log、延遲紀錄

REPO = Path(__file__).resolve().parents[3]
SYSTAP = REPO / "apps" / "capture-mac" / "systap" / "systap"
WEB_DIST = REPO / "apps" / "web" / "dist"

# 名稱 → ggml 檔名。large-v3-turbo 會輸出簡體，由 textnorm 轉 s2twp。
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
