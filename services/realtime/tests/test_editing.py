"""階段 ③b：會議記錄與逐字稿的手動編輯、會議資料修改。"""
from elivo.minutes import Item, MinutesEngine, Reflection

from conftest import FakeLLM
from test_api import dirs, make_client, wait_for  # noqa: F401（dirs 是 fixture）


def ended_meeting(c, smoke_wav):
    m = c.post("/api/meetings", json={"title": "編輯測試", "sources": [{"speaker": "我", "device": f"file:{smoke_wav}"}]}).json()
    c.post(f"/api/meetings/{m['id']}/start")
    snap = lambda: c.get(f"/api/meetings/{m['id']}").json()
    assert wait_for(lambda: sum(u["final"] for u in snap()["utts"]) >= 1)
    c.post(f"/api/meetings/{m['id']}/stop")
    return m["id"], snap


def test_edit_minutes_items(tmp_path, dirs, smoke_wav):
    with make_client(tmp_path) as c:
        mid, snap = ended_meeting(c, smoke_wav)
        d1 = next(it for it in snap()["minutes"]["items"] if it["kind"] == "decision")

        a = c.post(f"/api/meetings/{mid}/items", json={"kind": "action", "text": "寄會議記錄給客戶", "owner": "我", "due": "週五"}).json()
        assert a["status"] == "open" and a["history"][0]["by"] == "user"

        r = c.patch(f"/api/meetings/{mid}/items/{d1['id']}", json={"text": "下禮拜三跟客戶開 kickoff"}).json()
        assert r["text"] == "下禮拜三跟客戶開 kickoff" and r["history"][-1]["by"] == "user"

        c.patch(f"/api/meetings/{mid}/items/{a['id']}", json={"owner": ""})   # 清除負責人
        c.patch(f"/api/meetings/{mid}/items/{a['id']}", json={"status": "done"})
        assert c.delete(f"/api/meetings/{mid}/items/{d1['id']}").json() == {"ok": True}

        items = {it["id"]: it for it in snap()["minutes"]["items"]}
        assert items[a["id"]]["owner"] is None and items[a["id"]]["status"] == "done"
        assert items[d1["id"]]["status"] == "retracted"

        # 會議已結束：編輯要寫進資料庫，服務重啟後還在
        saved = {it["id"]: it for it in c.app.state.store.meeting(mid)["minutes"]["items"]}
        assert saved[d1["id"]]["status"] == "retracted" and saved[a["id"]]["status"] == "done"

        assert c.post(f"/api/meetings/{mid}/items", json={"kind": "nope", "text": "x"}).status_code == 409
        assert c.patch(f"/api/meetings/{mid}/items/Z9", json={"text": "x"}).status_code == 409


def test_edit_and_delete_utterances(tmp_path, dirs, smoke_wav):
    with make_client(tmp_path) as c:
        mid, snap = ended_meeting(c, smoke_wav)
        u = snap()["utts"][0]
        s = c.app.state.manager.get(mid)
        # 讓某個項目以這句為依據，刪除時要一併移除
        d1 = next(it for it in s.minutes.items.values() if it.kind == "decision")
        d1.utt_ids = [u["id"]]

        assert c.patch(f"/api/meetings/{mid}/utterances/{u['id']}", json={"text": "我們下禮拜三要跟客戶開 kickoff"}).status_code == 200
        stored = c.app.state.store.utterances(mid)[0]
        assert stored["text"] == "我們下禮拜三要跟客戶開 kickoff" and stored["edited"] == 1
        assert s.minutes.lines[0]["text"] == "我們下禮拜三要跟客戶開 kickoff"
        assert c.patch(f"/api/meetings/{mid}/utterances/{u['id']}", json={"text": "  "}).status_code == 409

        assert c.delete(f"/api/meetings/{mid}/utterances/{u['id']}").status_code == 200
        assert u["id"] not in [x["id"] for x in snap()["utts"]]
        assert u["id"] not in [x["id"] for x in c.app.state.store.utterances(mid)]
        assert u["id"] not in s.minutes.items[d1.id].utt_ids and u["id"] not in s.minutes.utt_t
        assert c.delete(f"/api/meetings/{mid}/utterances/{u['id']}").status_code == 409


def test_meeting_metadata_editable_after_start(tmp_path, dirs, smoke_wav):
    with make_client(tmp_path) as c:
        sp = c.post("/api/spaces", json={"name": "TIBCO"}).json()
        sr = c.post(f"/api/spaces/{sp['id']}/series", json={"name": "例會"}).json()
        mid, _ = ended_meeting(c, smoke_wav)
        m = c.patch(f"/api/meetings/{mid}", json={"title": "改名後", "space_id": sp["id"], "series_id": sr["id"],
                                                    "tags": ["客戶端"], "mode": "ephemeral"}).json()
        assert (m["title"], m["space_id"], m["series_id"], m["tags"]) == ("改名後", sp["id"], sr["id"], ["客戶端"])
        assert m["mode"] == "standard"                       # 開始後不能改模式

        c.patch(f"/api/spaces/{sp['id']}", json={"name": "TIBCO 專案", "glossary": "TIBCO\nBW6"})
        c.patch(f"/api/series/{sr['id']}", json={"name": "週會"})
        space = c.get("/api/spaces").json()[0]
        assert space["name"] == "TIBCO 專案" and space["glossary"] == "TIBCO\nBW6" and space["series"][0]["name"] == "週會"

        c.delete(f"/api/spaces/{sp['id']}")
        assert c.get(f"/api/meetings/{mid}").json()["meeting"]["space_id"] is None   # 會議保留、變成未分類


def test_user_edits_survive_reflection():
    """手動改過的欄位與手動刪除的項目，AI 的整理結果不能覆蓋或加回來。"""
    e = MinutesEngine(lambda ev: None, lambda r: None, clock=lambda: 1.0, llm=FakeLLM())
    e.items = {
        "D1": Item(id="D1", kind="decision", text="用 HubSpot", status="confirmed"),
        "A1": Item(id="A1", kind="action", text="寫計畫書", status="open", owner="他人"),
    }
    e.user_update("A1", {"owner": "我"})
    e.user_update("D1", {"status": "retracted"})
    e._merge(Reflection.model_validate({"items": [
        {"id": "D1", "kind": "decision", "text": "用 HubSpot", "status": "confirmed"},
        {"id": "A1", "kind": "action", "text": "撰寫計畫書", "status": "open", "owner": "他人"},
    ], "summary": [], "corrections": []}), seq0=10**9)
    assert e.items["A1"].owner == "我" and e.items["A1"].text == "撰寫計畫書"   # 負責人鎖住，內容可以被整理
    assert e.items["D1"].status == "retracted"
