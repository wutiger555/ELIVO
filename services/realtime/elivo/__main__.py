"""啟動 ELIVO 即時服務：python -m elivo [--port 8765] [--asr-model breeze-q8] …

網頁綁在 0.0.0.0，讓同一個 Wi-Fi 的 iPad／手機能以第二螢幕（唯讀、需配對碼）開啟；管理功能只接受本機。
"""
import argparse

import uvicorn

from .api import Settings, create_app

if __name__ == "__main__":
    d = Settings()
    ap = argparse.ArgumentParser(prog="python -m elivo")
    ap.add_argument("--port", type=int, default=d.port)
    ap.add_argument("--asr-model", default=d.asr_model)
    ap.add_argument("--asr-port", type=int, default=d.asr_port)
    ap.add_argument("--llm-provider", default=d.llm_provider, choices=["ica", "anthropic"])
    ap.add_argument("--fast-model", default=d.fast_model)
    ap.add_argument("--reflect-model", default=d.reflect_model)
    a = ap.parse_args()
    settings = Settings(port=a.port, asr_model=a.asr_model, asr_port=a.asr_port, llm_provider=a.llm_provider,
                        fast_model=a.fast_model, reflect_model=a.reflect_model)
    uvicorn.run(create_app(settings), host="0.0.0.0", port=a.port, log_level="warning")
