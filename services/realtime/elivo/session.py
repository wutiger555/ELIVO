"""會議生命週期。

draft ──開始──▶ live ⇄ paused ──結束──▶ ending（最後整理）──▶ ended ──確認──▶ confirmed
                       ▲
interrupted（上次沒有正常結束）──繼續／結束──┘

- 按下「開始」才收音；暫停時停止收音，也不再送 ASR／LLM，並記錄暫停區間。
- 逐字稿每一句定稿、會議記錄每一次變更都立即寫入資料庫（Ephemeral 模式除外）。
- 會議中音訊暫存在 spool；正常結束時刪除，或在該場選擇保存時轉成 FLAC；意外中斷時保留。
- 關掉瀏覽器不影響收音；網頁重新連上時會收到完整快照。
"""
import asyncio
import itertools
import re
import subprocess
import time

import numpy as np

from .asr.stream_engine import StreamEngine
from .capture import SPEAKER_SLUG, Source, rms, start_source
from .config import AUDIO_DIR, SPOOL_DIR
from .minutes import MinutesEngine

LEVEL_INTERVAL = 0.2
ACTIVE = {"decision": "confirmed", "action": "open", "question": "open", "number": "current"}


class SessionError(Exception):
    pass


def split_glossary(text: str) -> list[str]:
    return [t.strip() for t in re.split(r"[\n,，、]", text or "") if t.strip()]


class MeetingSession:
    def __init__(self, store, asr, asr_lock, meeting: dict, broadcast, llm_settings: dict):
        self.store, self.asr, self.asr_lock = store, asr, asr_lock
        self.id, self.meeting, self.broadcast = meeting["id"], meeting, broadcast
        self.ephemeral = meeting["mode"] == "ephemeral"
        self.glossary = split_glossary(meeting["glossary"])
        self.base = meeting["duration_s"] or 0.0   # 已累積的收音秒數（不含暫停）
        self.resumed_at: float | None = None
        self.sources, self.queues, self.tasks = [], [], []
        self.utts: dict[str, dict] = {}
        self.records: list[dict] = []
        self.counters: dict[str, itertools.count] = {}
        self.last_level: dict[str, float] = {}
        self.minutes_task = None
        self.minutes_error = None

        lines = store.utterances(self.id)
        for l in lines:
            self.utts[l["id"]] = {"type": "utt", "id": l["id"], "speaker": l["speaker"], "committed": l["text"],
                                  "tentative": "", "final": True, "t": l["t"], "edited": bool(l["edited"])}
        for sp in {l["speaker"] for l in lines}:
            n = max(int(l["id"].rsplit("-", 1)[1]) for l in lines if l["speaker"] == sp)
            self.counters[sp] = itertools.count(n + 1)

        finished = meeting["status"] in ("ended", "confirmed")
        settings = dict(llm_settings)
        injected = settings.pop("llm", None)   # 測試用的假 LLM
        try:
            # 已結束的會議只需要編輯記錄，不會再呼叫 LLM
            self.minutes = MinutesEngine(self._on_minutes, self._record, clock=self.clock, glossary=self.glossary,
                                         llm=object() if finished else injected, **settings)
            self.minutes.restore(meeting.get("minutes"), lines)
        except SystemExit as e:  # 缺少 LLM 金鑰：逐字稿照常，會議記錄停用
            self.minutes, self.minutes_error = None, str(e).splitlines()[0]

    # ---- 狀態 ----

    @property
    def status(self) -> str:
        return self.meeting["status"]

    def clock(self) -> float:
        return self.base + (time.monotonic() - self.resumed_at if self.resumed_at else 0.0)

    def _set(self, **fields):
        self.meeting = self.store.update_meeting(self.id, **fields)
        self.notify()

    def notify(self):
        """把目前的會議狀態推給所有連線中的畫面（本機與第二螢幕）。"""
        self.broadcast(self.id, {"type": "meeting", "meeting": self.public_meeting(), "clock": self.clock(),
                                 "running": self.resumed_at is not None, "pauses": self.store.pauses(self.id)})

    def public_meeting(self) -> dict:
        m = {k: v for k, v in self.meeting.items() if k != "minutes"}
        m["minutes_error"] = self.minutes_error
        return m

    def snapshot(self) -> dict:
        # 名稱、分類、標籤可能在別處被改（例如刪除 Space 會把會議改成未分類），以資料庫為準
        self.meeting = self.store.meeting(self.id) or self.meeting
        return {
            "type": "snapshot",
            "meeting": self.public_meeting(),
            "utts": list(self.utts.values()),
            "minutes": self.minutes.export() if self.minutes else self.meeting.get("minutes"),
            "stats": self.stats(),
            "pauses": self.store.pauses(self.id),
            "clock": self.clock(),
            "running": self.resumed_at is not None,
        }

    # ---- 生命週期 ----

    async def start(self):
        if self.status != "draft":
            raise SessionError(f"這場會議目前是 {self.status}，不能開始")
        await self._open_capture()
        self._set(status="live", started_at=time.time())
        self._start_minutes()

    async def pause(self):
        if self.status != "live":
            raise SessionError("會議不在進行中")
        await self._close_capture()
        self.store.add_pause(self.id, self.base)
        self._set(status="paused", duration_s=self.base)

    async def resume(self):
        if self.status not in ("paused", "interrupted"):
            raise SessionError("會議沒有暫停")
        await self._open_capture()
        self.store.end_pause(self.id, self.base)
        self._set(status="live")
        self._start_minutes()

    async def stop(self):
        if self.status not in ("live", "paused", "interrupted"):
            raise SessionError("會議不在進行中")
        if self.status == "live":
            await self._close_capture()
        else:
            self.store.end_pause(self.id, self.base)
        self._set(status="ending", duration_s=self.base)
        if self.minutes:
            if self.minutes_task:
                self.minutes_task.cancel()
            try:
                await asyncio.wait_for(self.minutes.finish(), timeout=180)
            except asyncio.TimeoutError:
                pass
        self._finish_audio()
        self._set(status="ended", ended_at=time.time(), duration_s=self.base, stats=self.stats(),
                  **({} if self.ephemeral or not self.minutes else {"minutes": self.minutes.export()}))

    async def confirm(self, keep: list[str], edits: dict[str, dict]):
        """會後 30 秒確認：勾選要保留的決策與待辦，可改負責人與期限。"""
        if self.status not in ("ended", "confirmed"):
            raise SessionError("會議結束後才能確認")
        if not self.minutes:
            raise SessionError("這場會議沒有會議記錄")
        for item_id, changes in edits.items():
            self.minutes.user_update(item_id, changes, "會後確認時修改")
        for it in list(self.minutes.items.values()):
            if it.kind in ("decision", "action") and it.status == ACTIVE[it.kind] and it.id not in keep:
                self.minutes.user_update(it.id, {"status": "retracted"}, "會後確認時未勾選")
        state = self.minutes.export()
        if self.ephemeral:
            # Ephemeral：只保留確認過的決策與待辦，不留逐字稿、摘要與依據
            state = {**state, "summary": [], "utt_t": {}, "items": [
                {**it, "utt_ids": [], "history": []} for it in state["items"]
                if it["kind"] in ("decision", "action") and it["status"] != "retracted"
            ]}
            self.store.delete_utterances(self.id)
            self.utts.clear()
            self.minutes.restore(state, [])   # 之後的編輯只會在精簡後的版本上進行，不會帶回依據與修改紀錄
        self._set(status="confirmed", minutes=state)

    # ---- 手動編輯：會議記錄 ----

    def _require_minutes(self):
        if not self.minutes:
            raise SessionError(self.minutes_error or "這場會議沒有會議記錄")
        if self.status == "ending":
            raise SessionError("正在做最後整理，請稍候再編輯")

    def add_item(self, kind: str, text: str, owner=None, due=None, value=None) -> dict:
        self._require_minutes()
        if kind not in ACTIVE or not (text or "").strip():
            raise SessionError("請選擇類型並輸入內容")
        return self.minutes.user_add(kind, text.strip(), owner or None, due or None, value or None).model_dump()

    def edit_item(self, item_id: str, changes: dict):
        self._require_minutes()
        if item_id not in self.minutes.items:
            raise SessionError("找不到這個項目")
        self.minutes.user_update(item_id, changes)

    def delete_item(self, item_id: str):
        """刪除＝撤回（保留修改紀錄），AI 之後不會再把它加回來。"""
        self.edit_item(item_id, {"status": "retracted"})

    # ---- 手動編輯：逐字稿 ----

    def _require_final(self, uid: str) -> dict:
        u = self.utts.get(uid)
        if not u or not u["final"]:
            raise SessionError("找不到這句，或這句還在辨識中")
        return u

    def edit_utt(self, uid: str, text: str):
        u = self._require_final(uid)
        text = (text or "").strip()
        if not text:
            raise SessionError("內容不能是空的；要刪除請用刪除")
        u.update(committed=text, edited=True)
        if not self.ephemeral:
            self.store.edit_utterance(self.id, uid, text)
        if self.minutes:
            self.minutes.edit_line(uid, text)
        self.broadcast(self.id, u)

    def delete_utt(self, uid: str):
        self._require_final(uid)
        self.utts.pop(uid)
        if not self.ephemeral:
            self.store.delete_utterance(self.id, uid)
        if self.minutes:
            self.minutes.delete_line(uid)
        self.broadcast(self.id, {"type": "utt_deleted", "id": uid})

    # ---- 擷取 ----

    async def _open_capture(self):
        loop = asyncio.get_running_loop()
        prompt = "、".join(self.glossary) or None
        if not self.ephemeral:
            SPOOL_DIR.mkdir(parents=True, exist_ok=True)
        try:
            for src in self.meeting["sources"]:
                speaker = src["speaker"]
                queue: asyncio.Queue = asyncio.Queue()
                engine = StreamEngine(self.asr, self.asr_lock, speaker, self._on_utt, prompt=prompt,
                                      on_record=self._record, ids=self.counters.setdefault(speaker, itertools.count(1)))
                spool = None if self.ephemeral else SPOOL_DIR / f"{self.id}-{SPEAKER_SLUG.get(speaker, 'src')}.pcm"
                source = Source(src.get("device"),
                                lambda chunk, q=queue, sp=speaker: loop.call_soon_threadsafe(self._chunk, q, sp, chunk), spool)
                self.sources.append(source)   # 先加入清單：開啟失敗時 _close_capture 也會收掉
                await start_source(source)
                self.queues.append(queue)
                self.tasks.append(asyncio.create_task(engine.run(queue)))
        except Exception as e:
            await self._close_capture()
            raise SessionError(f"無法開啟音訊來源：{e}")
        self.resumed_at = time.monotonic()

    async def _close_capture(self):
        self.base, self.resumed_at = self.clock(), None
        for s in self.sources:
            await asyncio.to_thread(s.stop)   # 關閉裝置也走 CoreAudio，不放在 event loop 上
        for q in self.queues:
            q.put_nowait(None)  # 引擎收到 None 會把正在說的那一句定稿
        await asyncio.gather(*self.tasks)
        self.sources, self.queues, self.tasks = [], [], []

    def _chunk(self, queue, speaker, chunk):
        queue.put_nowait(chunk)
        now = time.monotonic()
        if now - self.last_level.get(speaker, 0) >= LEVEL_INTERVAL:
            self.last_level[speaker] = now
            self.broadcast(self.id, {"type": "level", "speaker": speaker, "rms": round(rms(chunk), 4)})

    def _start_minutes(self):
        if self.minutes and (self.minutes_task is None or self.minutes_task.done()):
            self.minutes.enabled = True
            self.minutes_task = asyncio.create_task(self.minutes.run())

    def _finish_audio(self):
        for spool in SPOOL_DIR.glob(f"{self.id}-*.pcm"):
            if self.meeting["keep_audio"] and not self.ephemeral and spool.stat().st_size:
                AUDIO_DIR.mkdir(parents=True, exist_ok=True)
                subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "s16le", "-ar", "16000", "-ac", "1",
                                "-i", str(spool), str(AUDIO_DIR / spool.with_suffix(".flac").name)], check=False)
            spool.unlink()

    # ---- 事件 ----

    def _on_utt(self, ev: dict):
        prev = self.utts.get(ev["id"])
        ev["t"] = prev["t"] if prev else round(self.clock(), 1)
        if ev["final"] and not ev["committed"]:
            self.utts.pop(ev["id"], None)
        else:
            self.utts[ev["id"]] = ev
        if ev["final"] and ev["committed"]:
            if not self.ephemeral:
                self.store.upsert_utterance(self.id, ev["id"], ev["speaker"], ev["t"], ev["committed"])
            # 會議時間也跟著每句寫入：意外中斷後繼續時，時鐘從中斷前的位置接著走
            self.store.update_meeting(self.id, duration_s=self.clock())
            if self.minutes:
                self.minutes.add_final(ev)
        self.broadcast(self.id, ev)

    def _on_minutes(self, ev: dict):
        # Ephemeral 會議在確認前不寫入；確認後保存的是精簡版（只有決策與待辦）
        if not self.ephemeral or self.status == "confirmed":
            self.store.update_meeting(self.id, minutes=ev["minutes"])
        self.broadcast(self.id, ev)

    def _record(self, rec: dict):
        rec["ts"] = time.time()
        self.records.append(rec)
        if rec["type"] == "utt":
            self.broadcast(self.id, {"type": "stats", "stats": self.stats()})

    def stats(self) -> dict:
        pick = lambda key, typ: [r[key] for r in self.records if r["type"] == typ and r.get(key) is not None]
        p = lambda v, q: round(float(np.percentile(v, q)), 2) if v else None
        first, final, infer = pick("first_latency_s", "utt"), pick("final_latency_s", "utt"), pick("elapsed_s", "infer")
        return {"utterances": len(final), "first_p50": p(first, 50), "final_p50": p(final, 50), "infer_p50": p(infer, 50),
                "llm_calls": sum(r["type"] == "llm" for r in self.records)}


class SessionManager:
    """同一時間只允許一場會議收音；已結束的會議也透過 session 編輯與確認。"""

    def __init__(self, store, asr, broadcast, llm_settings: dict):
        self.store, self.asr, self.broadcast, self.llm_settings = store, asr, broadcast, llm_settings
        self.asr_lock = asyncio.Lock()   # 所有來源共用一個 whisper-server，推論依序排隊
        self.sessions: dict[str, MeetingSession] = {}

    def get(self, meeting_id: str) -> MeetingSession:
        if meeting_id not in self.sessions:
            meeting = self.store.meeting(meeting_id)
            if meeting is None:
                raise SessionError("找不到這場會議")
            self.sessions[meeting_id] = MeetingSession(self.store, self.asr, self.asr_lock, meeting, self.broadcast,
                                                       self.llm_settings)
        return self.sessions[meeting_id]

    def capturing(self) -> MeetingSession | None:
        return next((s for s in self.sessions.values() if s.status == "live"), None)

    def _check_exclusive(self, meeting_id: str):
        other = self.capturing()
        if other and other.id != meeting_id:
            raise SessionError(f"「{other.meeting['title']}」正在進行中，請先暫停或結束")

    async def start(self, meeting_id: str):
        self._check_exclusive(meeting_id)
        await self.get(meeting_id).start()

    async def resume(self, meeting_id: str):
        self._check_exclusive(meeting_id)
        await self.get(meeting_id).resume()

    async def pause(self, meeting_id: str):
        await self.get(meeting_id).pause()

    async def stop(self, meeting_id: str):
        await self.get(meeting_id).stop()

    async def confirm(self, meeting_id: str, keep: list[str], edits: dict):
        await self.get(meeting_id).confirm(keep, edits)

    def forget(self, meeting_id: str):
        self.sessions.pop(meeting_id, None)

    async def shutdown(self):
        """服務正常關閉：進行中的會議先暫停（資料都已寫入，下次可以繼續）。"""
        for s in list(self.sessions.values()):
            if s.status == "live":
                await s.pause()

