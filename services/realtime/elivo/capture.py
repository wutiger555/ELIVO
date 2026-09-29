"""音訊來源：麥克風（sounddevice）、系統音訊（apps/capture-mac/systap，Core Audio process tap），
以及測試用的音檔（device="file:<路徑>"，以實際速度播放，走完整條管線）。

每個來源把 16 kHz mono float32、512 取樣一塊的 chunk 交給 on_chunk；另外：
- spool：會議中把音訊以 int16 附加寫入 ~/ELIVO-data/spool/，意外中斷時還在，正常結束後依設定刪除或轉存 FLAC。
- level：回報音量（RMS），給會前的音量測試與會中的收音指示。
"""
import subprocess
import threading
import time
from pathlib import Path

import numpy as np

from .asr.vad import CHUNK
from .config import SAMPLE_RATE, SYSTAP

SPEAKER_SLUG = {"我": "me", "他人": "other"}


def list_devices() -> dict:
    import sounddevice as sd

    default_in = sd.default.device[0]
    inputs = [
        {"id": i, "name": d["name"], "channels": d["max_input_channels"], "default": i == default_in}
        for i, d in enumerate(sd.query_devices()) if d["max_input_channels"] > 0
    ]
    return {"inputs": inputs, "systap": SYSTAP.exists()}


class Source:
    """on_chunk(chunk) 會在背景執行緒被呼叫；呼叫端負責轉回 event loop。"""

    def __init__(self, device, on_chunk, spool: Path | None = None):
        self.device, self.on_chunk = device, on_chunk
        self.spool = spool.open("ab") if spool else None
        self.buf = np.zeros(0, dtype=np.float32)
        self.lock = threading.Lock()   # 擷取執行緒與 stop() 之間保護 spool
        self.closed = False

    def _feed(self, pcm: np.ndarray):
        with self.lock:
            if self.closed:
                return
            if self.spool:
                self.spool.write((np.clip(pcm, -1, 1) * 32767).astype("<i2").tobytes())
        self.buf = np.concatenate([self.buf, pcm])
        while len(self.buf) >= CHUNK:
            chunk, self.buf = self.buf[:CHUNK], self.buf[CHUNK:]
            self.on_chunk(chunk)

    def start(self):
        if self.device == "systap":
            self._start_systap()
        elif isinstance(self.device, str) and self.device.startswith("file:"):
            self._start_file(self.device.removeprefix("file:"))
        else:
            self._start_mic()

    def _start_file(self, path: str):
        raw = subprocess.run(
            ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(Path(path).expanduser()), "-f", "f32le", "-ac", "1",
             "-ar", str(SAMPLE_RATE), "-"], check=True, capture_output=True,
        ).stdout
        pcm = np.frombuffer(raw, dtype=np.float32)
        self.stopped = threading.Event()

        def play():
            t0 = time.monotonic()
            for i in range(0, len(pcm), CHUNK):
                if self.stopped.is_set():
                    return
                delay = t0 + (i + CHUNK) / SAMPLE_RATE - time.monotonic()
                if delay > 0:
                    time.sleep(delay)
                self._feed(pcm[i:i + CHUNK])
            while not self.stopped.wait(CHUNK / SAMPLE_RATE):  # 播完後送靜音，讓最後一句定稿
                self._feed(np.zeros(CHUNK, dtype=np.float32))

        threading.Thread(target=play, daemon=True).start()

    def _start_mic(self):
        import sounddevice as sd

        channels = min(2, sd.query_devices(self.device, "input")["max_input_channels"])
        self.stream = sd.InputStream(
            samplerate=SAMPLE_RATE, channels=channels, dtype="float32", blocksize=CHUNK, device=self.device,
            callback=lambda indata, frames, t, status: self._feed(indata.mean(axis=1).astype(np.float32)),
        )
        self.stream.start()

    def _start_systap(self):
        if not SYSTAP.exists():
            raise RuntimeError(f"找不到 {SYSTAP}，請先執行 apps/capture-mac/systap/build.sh")
        self.proc = subprocess.Popen([str(SYSTAP)], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)

        def read():
            while data := self.proc.stdout.read(CHUNK * 4):
                self._feed(np.frombuffer(data[: len(data) // 4 * 4], dtype="<f4").copy())

        threading.Thread(target=read, daemon=True).start()

    def stop(self):
        if getattr(self, "stopped", None):
            self.stopped.set()
        if self.device == "systap":
            if getattr(self, "proc", None) and self.proc.poll() is None:
                self.proc.terminate()
                self.proc.wait(timeout=5)
        elif getattr(self, "stream", None) is not None:
            self.stream.stop()
            self.stream.close()
        with self.lock:
            self.closed = True
            if self.spool:
                self.spool.close()
                self.spool = None


async def start_source(source: "Source", timeout: float = 10.0):
    """在背景執行緒開啟音訊裝置。第一次用麥克風時 macOS 會跳出權限詢問，使用者回應前 CoreAudio 會卡住；
    放在 event loop 上會讓整個服務（API、WebSocket、關閉流程）一起停住。"""
    import asyncio

    try:
        await asyncio.wait_for(asyncio.to_thread(source.start), timeout)
    except asyncio.TimeoutError:
        raise RuntimeError("無法開啟音訊裝置，可能在等待系統權限（系統設定 › 隱私權與安全性 › 麥克風）") from None


def rms(chunk: np.ndarray) -> float:
    return float(np.sqrt(np.mean(chunk ** 2)))
