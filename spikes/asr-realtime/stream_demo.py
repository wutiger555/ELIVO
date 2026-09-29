"""Step B／C：即時逐字稿 demo。

麥克風（或 --replay 音檔，以實際速度播放）→ Silero VAD → 滑動視窗 ASR → WebSocket → 網頁。
網頁綁在 0.0.0.0，同一個 Wi-Fi 的 iPad／手機可以直接開。
Step C：--system-device 再開一路系統音訊，標為「他人」；兩路共用同一個 ASR。
  --system-device systap 用 Core Audio process tap（systap/，免安裝驅動）；也可以給 BlackHole 等輸入裝置。

用法：
  python stream_demo.py                          # 預設麥克風、Breeze q8
  python stream_demo.py --list-devices
  python stream_demo.py --mic-device 2 --model turbo
  python stream_demo.py --replay ~/ELIVO-data/eval/datasets/meeting01.m4a --once
  python stream_demo.py --system-device systap               # 麥克風＝我、系統音訊＝他人
  python stream_demo.py --cards                              # Step D：右欄顯示 Claude Haiku 4.5 抽出的卡片
  python stream_demo.py --cards --cards-provider ica --cards-model <id>   # 改用 IBM Consulting Advantage
"""
import argparse
import asyncio
import json
import signal
import socket
import subprocess
import threading
import time
from datetime import datetime
from http import HTTPStatus
from pathlib import Path

import numpy as np
from websockets.asyncio.server import broadcast, serve
from websockets.datastructures import Headers
from websockets.exceptions import ConnectionClosed
from websockets.http11 import Response

from bench_offline import load_audio
from cards import CardExtractor, llm_cost
from config import RUNS_DIR, SAMPLE_RATE
from stream_engine import StreamEngine
from vad import CHUNK
from whisper_server import WhisperServer

PAGE = Path(__file__).parent / "static" / "index.html"
SYSTAP = Path(__file__).parent / "systap" / "systap"


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
        elif ev["type"] == "cards":
            self.status["cards"] = ev["cards"]
        broadcast(self.clients, json.dumps(ev, ensure_ascii=False))

    async def handler(self, ws):
        self.clients.add(ws)
        try:
            await ws.send(json.dumps({"type": "snapshot", "utts": list(self.utts.values()), "status": self.status}, ensure_ascii=False))
            async for _ in ws:
                pass
        except ConnectionClosed:
            pass  # 瀏覽器分頁關掉、重新整理或 iPad 休眠時連線會直接斷掉，屬正常狀況
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
        self.first, self.final, self.infer, self.llm = [], [], [], []

    def record(self, rec: dict):
        rec["ts"] = time.time()
        self.file.write(json.dumps(rec, ensure_ascii=False) + "\n")
        self.file.flush()
        if rec["type"] == "infer":
            self.infer.append(rec["elapsed_s"])
            return
        if rec["type"] == "llm":
            self.llm.append(rec)
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
            **({"llm_calls": len(self.llm), "llm_p50": p([r["elapsed_s"] for r in self.llm], 50),
                "llm_cost_usd": None if (c := llm_cost(self.llm)) is None else round(c, 4)} if self.llm else {}),
        }


def start_input(loop, queue: asyncio.Queue, device):
    """開輸入裝置；雙聲道（例如系統音訊）混成單聲道。CoreAudio 會自動轉成 16 kHz。"""
    import sounddevice as sd

    channels = min(2, sd.query_devices(device, "input")["max_input_channels"])

    def callback(indata, frames, t, status):
        loop.call_soon_threadsafe(queue.put_nowait, indata.mean(axis=1).astype(np.float32))

    stream = sd.InputStream(samplerate=SAMPLE_RATE, channels=channels, dtype="float32", blocksize=CHUNK, device=device, callback=callback)
    stream.start()
    return stream


class Systap:
    """啟動 systap（Core Audio process tap），把 stdout 的 16 kHz mono float32 切成 chunk 送進 queue。"""

    def __init__(self, loop, queue: asyncio.Queue):
        if not SYSTAP.exists():
            raise SystemExit(f"找不到 {SYSTAP}，請先執行 systap/build.sh")
        self.proc = subprocess.Popen([str(SYSTAP)], stdout=subprocess.PIPE)
        threading.Thread(target=self._read, args=(loop, queue), daemon=True).start()

    def _read(self, loop, queue):
        size = CHUNK * 4
        while chunk := self.proc.stdout.read(size):
            if len(chunk) == size:
                loop.call_soon_threadsafe(queue.put_nowait, np.frombuffer(chunk, dtype="<f4").copy())

    def stop(self):
        self.proc.terminate()
        self.proc.wait(timeout=5)


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
    # SIGTERM 改成取消主任務，走正常的收尾流程（關 WebSocket、停 systap／whisper-server）
    asyncio.get_running_loop().add_signal_handler(signal.SIGTERM, asyncio.current_task().cancel)

    # 每一路：(說話者標籤, 輸入裝置, 重播檔)
    channels = [("我", args.mic_device, args.replay)]
    if args.system_device is not None or args.replay_system:
        channels.append(("他人", args.system_device, args.replay_system))
    replaying = any(c[2] for c in channels)
    source = " + ".join(f"{who}:{Path(f).name if f else (dev if dev is not None else '預設麥克風')}" for who, dev, f in channels)

    hub = Hub({"model": args.model, "source": source})
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    log_path = RUNS_DIR / datetime.now().strftime(f"stream-%Y%m%d-%H%M%S-{args.model}.jsonl")
    stats = Stats(hub, log_path)

    emit = hub.emit
    cards = None
    if args.cards:
        cards = CardExtractor(hub.emit, stats.record, provider=args.cards_provider, model=args.cards_model,
                              interval=args.cards_interval)

        def emit(ev):
            hub.emit(ev)
            if ev["type"] == "utt" and ev["final"] and ev["committed"]:
                cards.add_final(ev)

    lock = asyncio.Lock()  # 兩路共用一個 whisper-server，推論依序排隊
    loop = asyncio.get_running_loop()
    streams, jobs = [], []
    try:
        async with serve(hub.handler, args.host, args.port, process_request=process_request, close_timeout=1):
            print(f"開啟：http://localhost:{args.port}  （iPad：http://{lan_ip()}:{args.port}）", flush=True)
            for who, device, replay_file in channels:
                queue: asyncio.Queue = asyncio.Queue()
                engine = StreamEngine(asr, lock, who, emit, step=args.step, min_silence=args.min_silence,
                                      max_utt=args.max_utt, prompt=args.prompt, on_record=stats.record)
                jobs.append(engine.run(queue))
                if replay_file:
                    jobs.append(replay(queue, load_audio(Path(replay_file).expanduser()), args.speed))
                elif device == "systap":
                    streams.append(Systap(loop, queue))
                else:
                    streams.append(start_input(loop, queue, device))
            print(f"收音中（{source}）；Ctrl-C 離開", flush=True)
            card_task = asyncio.create_task(cards.run()) if cards else None
            await asyncio.gather(*jobs)
            if cards:
                card_task.cancel()
                await cards.extract()  # 重播結束：把最後幾句也抽進卡片
                for c in hub.status.get("cards", []):
                    print(f"  [{c['kind']}] {c['text']}  {c['source']}")
            if replaying and not args.once:
                print(json.dumps(stats.summary(), ensure_ascii=False))
                print("重播結束，網頁保持開啟；Ctrl-C 離開", flush=True)
                await asyncio.Future()
    finally:
        for st in streams:
            st.stop()
        asr.stop()
        print(f"紀錄：{log_path}")
        print(json.dumps(stats.summary(), ensure_ascii=False))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="breeze-q8")
    ap.add_argument("--mic-device", type=lambda s: int(s) if s.isdigit() else s, default=None)
    ap.add_argument("--replay", help="用音檔代替麥克風（以實際速度播放）")
    ap.add_argument("--system-device", type=lambda s: int(s) if s.isdigit() else s, default=None,
                    help="系統音訊來源，標為「他人」：systap（Core Audio tap）或輸入裝置名稱／編號")
    ap.add_argument("--replay-system", help="用音檔代替系統音訊")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--once", action="store_true", help="重播結束就離開")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--step", type=float, default=0.5, help="每累積幾秒新音訊重算一次")
    ap.add_argument("--min-silence", type=float, default=0.6, help="靜音幾秒視為句尾")
    ap.add_argument("--max-utt", type=float, default=15.0, help="單句最長秒數，超過就切")
    ap.add_argument("--prompt", help="initial prompt，例如術語表")
    ap.add_argument("--cards", action="store_true", help="Step D：用 LLM 抽出決策／待辦／未回答問題／數字")
    ap.add_argument("--cards-provider", choices=["anthropic", "ica"], default="anthropic")
    ap.add_argument("--cards-model", help="模型 id；anthropic 預設 claude-haiku-4-5，ica 必填")
    ap.add_argument("--cards-interval", type=float, default=18.0, help="每幾秒抽一次卡片（有新句子才呼叫）")
    ap.add_argument("--list-devices", action="store_true")
    args = ap.parse_args()
    if args.list_devices:
        import sounddevice as sd
        print(sd.query_devices())
    else:
        try:
            asyncio.run(main(args))
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
