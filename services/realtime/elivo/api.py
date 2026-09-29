"""HTTP／WebSocket API，並提供 apps/web 建置好的網頁。

存取規則：
- /api/*、/ws/meetings/*、/ws/meter 只接受本機（127.0.0.1／::1）連線：管理會議、讀取逐字稿都只能在這台 Mac 上。
- 第二螢幕（iPad／手機）走 /ws/view?token=…：唯讀，只看得到配對的那一場會議；配對碼會過期，也可以隨時撤銷。
- 靜態網頁本身不含資料，任何裝置都能載入。
"""
import asyncio
import json
import secrets
import socket
import time
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .asr.whisper_server import WhisperServer
from .capture import Source, list_devices, rms
from .config import AUDIO_DIR, DB_PATH, SPOOL_DIR, WEB_DIST
from .session import ACTIVE, SessionError, SessionManager
from .store import Store

PAIR_TTL = 12 * 3600


class Settings(BaseModel):
    asr_model: str = "breeze-q8"
    asr_port: int = 8178
    port: int = 8765
    llm_provider: str = "ica"
    fast_model: str = "claude-haiku-4-5"
    reflect_model: str = "claude-sonnet-4-6"
    trusted_hosts: list[str] = ["127.0.0.1", "::1"]   # 可操作與讀取資料的來源（預設只有本機）


def lan_ip() -> str:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("10.255.255.255", 1))  # 不會真的送出封包，只是讓系統選網卡
            return s.getsockname()[0]
        except OSError:
            return "127.0.0.1"


class Hub:
    """每場會議的 WebSocket 連線（本機控制端與第二螢幕）。"""

    def __init__(self):
        self.clients: dict[str, set[WebSocket]] = {}

    def add(self, meeting_id: str, ws: WebSocket):
        self.clients.setdefault(meeting_id, set()).add(ws)

    def remove(self, meeting_id: str, ws: WebSocket):
        self.clients.get(meeting_id, set()).discard(ws)

    def broadcast(self, meeting_id: str, ev: dict):
        msg = json.dumps(ev, ensure_ascii=False)
        for ws in list(self.clients.get(meeting_id, ())):
            asyncio.create_task(self._send(meeting_id, ws, msg))

    async def _send(self, meeting_id, ws, msg):
        try:
            await ws.send_text(msg)
        except Exception:
            self.remove(meeting_id, ws)


def create_app(settings: Settings, store: Store | None = None, asr=None, llm=None) -> FastAPI:
    """store／asr／llm 可注入（測試用）；沒給 asr 時啟動 whisper-server。"""
    hub = Hub()
    trusted = set(settings.trusted_hosts)
    pairs: dict[str, dict] = {}   # token → {"meeting_id", "expires_at"}

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.store = store or Store(DB_PATH)
        app.state.interrupted = app.state.store.mark_interrupted()
        if asr is None:
            server = WhisperServer(settings.asr_model, port=settings.asr_port)
            await asyncio.to_thread(server.start)
            await asyncio.to_thread(server.transcribe, np.zeros(16000, dtype=np.float32))  # 暖機
            app.state.asr = server
        else:
            app.state.asr = asr
        llm_settings = {"provider": settings.llm_provider, "fast_model": settings.fast_model, "reflect_model": settings.reflect_model}
        if llm is not None:
            llm_settings["llm"] = llm
        app.state.manager = SessionManager(app.state.store, app.state.asr, hub.broadcast, llm_settings)
        yield
        await app.state.manager.shutdown()
        if asr is None:
            app.state.asr.stop()

    app = FastAPI(title="ELIVO realtime", lifespan=lifespan)

    @app.middleware("http")
    async def local_only(request: Request, call_next):
        if request.url.path.startswith("/api/") and request.client and request.client.host not in trusted:
            return JSONResponse({"detail": "只能在這台 Mac 上操作；第二螢幕請掃描 QR code 以唯讀方式檢視"}, status_code=403)
        return await call_next(request)

    def mgr() -> SessionManager:
        return app.state.manager

    def st() -> Store:
        return app.state.store

    def meeting_or_404(meeting_id: str) -> dict:
        m = st().meeting(meeting_id)
        if m is None:
            raise HTTPException(404, "找不到這場會議")
        return m

    async def run(coro):
        try:
            await coro
        except SessionError as e:
            raise HTTPException(409, str(e))

    # ---- 狀態與裝置 ----

    @app.get("/api/status")
    def status():
        live = mgr().capturing()
        return {
            "asr_model": settings.asr_model,
            "llm": {"provider": settings.llm_provider, "fast_model": settings.fast_model, "reflect_model": settings.reflect_model},
            "capturing": live.id if live else None,
            "interrupted": [m for m in (st().meeting(i) for i in app.state.interrupted) if m and m["status"] == "interrupted"],
            "lan_url": f"http://{lan_ip()}:{settings.port}",
        }

    @app.get("/api/devices")
    def devices():
        return list_devices()

    # ---- Space／Series／標籤 ----

    class SpaceIn(BaseModel):
        name: str | None = None
        glossary: str | None = None

    @app.get("/api/spaces")
    def spaces():
        return st().spaces()

    @app.post("/api/spaces")
    def create_space(body: SpaceIn):
        if not (body.name or "").strip():
            raise HTTPException(400, "請輸入名稱")
        return st().create_space(body.name.strip(), body.glossary or "")

    @app.patch("/api/spaces/{space_id}")
    def update_space(space_id: str, body: SpaceIn):
        return st().update_space(space_id, **body.model_dump(exclude_none=True))

    @app.delete("/api/spaces/{space_id}")
    def delete_space(space_id: str):
        st().delete_space(space_id)
        return {"ok": True}

    class SeriesIn(BaseModel):
        name: str

    @app.post("/api/spaces/{space_id}/series")
    def create_series(space_id: str, body: SeriesIn):
        if st().space(space_id) is None:
            raise HTTPException(404, "找不到這個 Space")
        return st().create_series(space_id, body.name.strip())

    @app.patch("/api/series/{series_id}")
    def update_series(series_id: str, body: SeriesIn):
        return st().update_series(series_id, body.name.strip())

    @app.delete("/api/series/{series_id}")
    def delete_series(series_id: str):
        st().delete_series(series_id)
        return {"ok": True}

    @app.get("/api/series/{series_id}/brief")
    def brief(series_id: str, before: str | None = None):
        """會前簡報：同一個例行會議上一場的有效決策、未完成待辦、未答問題、數字。"""
        last = st().last_in_series(series_id, before)
        if not last or not last.get("minutes"):
            return {"meeting": None, "items": []}
        items = [it for it in last["minutes"]["items"] if it["status"] == ACTIVE[it["kind"]]]
        return {"meeting": {k: last[k] for k in ("id", "title", "started_at")}, "items": items}

    @app.get("/api/tags")
    def tags():
        return st().tags()

    # ---- 會議 ----

    class MeetingIn(BaseModel):
        title: str | None = None
        space_id: str | None = None
        series_id: str | None = None
        tags: list[str] | None = None
        mode: str | None = None
        keep_audio: bool | None = None
        glossary: str | None = None
        sources: list[dict] | None = None

    @app.get("/api/meetings")
    def meetings(space_id: str | None = None, series_id: str | None = None, tag: str | None = None, q: str | None = None):
        rows = st().meetings(space_id=space_id, series_id=series_id, tag=tag, q=q)
        for m in rows:
            items = (m.pop("minutes") or {}).get("items", [])
            m["counts"] = {k: sum(1 for it in items if it["kind"] == k and it["status"] == ACTIVE[k]) for k in ACTIVE}
        return rows

    @app.post("/api/meetings")
    def create_meeting(body: MeetingIn):
        if not (body.title or "").strip():
            raise HTTPException(400, "請輸入會議名稱")
        if body.mode not in (None, "standard", "ephemeral"):
            raise HTTPException(400, "mode 只能是 standard 或 ephemeral")
        sources = body.sources or [{"speaker": "我", "device": None}]
        return st().create_meeting(
            body.title.strip(), space_id=body.space_id, series_id=body.series_id, mode=body.mode or "standard",
            keep_audio=bool(body.keep_audio), glossary=body.glossary or "", sources=sources, tags=body.tags or [],
        )

    @app.get("/api/meetings/{meeting_id}")
    def meeting(meeting_id: str):
        meeting_or_404(meeting_id)
        return mgr().get(meeting_id).snapshot()

    @app.patch("/api/meetings/{meeting_id}")
    def update_meeting(meeting_id: str, body: MeetingIn):
        m = meeting_or_404(meeting_id)
        fields = body.model_dump(exclude_none=True)
        if m["status"] != "draft":
            # 開始後只能改名稱、分類與標籤；模式、音源、術語表在開始前決定
            fields = {k: v for k, v in fields.items() if k in ("title", "space_id", "series_id", "tags")}
        updated = st().update_meeting(meeting_id, **fields)
        if meeting_id in mgr().sessions:
            mgr().sessions[meeting_id].meeting = updated
        return updated

    @app.delete("/api/meetings/{meeting_id}")
    def delete_meeting(meeting_id: str):
        m = meeting_or_404(meeting_id)
        if m["status"] in ("live", "ending"):
            raise HTTPException(409, "會議進行中，請先結束")
        for f in list(SPOOL_DIR.glob(f"{meeting_id}-*")) + list(AUDIO_DIR.glob(f"{meeting_id}-*")):
            f.unlink()
        st().delete_meeting(meeting_id)
        mgr().forget(meeting_id)
        for token in [t for t, p in pairs.items() if p["meeting_id"] == meeting_id]:
            pairs.pop(token)
        return {"ok": True}

    @app.post("/api/meetings/{meeting_id}/start")
    async def start(meeting_id: str):
        meeting_or_404(meeting_id)
        await run(mgr().start(meeting_id))
        return mgr().get(meeting_id).public_meeting()

    @app.post("/api/meetings/{meeting_id}/pause")
    async def pause(meeting_id: str):
        await run(mgr().pause(meeting_id))
        return mgr().get(meeting_id).public_meeting()

    @app.post("/api/meetings/{meeting_id}/resume")
    async def resume(meeting_id: str):
        await run(mgr().resume(meeting_id))
        return mgr().get(meeting_id).public_meeting()

    @app.post("/api/meetings/{meeting_id}/stop")
    async def stop(meeting_id: str):
        await run(mgr().stop(meeting_id))
        return mgr().get(meeting_id).public_meeting()

    class ConfirmIn(BaseModel):
        keep: list[str]
        edits: dict[str, dict] = {}

    @app.post("/api/meetings/{meeting_id}/confirm")
    async def confirm(meeting_id: str, body: ConfirmIn):
        await run(mgr().confirm(meeting_id, body.keep, body.edits))
        return mgr().get(meeting_id).snapshot()

    @app.get("/api/meetings/{meeting_id}/export.md", response_class=PlainTextResponse)
    def export_md(meeting_id: str):
        m = meeting_or_404(meeting_id)
        s = mgr().get(meeting_id)
        head = f"# {m['title']}\n\n"
        body = s.minutes.to_markdown().split("\n", 1)[1] if s.minutes else "（沒有會議記錄）\n"
        return head + body

    # ---- 第二螢幕配對 ----

    @app.post("/api/meetings/{meeting_id}/pair")
    def pair(meeting_id: str):
        meeting_or_404(meeting_id)
        token = secrets.token_urlsafe(16)
        pairs[token] = {"meeting_id": meeting_id, "expires_at": time.time() + PAIR_TTL}
        return {"token": token, "url": f"http://{lan_ip()}:{settings.port}/#/view/{token}", "expires_at": pairs[token]["expires_at"]}

    @app.delete("/api/meetings/{meeting_id}/pair")
    def unpair(meeting_id: str):
        for token in [t for t, p in pairs.items() if p["meeting_id"] == meeting_id]:
            pairs.pop(token)
        # 已連線的第二螢幕也一併斷開
        for ws in list(hub.clients.get(f"view:{meeting_id}", ())):
            asyncio.create_task(ws.close(code=4403))
        return {"ok": True}

    # ---- WebSocket ----

    def is_local(ws: WebSocket) -> bool:
        return bool(ws.client) and ws.client.host in trusted

    async def stream(ws: WebSocket, meeting_id: str, extra_key: str | None = None):
        s = mgr().get(meeting_id)
        hub.add(meeting_id, ws)
        if extra_key:
            hub.add(extra_key, ws)
        try:
            await ws.send_text(json.dumps(s.snapshot(), ensure_ascii=False))
            while True:
                await ws.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            hub.remove(meeting_id, ws)
            if extra_key:
                hub.remove(extra_key, ws)

    @app.websocket("/ws/meetings/{meeting_id}")
    async def ws_meeting(ws: WebSocket, meeting_id: str):
        await ws.accept()
        if not is_local(ws) or st().meeting(meeting_id) is None:
            await ws.close(code=4403)
            return
        await stream(ws, meeting_id)

    @app.websocket("/ws/view")
    async def ws_view(ws: WebSocket, token: str = ""):
        await ws.accept()
        p = pairs.get(token)
        if not p or p["expires_at"] < time.time() or st().meeting(p["meeting_id"]) is None:
            await ws.close(code=4403)
            return
        await stream(ws, p["meeting_id"], extra_key=f"view:{p['meeting_id']}")

    @app.websocket("/ws/meter")
    async def ws_meter(ws: WebSocket, device: str = ""):
        """會前音量測試：開啟指定來源，每 0.1 秒回報音量。會議收音中不能使用。"""
        await ws.accept()
        if not is_local(ws) or mgr().capturing():
            await ws.close(code=4403)
            return
        loop = asyncio.get_running_loop()
        level = {"v": 0.0}

        def on_chunk(chunk):
            level["v"] = max(level["v"], rms(chunk))

        dev = device if device == "systap" or device.startswith("file:") else (int(device) if device.isdigit() else None)
        src = Source(dev, lambda c: loop.call_soon_threadsafe(on_chunk, c))
        try:
            src.start()
            while True:
                await asyncio.sleep(0.1)
                await ws.send_text(json.dumps({"rms": round(level["v"], 4)}))
                level["v"] = 0.0
        except (WebSocketDisconnect, RuntimeError):
            pass
        except Exception as e:
            await ws.send_text(json.dumps({"error": str(e)}))
        finally:
            src.stop()

    # ---- 網頁 ----

    if WEB_DIST.exists():
        app.mount("/", StaticFiles(directory=WEB_DIST, html=True), name="web")
    else:
        @app.get("/", response_class=HTMLResponse)
        def no_web():
            return "<p>網頁尚未建置：請在 apps/web 執行 <code>npm install &amp;&amp; npm run build</code>，或用 <code>npm run dev</code>。</p>"

    return app
