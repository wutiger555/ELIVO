from elivo.store import Store


def test_space_series_meeting_crud(tmp_path):
    s = Store(tmp_path / "t.db")
    sp = s.create_space("APIT 專案", glossary="HubSpot\nSalesforce")
    sr = s.create_series(sp["id"], "每週站會")
    m = s.create_meeting("站會 9/30", space_id=sp["id"], series_id=sr["id"], tags=["#預算", "上線", "預算"])
    assert m["status"] == "draft" and m["tags"] == ["上線", "預算"]

    spaces = s.spaces()
    assert spaces[0]["meeting_count"] == 1 and spaces[0]["series"][0]["name"] == "每週站會"

    s.upsert_utterance(m["id"], "我-1", "我", 1.0, "預算上限 820 萬")
    s.upsert_utterance(m["id"], "我-1", "我", 1.0, "預算上限 820 萬元")   # 同一句更新
    assert [u["text"] for u in s.utterances(m["id"])] == ["預算上限 820 萬元"]

    assert [x["id"] for x in s.meetings(q="820")] == [m["id"]]          # 搜尋逐字稿
    assert [x["id"] for x in s.meetings(tag="預算")] == [m["id"]]
    assert s.meetings(series_id="nope") == []

    s.update_meeting(m["id"], title="站會（改名）", tags=["客戶端"], minutes={"items": []})
    m2 = s.meeting(m["id"])
    assert m2["title"] == "站會（改名）" and m2["tags"] == ["客戶端"] and m2["minutes"] == {"items": []}


def test_delete_space_keeps_meetings_unassigned(tmp_path):
    s = Store(tmp_path / "t.db")
    sp = s.create_space("TIBCO")
    sr = s.create_series(sp["id"], "例會")
    m = s.create_meeting("例會", space_id=sp["id"], series_id=sr["id"])
    s.delete_space(sp["id"])
    m2 = s.meeting(m["id"])
    assert m2 is not None and m2["space_id"] is None and m2["series_id"] is None


def test_delete_meeting_cascades(tmp_path):
    s = Store(tmp_path / "t.db")
    m = s.create_meeting("x", tags=["a"])
    s.upsert_utterance(m["id"], "我-1", "我", 0.0, "hi")
    s.delete_meeting(m["id"])
    assert s.meeting(m["id"]) is None and s.utterances(m["id"]) == [] and s.tags() == []


def test_mark_interrupted_only_live_or_ending(tmp_path):
    s = Store(tmp_path / "t.db")
    live = s.create_meeting("live")
    paused = s.create_meeting("paused")
    s.update_meeting(live["id"], status="live")
    s.update_meeting(paused["id"], status="paused")
    assert s.mark_interrupted() == [live["id"]]
    assert s.meeting(live["id"])["status"] == "interrupted"
    assert s.meeting(paused["id"])["status"] == "paused"
