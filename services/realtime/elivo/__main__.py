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
    ap.add_argument("--economy-fast-model", default=d.economy_fast_model)
    ap.add_argument("--economy-reflect-model", default=d.economy_reflect_model)
    ap.add_argument("--quality-fast-model", default=d.quality_fast_model)
    ap.add_argument("--quality-reflect-model", default=d.quality_reflect_model)
    a = ap.parse_args()
    settings = Settings(port=a.port, asr_model=a.asr_model, asr_port=a.asr_port, llm_provider=a.llm_provider,
                        economy_fast_model=a.economy_fast_model, economy_reflect_model=a.economy_reflect_model,
                        quality_fast_model=a.quality_fast_model, quality_reflect_model=a.quality_reflect_model)
    # 關閉時最多等 5 秒讓瀏覽器的 WebSocket 斷線，之後照樣執行收尾（暫停會議、關掉 whisper-server）
    uvicorn.run(create_app(settings), host="0.0.0.0", port=a.port, log_level="warning", timeout_graceful_shutdown=5)
