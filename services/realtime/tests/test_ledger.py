"""階段 ⑤：跨會議的決策帳本（Space 內確認過的會議記錄彙整）。"""
from test_api import dirs, make_client, wait_for  # noqa: F401（dirs 是 fixture）


def item(id, kind, text, status, **kw):
    return {"id": id, "kind": kind, "text": text, "status": status, "utt_ids": kw.pop("utt_ids", []), "history": [], **kw}


def seed(store, space_id, series_id, title, started_at, items, status="confirmed", utts=()):
    m = store.create_meeting(title, space_id=space_id, series_id=series_id)
    for uid, text in utts:
        store.upsert_utterance(m["id"], uid, "我", 1.0, text)
    store.update_meeting(m["id"], status=status, started_at=started_at, minutes={"items": items, "summary": [], "utt_t": {}})
    return m["id"]


def test_ledger_lists_confirmed_items_across_meetings(tmp_path):
    with make_client(tmp_path) as c:
        s = c.app.state.store
        sp = s.create_space("官網改版")
        other = s.create_space("別的客戶")
        m1 = seed(s, sp["id"], None, "9/12 週會", 100, [
            item("D1", "decision", "CMS 採用 WordPress", "superseded", superseded_by="D2"),
            item("A1", "action", "整理 SEO 報告", "open", owner="Amy", utt_ids=["我-1"]),
            item("Q1", "question", "要不要做多語系", "retracted"),
        ], utts=[("我-1", "SEO 報告麻煩 Amy 整理")])
        m2 = seed(s, sp["id"], None, "9/19 週會", 200, [item("D1", "decision", "CMS 改用 Strapi", "confirmed")])
        seed(s, sp["id"], None, "還沒確認", 300, [item("D1", "decision", "不該出現", "confirmed")], status="ended")
        seed(s, other["id"], None, "別的客戶", 400, [item("D1", "decision", "CMS 用 Drupal", "confirmed")])

        all_ = c.get(f"/api/spaces/{sp['id']}/ledger").json()
        assert [it["key"] for it in all_] == [f"{m2}:D1", f"{m1}:D1", f"{m1}:A1"]   # 新的在前；撤回、未確認、別的 Space 都不列
        a1 = all_[2]
        assert a1["meeting"]["title"] == "9/12 週會" and a1["jump"] == "我-1" and a1["quote"] == "SEO 報告麻煩 Amy 整理"

        active = c.get(f"/api/spaces/{sp['id']}/ledger", params={"active": True}).json()
        assert [it["key"] for it in active] == [f"{m2}:D1", f"{m1}:A1"]

        hits = c.get(f"/api/spaces/{sp['id']}/ledger", params={"q": "什麼時候決定 CMS"}).json()
        assert {it["key"] for it in hits} == {f"{m2}:D1", f"{m1}:D1"}
        assert c.get(f"/api/spaces/{sp['id']}/ledger", params={"kind": "action"}).json()[0]["owner"] == "Amy"
        assert c.get("/api/spaces/nope/ledger").status_code == 404


def test_brief_carries_open_items_from_older_meetings(tmp_path):
    with make_client(tmp_path) as c:
        s = c.app.state.store
        sp = s.create_space("官網改版")
        sr = s.create_series(sp["id"], "週會")
        seed(s, sp["id"], sr["id"], "第一場", 100, [
            item("A1", "action", "整理 SEO 報告", "open"),
            item("A2", "action", "寄報價", "done"),
            item("Q1", "question", "要不要做多語系", "open"),
            item("D1", "decision", "舊決策不帶", "confirmed"),
        ])
        seed(s, sp["id"], sr["id"], "第二場", 200, [item("D1", "decision", "CMS 改用 Strapi", "confirmed")])

        b = c.get(f"/api/series/{sr['id']}/brief").json()
        assert b["meeting"]["title"] == "第二場"
        got = [(it["text"], (it.get("from") or {}).get("title")) for it in b["items"]]
        assert got == [("CMS 改用 Strapi", None), ("整理 SEO 報告", "第一場"), ("要不要做多語系", "第一場")]


def test_live_meeting_flags_change_from_ledger_decision(tmp_path, dirs, smoke_wav):
    with make_client(tmp_path) as c:
        s = c.app.state.store
        sp = s.create_space("客戶 A")
        seed(s, sp["id"], None, "上週", 100, [item("D1", "decision", "下禮拜二跟 client 開會", "confirmed")])
        m = c.post("/api/meetings", json={"title": "這週", "space_id": sp["id"],
                                          "sources": [{"speaker": "我", "device": f"file:{smoke_wav}"}]}).json()
        c.post(f"/api/meetings/{m['id']}/start")
        snap = lambda: c.get(f"/api/meetings/{m['id']}").json()
        # 假的 fast 會新增「下禮拜三跟 client 開會」；本機比對到舊決策 → 假的 LLM 判斷為 changed → 衝突卡片
        assert wait_for(lambda: any(h["type"] == "conflict" for h in snap()["hints"]))
        card = next(h for h in snap()["hints"] if h["type"] == "conflict")
        assert card["meta"]["old"]["meeting"]["title"] == "上週" and card["meta"]["note"]
        c.post(f"/api/meetings/{m['id']}/stop")
