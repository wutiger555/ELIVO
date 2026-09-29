import json
import time

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

import elivo.api
import elivo.session
from elivo.api import Settings, create_app
from elivo.store import Store

from conftest import FakeASR, FakeLLM


@pytest.fixture
def dirs(tmp_path, monkeypatch):
    spool, audio = tmp_path / "spool", tmp_path / "audio"
    for mod in (elivo.session, elivo.api):
        monkeypatch.setattr(mod, "SPOOL_DIR", spool)
        monkeypatch.setattr(mod, "AUDIO_DIR", audio)
    return spool, audio


def make_client(tmp_path, llm=None, trusted=("testclient",)):
    app = create_app(Settings(trusted_hosts=list(trusted)), store=Store(tmp_path / "t.db"), asr=FakeASR(), llm=llm or FakeLLM())
    return TestClient(app)


def wait_for(fn, timeout=40):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if fn():
            return True
        time.sleep(0.3)
    return False


def test_remote_clients_are_rejected(tmp_path):
    with make_client(tmp_path, trusted=("127.0.0.1",)) as c:
        r = c.get("/api/spaces")
        assert r.status_code == 403


def test_meeting_lifecycle(tmp_path, dirs, smoke_wav):
    spool, audio = dirs
    llm = FakeLLM()
    with make_client(tmp_path, llm) as c:
        sp = c.post("/api/spaces", json={"name": "APIT"}).json()
        sr = c.post(f"/api/spaces/{sp['id']}/series", json={"name": "每週站會"}).json()
        src = [{"speaker": "我", "device": f"file:{smoke_wav}"}]
        m = c.post("/api/meetings", json={"title": "站會 9/30", "space_id": sp["id"], "series_id": sr["id"],
                                          "tags": ["預算"], "sources": src, "keep_audio": True}).json()
        assert m["status"] == "draft"

        assert c.post(f"/api/meetings/{m['id']}/start").json()["status"] == "live"
        other = c.post("/api/meetings", json={"title": "另一場", "sources": src}).json()
        r = c.post(f"/api/meetings/{other['id']}/start")
        assert r.status_code == 409                       # 同時只能有一場在收音

        snap = lambda: c.get(f"/api/meetings/{m['id']}").json()
        assert wait_for(lambda: any(u["final"] for u in snap()["utts"])), "沒有收到定稿的句子"

        assert c.post(f"/api/meetings/{m['id']}/pause").json()["status"] == "paused"
        paused_clock = snap()["clock"]
        time.sleep(1.0)
        assert abs(snap()["clock"] - paused_clock) < 0.05  # 暫停時會議時鐘不動
        assert c.post(f"/api/meetings/{m['id']}/resume").json()["status"] == "live"
        assert c.post(f"/api/meetings/{m['id']}/stop").json()["status"] == "ended"

        s = snap()
        assert "OpBatch" in llm.calls and "Reflection" in llm.calls
        decisions = [it for it in s["minutes"]["items"] if it["kind"] == "decision" and it["status"] == "confirmed"]
        assert decisions and s["minutes"]["summary"]
        assert s["pauses"] and s["pauses"][0]["end_t"] is not None
        assert list(audio.glob(f"{m['id']}-me.flac")) and not list(spool.glob(f"{m['id']}-*"))

        # 會後確認：沒勾的決策被撤回（由使用者）
        s = c.post(f"/api/meetings/{m['id']}/confirm", json={"keep": [], "edits": {}}).json()
        assert s["meeting"]["status"] == "confirmed"
        d = next(it for it in s["minutes"]["items"] if it["id"] == decisions[0]["id"])
        assert d["status"] == "retracted" and d["history"][-1]["by"] == "user"

        listed = c.get("/api/meetings", params={"series_id": sr["id"]}).json()
        assert [x["id"] for x in listed] == [m["id"]]
        assert "# 站會 9/30" in c.get(f"/api/meetings/{m['id']}/export.md").text

        assert c.delete(f"/api/meetings/{m['id']}").json() == {"ok": True}
        assert c.get(f"/api/meetings/{m['id']}").status_code == 404
        assert not list(audio.glob(f"{m['id']}-*"))


def test_ephemeral_keeps_only_confirmed_items(tmp_path, dirs, smoke_wav):
    spool, _ = dirs
    with make_client(tmp_path) as c:
        m = c.post("/api/meetings", json={"title": "敏感會議", "mode": "ephemeral",
                                          "sources": [{"speaker": "我", "device": f"file:{smoke_wav}"}]}).json()
        c.post(f"/api/meetings/{m['id']}/start")
        snap = lambda: c.get(f"/api/meetings/{m['id']}").json()
        assert wait_for(lambda: any(u["final"] for u in snap()["utts"]))
        c.post(f"/api/meetings/{m['id']}/stop")
        assert not list(spool.glob(f"{m['id']}-*"))         # 不寫音訊暫存
        store = c.app.state.store
        assert store.utterances(m["id"]) == []               # 逐字稿不落地
        keep = [it["id"] for it in snap()["minutes"]["items"] if it["kind"] == "decision"][:1]
        s = c.post(f"/api/meetings/{m['id']}/confirm", json={"keep": keep, "edits": {}}).json()
        saved = store.meeting(m["id"])["minutes"]
        assert [it["id"] for it in saved["items"]] == keep and saved["summary"] == [] and s["utts"] == []


def test_second_screen_pairing(tmp_path, dirs):
    with make_client(tmp_path) as c:
        m = c.post("/api/meetings", json={"title": "配對測試"}).json()
        with pytest.raises(WebSocketDisconnect) as e:
            with c.websocket_connect("/ws/view?token=wrong") as ws:
                ws.receive_text()
        assert e.value.code == 4403

        pair = c.post(f"/api/meetings/{m['id']}/pair").json()
        assert pair["url"].endswith(f"/#/view/{pair['token']}")
        with c.websocket_connect(f"/ws/view?token={pair['token']}") as ws:
            snap = json.loads(ws.receive_text())
            assert snap["type"] == "snapshot" and snap["meeting"]["id"] == m["id"]

        c.delete(f"/api/meetings/{m['id']}/pair")
        with pytest.raises(WebSocketDisconnect):
            with c.websocket_connect(f"/ws/view?token={pair['token']}") as ws:
                ws.receive_text()
