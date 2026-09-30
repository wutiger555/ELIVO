"""④ 主動提示：帳本比對、數字差異、衝突候選、提醒與配額。"""
from elivo.surfacing import Surfacer, parse_number

MEETING = {"id": "m_old", "title": "週會 9/23", "series_id": None, "started_at": 1.0}


def entry(id, kind, text, status, **kw):
    return {"key": f"m_old:{id}", "id": id, "kind": kind, "text": text, "status": status, "meeting": MEETING,
            "value": kw.get("value"), "answer": None, "owner": None, "due": None, "quote": kw.get("quote"), "jump": None}


def item(id, kind, text, utt, status=None, **kw):
    status = status or {"decision": "confirmed", "action": "open", "question": "open", "number": "current"}[kind]
    return {"id": id, "kind": kind, "text": text, "status": status, "utt_ids": [utt], "history": [], **kw}


LEDGER = [
    entry("D1", "decision", "CMS 先用 WordPress", "confirmed", quote="CMS 我們先用 WordPress 好了"),
    entry("N1", "number", "第四季行銷預算", "current", value="80 萬"),
    entry("D9", "decision", "舊的不算", "superseded"),
]


def test_parse_number():
    assert parse_number("80 萬") == (800000, "")
    assert parse_number("NT$1,200") == (1200, "")
    assert parse_number("15%") == (15, "%")
    assert parse_number("未定") is None


def test_previous_meeting_hint_from_ledger():
    s = Surfacer(ledger=LEDGER)
    cards = s.add_utt("我-1", "我", "那 CMS 的部分，WordPress 那邊之前是怎麼說的", 30)
    assert cards and cards[0]["type"] == "previous" and cards[0]["target"] == "ledger:m_old:D1"
    assert cards[0]["meta"]["meeting"]["title"] == "週會 9/23" and cards[0]["level"] == "ambient"


def test_number_drift_and_conflict_candidates():
    s = Surfacer(ledger=LEDGER)
    s.add_utt("我-1", "我", "財務說第四季行銷預算追加到一百萬", 10)
    s.add_utt("我-2", "我", "CMS 改用 Strapi", 20)
    cards, cands = s.set_items([
        item("N1", "number", "第四季行銷預算", "我-1", value="100 萬"),
        item("D1", "decision", "CMS 改用 Strapi", "我-2"),
        item("D2", "decision", "首頁主視覺改成影片", "我-2"),
    ], {"我-1": 10, "我-2": 20}, 25)
    assert [c["type"] for c in cards] == ["number_drift"]
    assert cards[0]["meta"]["change"] == "+25%" and cards[0]["level"] == "promoted" and cards[0]["jump"] == "我-1"
    assert [(i["id"], o["id"]) for i, o in cands] == [("D1", "D1")]   # 只有講同一件事的才要問 LLM

    # 同樣內容再送一次不重複；配額：2 分鐘內第二張 promoted 降為 ambient
    assert s.set_items([item("N1", "number", "第四季行銷預算", "我-1", value="100 萬")], {}, 30) == ([], [])
    c = s.add_conflict(cands[0][0], cands[0][1], "CMS 由 WordPress 改為 Strapi", 40)
    assert c["type"] == "conflict" and c["level"] == "ambient"
    c2 = s.add_conflict(cands[0][0], cands[0][1], "x", 200)
    assert c2["level"] == "promoted"


def test_number_drift_with_different_wording():
    # 實測：帳本寫「第四季行銷預算」，這場整理成「行銷活動年底預算」
    s = Surfacer(ledger=LEDGER)
    cards, _ = s.set_items([item("N8", "number", "行銷活動年底預算", "我-1", value="100 萬"),
                            item("N9", "number", "實體活動預算", "我-1", value="60 萬")], {"我-1": 1}, 5)
    assert [(c["meta"]["id"], c["meta"]["change"]) for c in cards] == [("N8", "+25%")]


def test_small_number_change_is_not_drift():
    s = Surfacer(ledger=LEDGER)
    cards, _ = s.set_items([item("N1", "number", "第四季行銷預算", "我-1", value="82 萬")], {"我-1": 1}, 5)
    assert cards == []


def test_reminders_open_question_after_topic_shift_and_unowned_action():
    s = Surfacer()
    s.add_utt("他人-1", "他人", "英文版官網要不要一起做", 0)
    s.set_items([item("Q1", "question", "英文版官網要不要一起做", "他人-1"),
                 item("A1", "action", "整理 SEO 現況報告", "他人-1")], {"他人-1": 0}, 1)
    got = []
    for i in range(12):
        got += s.add_utt(f"我-{i}", "我", f"主視覺第 {i} 版的配色再調整", 60 + i * 20)
    types = [c["type"] for c in got]
    assert "open_question" in types and "unowned_action" in types
    assert types.count("open_question") == 1   # 每個項目只提醒一次


def test_question_still_being_discussed_is_not_reminded():
    s = Surfacer()
    s.add_utt("他人-1", "他人", "英文版官網要不要一起做", 0)
    s.set_items([item("Q1", "question", "英文版官網要不要一起做", "他人-1")], {"他人-1": 0}, 1)
    got = []
    for i in range(10):
        got += s.add_utt(f"我-{i}", "我", "英文版官網的翻譯可以外包", 200 + i * 5)
    assert not any(c["type"] == "open_question" for c in got)
