"""術語校正（拼音比對）與 Whisper 術語提示。"""
from elivo.glossfix import PROMPT_BUDGET, GlossaryFixer, _weight

from test_api import dirs, make_client, wait_for  # noqa: F401（dirs 是 fixture）

F = GlossaryFixer(["林宗翰", "凱基", "WordPress", "Strapi", "資安", "意聯"])


def fixed(text):
    r = F.fix(text)
    return r.text, [(f["from"], f["to"]) for f in r.fixes], [(c["from"], c["to"]) for c in r.candidates]


def test_same_reading_names_are_fixed_directly():
    assert fixed("林總翰說下週再看") == ("林宗翰說下週再看", [("林總翰", "林宗翰")], [])
    assert fixed("我們先用 wordpress") == ("我們先用 WordPress", [("wordpress", "WordPress")], [])
    assert fixed("林宗翰已經寫對了") == ("林宗翰已經寫對了", [], [])


def test_ambiguous_matches_go_to_llm_not_applied():
    # 「開機」和「凱基」讀音相同，只有上下文分得出來；模糊音（zhi/zi）也要確認
    assert fixed("電腦開機之後") == ("電腦開機之後", [], [("開機", "凱基")])
    assert fixed("治安不好") == ("治安不好", [], [("治安", "資安")])
    assert fixed("後台改用 Strapy") == ("後台改用 Strapy", [], [("Strapy", "Strapi")])
    assert fixed("今天天氣很好") == ("今天天氣很好", [], [])


def test_far_field_style_errors():
    f = GlossaryFixer(["林宗翰", "黃思涵", "Salesforce", "Power BI", "KPI"])
    assert f.fix("黃思寒代表").text == "黃思涵代表"                          # 讀音相同的人名：直接改
    assert f.fix("那 sales force 的授權").text == "那 Salesforce 的授權"      # 英文：忽略大小寫與空白
    assert f.fix("用 power bi 做 kpi 的報表").text == "用 Power BI 做 KPI 的報表"
    assert [(c["from"], c["to"]) for c in f.fix("林中漢那邊有來嗎").candidates] == [("林中漢", "林宗翰")]   # 聽得差不多：問 LLM
    assert [(c["from"], c["to"]) for c in f.fix("宗漢今天請假").candidates] == [("宗漢", "宗翰")]   # 人名也比對名字


def test_ordinary_meeting_has_no_false_candidates():
    # 一般會議的 60 句（數字、閒聊、決策）配上一份人名很多的術語表：不應該出現候選或修改
    from eval.replay_minutes import load_script
    f = GlossaryFixer(["達新科技", "意聯", "宏遠物流", "林宗翰", "黃思涵", "陳怡君", "蔡承恩", "鄭雅婷", "Strapi", "WordPress",
                       "Salesforce", "HubSpot", "Power BI", "SLA", "POC", "KPI", "CMS", "資安稽核"])
    noisy = [(l["committed"], f.fix(l["committed"])) for l in load_script("meeting-long")]
    assert [t for t, r in noisy if r.fixes or r.candidates] == []


def test_apply_accepted_candidates():
    r = F.fix("凱基說，電腦開機後再給報價；藝聯那邊也一樣")
    assert [c["from"] for c in r.candidates] == ["開機", "藝聯"]
    text, fixes = F.apply(r.text, r.candidates, [1])
    assert text == "凱基說，電腦開機後再給報價；意聯那邊也一樣" and fixes == [{"from": "藝聯", "to": "意聯", "auto": False}]


def test_prompt_prefers_recent_terms_within_budget():
    many = [f"術語{i:03d}號" for i in range(100)]
    f = GlossaryFixer(many + ["Strapi"])
    p = f.prompt("剛剛講到 Strapi")
    assert p.startswith("Strapi、") and sum(_weight(t) for t in p.split("、")) <= PROMPT_BUDGET


def test_live_meeting_applies_llm_confirmed_fix(tmp_path, dirs, smoke_wav):
    # 假的 ASR 一直說「…跟 client 開會」；術語表有「Clint」→ 候選 → 假的 LLM 接受 → 逐字稿改成 Clint 並留下紀錄
    with make_client(tmp_path) as c:
        m = c.post("/api/meetings", json={"title": "校正", "glossary": "Clint",
                                          "sources": [{"speaker": "我", "device": f"file:{smoke_wav}"}]}).json()
        c.post(f"/api/meetings/{m['id']}/start")
        snap = lambda: c.get(f"/api/meetings/{m['id']}").json()
        assert wait_for(lambda: any("Clint" in u["committed"] for u in snap()["utts"]))
        u = next(u for u in snap()["utts"] if "Clint" in u["committed"])
        assert u["fixes"] == [{"from": "client", "to": "Clint", "auto": False}] and not u.get("edited")
        c.post(f"/api/meetings/{m['id']}/stop")
        saved = c.app.state.store.utterances(m["id"])
        assert any(r["fixes"] and "Clint" in r["text"] for r in saved)
