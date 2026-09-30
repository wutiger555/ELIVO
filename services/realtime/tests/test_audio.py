"""會後錄音：預設保存、播放、確認時刪除、錄音檔管理與清理。"""
import time

from test_api import dirs, make_client, wait_for  # noqa: F401（dirs 是 fixture）


def recorded(c, smoke_wav, **kw):
    m = c.post("/api/meetings", json={"title": "錄音測試", "sources": [{"speaker": "我", "device": f"file:{smoke_wav}"}], **kw}).json()
    c.post(f"/api/meetings/{m['id']}/start")
    assert wait_for(lambda: any(u["final"] for u in c.get(f"/api/meetings/{m['id']}").json()["utts"]))
    c.post(f"/api/meetings/{m['id']}/stop")
    return m["id"]


def test_audio_kept_by_default_playable_and_deleted_on_confirm(tmp_path, dirs, smoke_wav):
    _, audio = dirs
    with make_client(tmp_path) as c:
        mid = recorded(c, smoke_wav)                       # 沒指定 keep_audio：預設保存
        files = c.get(f"/api/meetings/{mid}/audio").json()
        assert [f["speaker"] for f in files] == ["我"] and files[0]["bytes"] > 0
        r = c.get(files[0]["url"], headers={"Range": "bytes=0-99"})
        assert r.status_code == 206 and len(r.content) == 100   # 可以拖曳播放
        assert c.get(f"/api/meetings/{mid}/audio/..%2Fx.flac").status_code == 404

        c.post(f"/api/meetings/{mid}/confirm", json={"keep": [], "edits": {}, "keep_audio": False})
        assert c.get(f"/api/meetings/{mid}/audio").json() == [] and not list(audio.glob(f"{mid}-*"))
        assert c.get(f"/api/meetings/{mid}").json()["meeting"]["keep_audio"] is False


def test_audio_library_and_cleanup(tmp_path, dirs, smoke_wav):
    with make_client(tmp_path) as c:
        old = recorded(c, smoke_wav)
        new = recorded(c, smoke_wav)
        not_kept = recorded(c, smoke_wav, keep_audio=False)
        lib = c.get("/api/audio").json()
        assert [r["meeting"]["id"] for r in lib["meetings"]] == [new, old]
        assert lib["total_bytes"] == sum(r["bytes"] for r in lib["meetings"]) and lib["free_bytes"] > 0
        assert not_kept not in {r["meeting"]["id"] for r in lib["meetings"]}

        c.app.state.store.update_meeting(old, ended_at=time.time() - 40 * 86400)
        r = c.post("/api/audio/cleanup", json={"older_than_days": 30}).json()
        assert r["meetings"] == 1 and r["freed"] > 0
        assert [x["meeting"]["id"] for x in c.get("/api/audio").json()["meetings"]] == [new]
        assert c.delete(f"/api/meetings/{new}/audio").json()["freed"] > 0
        assert c.get("/api/audio").json()["meetings"] == []
