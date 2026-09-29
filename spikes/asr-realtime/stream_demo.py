"""Step B：即時麥克風 demo。

麥克風（或 --replay 音檔，以實際速度播放）→ Silero VAD → 滑動視窗 ASR → WebSocket → 網頁。
網頁綁在 0.0.0.0，同一個 Wi-Fi 的 iPad／手機可以直接開。

用法：
  python stream_demo.py                          # 預設麥克風、Breeze q8
  python stream_demo.py --list-devices
  python stream_demo.py --mic-device 2 --model turbo
  python stream_demo.py --replay ~/ELIVO-data/eval/datasets/meeting01.m4a --once
"""
import argparse
import asyncio
import json
import socket
import time
from datetime import datetime
from http import HTTPStatus
from pathlib import Path

import numpy as np
from websockets.asyncio.server import broadcast, serve
from websockets.datastructures import Headers
from websockets.http11 import Response

from bench_offline import load_audio
from config import RUNS_DIR, SAMPLE_RATE
from stream_engine import StreamEngine
from vad import CHUNK
from whisper_server import WhisperServer

PAGE = Path(__file__).parent / "static" / "index.html"


class Hub:
    """保存目前的逐字稿狀態，廣播給所有連線；新連線（例如晚開的 iPad）先收到完整快照。"""

    def __init__(self, status: dict):
        self.clients = set()
        self.utts: dict[str, dict] = {}
        self.status = status

    def emit(self, ev: dict):
        if ev["type"] == "utt":
            if ev["final"] and not ev["committed"]:
                self.utts.pop(ev["id"], None)  # 定稿後是空的（雜訊或幻覺）→ 移除
            else:
                self.utts[ev["id"]] = ev
        elif ev["type"] == "stats":
            self.status["stats"] = ev["stats"]
        broadcast(self.clients, json.dumps(ev, ensure_ascii=False))

    async def handler(self, ws):
        self.clients.add(ws)
        try:
            await ws.send(json.dumps({"type": "snapshot", "utts": list(self.utts.values()), "status": self.status}, ensure_ascii=False))
            async for _ in ws:
                pass
        finally:
            self.clients.discard(ws)


def process_request(connection, request):
    if request.path == "/ws":
        return None
    if request.path in ("/", "/index.html"):
        body = PAGE.read_bytes()
        headers = Headers([("Content-Type", "text/html; charset=utf-8"), ("Content-Length", str(len(body))), ("Cache-Control", "no-store")])
        return Response(HTTPStatus.OK, "OK", headers, body)
    return connection.respond(HTTPStatus.NOT_FOUND, "not found\n")


class Stats:
    """首字延遲、定稿延遲、單次推論時間，寫 JSONL 並即時推給網頁。"""

    def __init__(self, hub: Hub, path: Path):
        self.hub, self.file = hub, path.open("w")
        self.first, self.final, self.infer = [], [], []

    def record(self, rec: dict):
        rec["ts"] = time.time()
        self.file.write(json.dumps(rec, ensure_ascii=False) + "\n")
        self.file.flush()
        if rec["type"] == "infer":
            self.infer.append(rec["elapsed_s"])
            return
        if rec.get("first_latency_s") is not None:
            self.first.append(rec["first_latency_s"])
        if rec.get("final_latency_s") is not None:
            self.final.append(rec["final_latency_s"])
        self.hub.emit({"type": "stats", "stats": self.summary()})

    def summary(self) -> dict:
        p = lambda v, q: round(float(np.percentile(v, q)), 2) if v else None
        return {
            "utterances": len(self.final),
            "first_p50": p(self.first, 50), "first_p95": p(self.first, 95),
            "final_p50": p(self.final, 50), "final_p95": p(self.final, 95),
            "infer_p50": p(self.infer, 50), "infer_p95": p(self.infer, 95),
        }


def start_mic(loop, queue: asyncio.Queue, device):
    import sounddevice as sd

    def callback(indata, frames, t, status):
        loop.call_soon_threadsafe(queue.put_nowait, indata[:, 0].copy())

    stream = sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="float32", blocksize=CHUNK, device=device, callback=callback)
    stream.start()
    return stream


async def replay(queue: asyncio.Queue, pcm: np.ndarray, speed: float):
    """以實際速度把音檔切成 chunk 餵進去，延遲才是真實的。結尾補 1 秒靜音讓最後一句定稿。"""
    pcm = np.concatenate([pcm, np.zeros(SAMPLE_RATE, dtype=np.float32)])
    t0 = time.monotonic()
    for i in range(0, len(pcm) - CHUNK + 1, CHUNK):
        delay = t0 + (i + CHUNK) / SAMPLE_RATE / speed - time.monotonic()
        if delay > 0:
            await asyncio.sleep(delay)
        queue.put_nowait(pcm[i:i + CHUNK])
    queue.put_nowait(None)


def lan_ip() -> str:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("10.255.255.255", 1))  # 不會真的送出封包，只是讓系統選網卡
            return s.getsockname()[0]
        except OSError:
            return "127.0.0.1"


async def main(args):
    asr = WhisperServer(args.model)
    print(f"載入 {args.model} …", flush=True)
    load_s = asr.start()
    asr.transcribe(np.zeros(SAMPLE_RATE, dtype=np.float32))  # 暖機
    print(f"模型就緒（{load_s:.1f}s）", flush=True)

    source = f"replay:{Path(args.replay).name}" if args.replay else "mic"
    hub = Hub({"model": args.model, "source": source})
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    log_path = RUNS_DIR / datetime.now().strftime(f"stream-%Y%m%d-%H%M%S-{args.model}.jsonl")
    stats = Stats(hub, log_path)

    queue: asyncio.Queue = asyncio.Queue()
    engine = StreamEngine(asr, asyncio.Lock(), "我", hub.emit, step=args.step, min_silence=args.min_silence,
                          max_utt=args.max_utt, prompt=args.prompt, on_record=stats.record)
    loop = asyncio.get_running_loop()
    mic = None
    try:
        async with serve(hub.handler, args.host, args.port, process_request=process_request):
            print(f"開啟：http://localhost:{args.port}  （iPad：http://{lan_ip()}:{args.port}）", flush=True)
            if args.replay:
                pcm = load_audio(Path(args.replay).expanduser())
                await asyncio.gather(replay(queue, pcm, args.speed), engine.run(queue))
                print(json.dumps(stats.summary(), ensure_ascii=False))
                if not args.once:
                    print("重播結束，網頁保持開啟；Ctrl-C 離開", flush=True)
                    await asyncio.Future()
            else:
                mic = start_mic(loop, queue, args.mic_device)
                print("麥克風收音中；Ctrl-C 離開", flush=True)
                await engine.run(queue)
    finally:
        if mic:
            mic.stop()
        asr.stop()
        print(f"紀錄：{log_path}")
        print(json.dumps(stats.summary(), ensure_ascii=False))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="breeze-q8")
    ap.add_argument("--mic-device", type=lambda s: int(s) if s.isdigit() else s, default=None)
    ap.add_argument("--replay", help="用音檔代替麥克風（以實際速度播放）")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--once", action="store_true", help="重播結束就離開")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--step", type=float, default=0.5, help="每累積幾秒新音訊重算一次")
    ap.add_argument("--min-silence", type=float, default=0.6, help="靜音幾秒視為句尾")
    ap.add_argument("--max-utt", type=float, default=15.0, help="單句最長秒數，超過就切")
    ap.add_argument("--prompt", help="initial prompt，例如術語表")
    ap.add_argument("--list-devices", action="store_true")
    args = ap.parse_args()
    if args.list_devices:
        import sounddevice as sd
        print(sd.query_devices())
    else:
        try:
            asyncio.run(main(args))
        except KeyboardInterrupt:
            pass
