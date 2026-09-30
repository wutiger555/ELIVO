"""「前面說過」提示（本機關鍵字檢索）：用 meeting-long 合成會議驗證命中與不誤報。"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from elivo.recall import Recall, tokens  # noqa: E402
from eval.replay_minutes import FIXTURES, load_script  # noqa: E402

CHITCHAT = ["他人-1", "我-2", "他人-8", "我-8", "他人-9"]   # 天氣、捷運、午餐、便當店


def run():
    lines = load_script("meeting-long")
    r = Recall()
    return lines, [h for l in lines if (h := r.add_utt(l["id"], l["speaker"], l["committed"], l["t"]))]


def test_hits_every_expected_topic_without_chitchat_hints():
    _, hints = run()
    spec = json.loads((FIXTURES / "meeting-long.recall.json").read_text())["expect"]
    got = {h["trigger"]: h["target"].split(":", 1)[1] for h in hints}
    # 同一個話題有好幾句都可以觸發，每個話題命中一次即可
    topics = {"CMS": ["他人-23"], "預算": ["他人-25", "我-24"], "SEO": ["我-25", "他人-27"], "主視覺": ["他人-28", "我-27"]}
    for name, triggers in topics.items():
        assert any(got.get(t) in spec[t] for t in triggers), f"{name} 沒有提示或指錯：{got}"
    assert not set(got) & set(CHITCHAT)
    assert len(hints) <= 8   # 60 句的會議，提示不能太多


def test_repeat_and_gap_limits():
    r = Recall(min_age=10, min_gap=20, repeat_after=600)
    r.add_utt("我-1", "我", "第四季行銷預算財務核下來是八十萬", 0)
    first = r.add_utt("我-2", "我", "財務說第四季行銷預算追加二十萬", 30)
    again = r.add_utt("我-3", "我", "所以第四季行銷預算財務那邊是一百萬", 60)
    assert first and first["target"] == "utt:我-1"
    assert again is None or again["target"] != "utt:我-1"   # 同一個目標 10 分鐘內不重複


def test_prefers_minutes_items_when_available():
    r = Recall(min_age=10)
    r.add_utt("我-1", "我", "那預算分配就這樣定案：社群廣告四十萬、實體活動四十萬", 0)
    r.set_items([{"id": "D1", "kind": "decision", "text": "預算分配：社群廣告 40 萬、實體活動 40 萬", "status": "superseded",
                  "superseded_by": "D2", "utt_ids": ["我-1"]}], {"我-1": 0})
    h = r.add_utt("我-2", "我", "實體活動的預算之前不是說四十萬嗎", 120)
    assert h and h["target"] == "item:D1" and h["meta"]["status"] == "superseded" and h["jump"] == "我-1"


def test_tokens_drop_function_words():
    t = tokens("行銷活動的預算 SEO 報告")
    assert "活動" in t and "預算" in t and "seo" in t
    assert not any("的" in x for x in t)
