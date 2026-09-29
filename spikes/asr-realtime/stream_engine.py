"""串流引擎：VAD 切語句 → 滑動視窗重算 → LocalAgreement-2 決定暫定字／確定字。

- 語句開始（VAD 機率 ≥ on_thr）後，每累積 step 秒新音訊就把整句重送一次 ASR（上一次還沒回來就跳過）。
- 連續兩次結果的共同前綴轉成「確定字」，其餘是「暫定字」。
- 靜音超過 min_silence 視為句尾：整句再跑一次（開溫度重試）作為最終結果。
- 一句超過 max_utt 秒還沒停：保留最後一個 segment 的音訊，前面的 segment 直接定稿，避免視窗無限變長。
"""
import asyncio
import itertools
import re
import time
from collections import deque
from dataclasses import dataclass, field
from functools import partial

import numpy as np

from config import SAMPLE_RATE
from textnorm import display_units, unit_key
from vad import CHUNK, SileroVAD
from whisper_server import WhisperServer, join_segments

CHUNK_S = CHUNK / SAMPLE_RATE
MIN_RMS = 0.0015  # 整句能量低於這個值視為近乎靜音（遠距離講話約 0.005，仍會保留）
# Whisper 在靜音或噪音時常見的幻覺字串
HALLUCINATION = re.compile(r"謝謝(大家)?(收看|觀看|觀賞)|請不吝點贊|訂閱|字幕(由|提供|志願者)|Amara|優優獨播|明鏡與點點|李宗盛")


def clean(text: str) -> str:
    return HALLUCINATION.sub("", text).strip()


@dataclass
class Utterance:
    id: str
    chunks: list
    start: float                      # VAD 判定開口的時間（monotonic）
    committed: list = field(default_factory=list)
    tentative: list = field(default_factory=list)
    prev: list = field(default_factory=list)
    first_display: float | None = None
    speech_end: float | None = None   # 實際停止說話的時間（扣掉靜音門檻）
    continued: bool = False           # 由超長語句切出的後半段，首字延遲不列入統計
    n_infer: int = 0

    def pcm(self) -> np.ndarray:
        return np.concatenate(self.chunks)


class StreamEngine:
    def __init__(
        self, asr: WhisperServer, lock: asyncio.Lock, speaker: str, emit, *,
        step: float = 0.5, min_silence: float = 0.6, max_utt: float = 15.0,
        on_thr: float = 0.5, off_thr: float = 0.35, preroll: float = 0.3, prompt: str | None = None,
        on_record=None,
    ):
        self.asr, self.lock, self.speaker, self.emit = asr, lock, speaker, emit
        self.step, self.min_silence, self.max_utt = step, min_silence, max_utt
        self.on_thr, self.off_thr, self.prompt = on_thr, off_thr, prompt
        self.on_record = on_record or (lambda rec: None)
        self.vad = SileroVAD()
        self.preroll = deque(maxlen=max(1, int(preroll / CHUNK_S)))
        self.ids = itertools.count(1)
        self.cur: Utterance | None = None
        self.silence = 0.0
        self.since_infer = 0
        self.busy = False
        self.tasks: set[asyncio.Task] = set()

    async def run(self, queue: asyncio.Queue):
        """從 queue 讀 512 取樣的 float32 chunk；收到 None 結束。"""
        while (chunk := await queue.get()) is not None:
            self._on_chunk(chunk)
        if self.cur:
            self._spawn(self._finalize(self._close(time.monotonic())))
        if self.tasks:
            await asyncio.gather(*self.tasks)

    # ---- 音訊與 VAD ----

    def _on_chunk(self, chunk: np.ndarray):
        p = self.vad(chunk)
        now = time.monotonic()
        if self.cur is None:
            self.preroll.append(chunk)
            if p >= self.on_thr:
                self.cur = Utterance(id=self._new_id(), chunks=list(self.preroll), start=now)
                self.preroll.clear()
                self.silence, self.since_infer = 0.0, 0
            return

        u = self.cur
        u.chunks.append(chunk)
        self.since_infer += len(chunk)
        self.silence = self.silence + CHUNK_S if p < self.off_thr else 0.0
        if self.silence >= self.min_silence:
            self._spawn(self._finalize(self._close(now)))
        elif self.since_infer >= self.step * SAMPLE_RATE and not self.busy:
            self.since_infer = 0
            self._spawn(self._partial(u))

    def _close(self, now: float) -> Utterance:
        u, self.cur = self.cur, None
        u.speech_end = now - self.silence
        return u

    def _new_id(self) -> str:
        return f"{self.speaker}-{next(self.ids)}"

    def _spawn(self, coro):
        task = asyncio.create_task(coro)
        self.tasks.add(task)
        task.add_done_callback(self.tasks.discard)

    # ---- 推論 ----

    async def _transcribe(self, pcm: np.ndarray, final: bool):
        loop = asyncio.get_running_loop()
        async with self.lock:
            res = await loop.run_in_executor(None, partial(self.asr.transcribe, pcm, prompt=self.prompt, fallback=final))
        self.on_record({"type": "infer", "speaker": self.speaker, "final": final,
                        "window_s": len(pcm) / SAMPLE_RATE, "elapsed_s": res.elapsed})
        return res

    async def _partial(self, u: Utterance):
        self.busy = True
        try:
            pcm = u.pcm()
            if u is not self.cur:
                return
            res = await self._transcribe(pcm, final=False)
            u.n_infer += 1
            if u is not self.cur:  # 推論期間已經句尾，交給 _finalize
                return
            self._agree(u, display_units(clean(res.text)))
            if u.first_display is None and (u.committed or u.tentative):
                u.first_display = time.monotonic()
            self._emit(u, final=False)
            if len(pcm) / SAMPLE_RATE > self.max_utt and len(res.segments) >= 2:
                self._cut(u, res)
        finally:
            self.busy = False

    @staticmethod
    def _agree(u: Utterance, units: list[str]):
        """LocalAgreement-2：本次與上次假設的共同前綴 → 確定字。確定字不回頭修改。"""
        lcp = 0
        for a, b in zip(units, u.prev):
            if unit_key(a) != unit_key(b):
                break
            lcp += 1
        if lcp > len(u.committed):
            u.committed = units[:lcp]
        u.tentative = units[len(u.committed):]
        u.prev = units

    def _cut(self, u: Utterance, res):
        """超長語句：最後一個 segment 之前的文字定稿，音訊從最後一個 segment 開頭接續。"""
        head = clean(join_segments(res.segments[:-1]))
        cut = int(res.segments[-1]["start"] * SAMPLE_RATE)
        rest = u.pcm()[cut:]
        self.emit({"type": "utt", "id": u.id, "speaker": self.speaker, "committed": head, "tentative": "", "final": True})
        self.on_record({"type": "utt", "id": u.id, "speaker": self.speaker, "cut": True, "duration_s": cut / SAMPLE_RATE,
                        "first_latency_s": self._first_latency(u), "n_infer": u.n_infer, "text": head})
        self.cur = Utterance(id=self._new_id(), chunks=[rest], start=time.monotonic(), continued=True)

    async def _finalize(self, u: Utterance):
        pcm = u.pcm()
        rms = float(np.sqrt(np.mean(pcm ** 2)))
        res = await self._transcribe(pcm, final=True)
        text = clean(res.text) if rms >= MIN_RMS else ""
        final_latency = time.monotonic() - u.speech_end
        u.committed, u.tentative = [text] if text else [], []
        self._emit(u, final=True)
        self.on_record({"type": "utt", "id": u.id, "speaker": self.speaker, "cut": False,
                        "duration_s": len(pcm) / SAMPLE_RATE, "first_latency_s": self._first_latency(u),
                        "final_latency_s": final_latency, "n_infer": u.n_infer + 1, "text": text, "rms": rms,
                        "dropped": [d["text"] for d in res.dropped],
                        "min_logprob": min((sg["avg_logprob"] for sg in res.segments), default=None)})

    @staticmethod
    def _first_latency(u: Utterance):
        return None if u.continued or u.first_display is None else u.first_display - u.start

    def _emit(self, u: Utterance, final: bool):
        self.emit({"type": "utt", "id": u.id, "speaker": self.speaker, "committed": "".join(u.committed),
                   "tentative": "".join(u.tentative), "final": final})
