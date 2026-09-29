"""啟動 whisper.cpp 的 whisper-server（Metal），模型只載入一次，之後以 HTTP 送音訊推論。

離線基準與即時 demo 走同一條路徑，量到的延遲才可比較。
"""
import atexit
import io
import signal
import socket
import subprocess
import sys
import time
from dataclasses import dataclass, field

import httpx
import numpy as np
import soundfile as sf

from config import RUNS_DIR, SAMPLE_RATE, model_path
from textnorm import to_tw


@dataclass
class Result:
    text: str
    segments: list = field(default_factory=list)  # [{"start": s, "end": s, "text": str}]
    elapsed: float = 0.0


class WhisperServer:
    def __init__(self, model: str, port: int = 8178, threads: int = 4, language: str = "zh"):
        self.model = model
        self.port = port
        self.threads = threads
        self.language = language
        self.proc: subprocess.Popen | None = None
        self.url = f"http://127.0.0.1:{port}"
        self.client = httpx.Client(timeout=300)

    def start(self, timeout: float = 180) -> float:
        """回傳模型載入秒數。"""
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        log = open(RUNS_DIR / f"whisper-server-{self.model}.log", "w")
        cmd = [
            "whisper-server", "-m", str(model_path(self.model)),
            "--host", "127.0.0.1", "--port", str(self.port),
            "-t", str(self.threads), "-l", self.language,
            # verbose_json 預設會另算語言機率，等於多跑一次 encoder，延遲幾乎翻倍
            "--no-language-probabilities",
        ]
        # 埠已被占用時，健康檢查會連到別人的 server（例如上次殘留的其他模型），量到的數字就錯了
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", self.port)) == 0:
                raise RuntimeError(f"port {self.port} 已被占用，請先結束殘留的 whisper-server（pkill whisper-server）")
        # 被 SIGTERM（kill、pkill）結束時也要收掉子行程，否則會殘留並占住 port
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))
        atexit.register(self.stop)
        t0 = time.perf_counter()
        self.proc = subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT)
        while time.perf_counter() - t0 < timeout:
            if self.proc.poll() is not None:
                raise RuntimeError(f"whisper-server 啟動失敗，見 {log.name}")
            try:
                if self.client.get(self.url + "/").status_code == 200 and self.proc.poll() is None:
                    return time.perf_counter() - t0
            except httpx.TransportError:
                pass
            time.sleep(0.2)
        raise TimeoutError("whisper-server 啟動逾時")

    def stop(self):
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()
            self.proc.wait(timeout=10)

    @property
    def pid(self) -> int | None:
        return self.proc.pid if self.proc else None

    def transcribe(self, pcm: np.ndarray, prompt: str | None = None, fallback: bool = False) -> Result:
        """pcm：16 kHz mono float32。fallback=False 關閉溫度重試，避免串流時偶發數秒延遲。"""
        buf = io.BytesIO()
        sf.write(buf, pcm, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        data = {
            "response_format": "verbose_json",
            "language": self.language,
            "temperature": "0.0",
            "temperature_inc": "0.2" if fallback else "0.0",
        }
        if prompt:
            data["prompt"] = prompt
        t0 = time.perf_counter()
        r = self.client.post(self.url + "/inference", files={"file": ("a.wav", buf.getvalue(), "audio/wav")}, data=data)
        elapsed = time.perf_counter() - t0
        r.raise_for_status()
        body = r.json()
        segments = [
            {"start": s["start"], "end": s["end"], "text": to_tw(s["text"]).strip()}
            for s in body.get("segments", [])
        ]
        text = join_segments(segments)
        return Result(text=text, segments=segments, elapsed=elapsed)

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *exc):
        self.stop()


def join_segments(segments) -> str:
    """段落之間：兩側都是英數才補空白。"""
    out = ""
    for s in segments:
        t = s["text"]
        if out and t and out[-1].isascii() and out[-1].isalnum() and t[0].isascii() and t[0].isalnum():
            out += " "
        out += t
    return out
