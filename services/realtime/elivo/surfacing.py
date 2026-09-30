"""④ 主動提示（surfacing policy）：什麼時候、用哪一種卡片提醒。

| type           | 內容                                   | 判斷方式                                   | 顯示     |
|----------------|----------------------------------------|--------------------------------------------|----------|
| recall         | 本場前面提過                           | 本機 BM25（recall.py）                     | ambient  |
| previous       | 先前會議確認過的決策、數字、待辦、問題 | 本機 BM25，比對同一個 Space 的帳本         | ambient  |
| number_drift   | 數字和帳本裡同一項不同（差異超過 10%） | 本機：比對項目文字、解析數值               | promoted |
| conflict       | 新決策和帳本裡的有效決策不同           | 本機先找相近的舊決策，再請 fast 模型判斷一次 | promoted |
| open_question  | 問題提出 3 分鐘後還沒回答、話題已轉走  | 本機                                       | ambient  |
| unowned_action | 待辦 3 分鐘後還沒有負責人              | 本機                                       | ambient  |

只在一句定稿（說話告一段落）或會議記錄更新時檢查。promoted 卡片有配額（2 分鐘 1 張、每小時 8 張），
超過就降為 ambient：照樣列出，但不醒目。永遠不發聲。見 03-technical-architecture §4.7–4.8。
"""
import re

from .minutes import STATUSES
from .recall import Recall, bm25, tokens

PROMOTED = {"number_drift", "conflict"}
_NUM = re.compile(r"(-?\d[\d,]*(?:\.\d+)?)\s*(%|％|萬|億|千|百|k\b|m\b|b\b)?", re.I)
UNIT = {"萬": 1e4, "億": 1e8, "千": 1e3, "百": 100, "k": 1e3, "m": 1e6, "b": 1e9}


def active(it: dict) -> bool:
    return it["status"] == STATUSES[it["kind"]][0]


def parse_number(value: str | None) -> tuple[float, str] | None:
    """「80 萬」→ (800000, "")；「15%」→ (15, "%")。只取第一個數字，解析不了回傳 None。"""
    m = _NUM.search((value or "").replace("，", ","))
    if not m:
        return None
    n, unit = float(m.group(1).replace(",", "")), (m.group(2) or "").lower()
    return (n, "%") if unit in ("%", "％") else (n * UNIT.get(unit, 1), "")


class Surfacer:
    def __init__(self, glossary: list[str] | None = None, ledger: list[dict] | None = None, promoted_gap: float = 120.0,
                 promoted_per_hour: int = 8, remind_after: float = 180.0, shift_lines: int = 6, drift: float = 0.10):
        self.recall = Recall(glossary)
        self.ledger = [e for e in (ledger or []) if active(e)]
        self.recall.set_ledger(self.ledger)
        self.promoted_gap, self.promoted_per_hour = promoted_gap, promoted_per_hour
        self.remind_after, self.shift_lines, self.drift = remind_after, shift_lines, drift
        self.items: list[dict] = []
        self.utt_t: dict[str, float] = {}
        self.checked: dict[str, tuple] = {}   # 項目 id → 已檢查過的內容（內容變了才再比對帳本）
        self.reminded: set[str] = set()
        self.promoted_at: list[float] = []
        self.cards: list[dict] = []

    # ---- 輸入 ----

    def load(self, lines: list[dict]):
        self.recall.load(lines)

    def restore(self, items: list[dict], utt_t: dict[str, float]):
        """服務重啟後恢復：已經存在的項目視為檢查過，不重複提示。"""
        self._set(items, utt_t)
        self.checked = {it["id"]: (it["text"], it.get("value")) for it in items}

    def delete_utt(self, uid: str):
        self.recall.delete_utt(uid)
        self.cards = [c for c in self.cards if uid not in (c["trigger"], c["jump"])]

    def add_utt(self, uid: str, speaker: str, text: str, t: float) -> list[dict]:
        """一句定稿：「前面提過／先前會議」與提醒類卡片。"""
        out = []
        hint = self.recall.add_utt(uid, speaker, text, t)
        if hint:
            out.append(self._emit(hint))
        else:
            reminder = self._reminder(uid, t)
            if reminder:
                out.append(self._emit(reminder))
        return out

    def set_items(self, items: list[dict], utt_t: dict[str, float], now: float) -> tuple[list[dict], list[tuple[dict, dict]]]:
        """會議記錄更新：回傳（數字差異卡片，待 LLM 判斷的「新決策、相近的舊決策」）。"""
        self._set(items, utt_t)
        cards, candidates = [], []
        for it in self.items:
            sig = (it["text"], it.get("value"))
            if not active(it) or self.checked.get(it["id"]) == sig:
                continue
            self.checked[it["id"]] = sig
            if it["kind"] == "number":
                card = self._drift(it, now)
                if card:
                    cards.append(self._emit(card))
            elif it["kind"] == "decision":
                old = self._match(it, loose=True)
                if old:
                    candidates.append((it, old))
        return cards, candidates

    def add_conflict(self, item: dict, old: dict, note: str, now: float) -> dict:
        ids = [u for u in item.get("utt_ids", []) if u in self.utt_t]
        return self._emit({"type": "conflict", "t": now, "trigger": ids[-1] if ids else None, "target": f"ledger:{old['key']}",
                           "target_t": -1.0, "jump": ids[-1] if ids else None, "matched": [], "score": 0.0,
                           "meta": {"id": item["id"], "kind": "decision", "text": item["text"], "note": note, "old": old}})

    # ---- 判斷 ----

    def _set(self, items, utt_t):
        self.items = [it for it in items if it["status"] != "retracted"]
        self.utt_t.update(utt_t)
        self.recall.set_items(items, utt_t)

    def _item_t(self, it: dict) -> float | None:
        ts = [self.utt_t[u] for u in it.get("utt_ids", []) if u in self.utt_t]
        return max(ts) if ts else (it["history"][0]["t"] if it.get("history") else None)

    def _match(self, it: dict, loose: bool = False) -> dict | None:
        """帳本裡同類、講同一件事的有效項目：至少兩個詞相符，且涵蓋較短一方三分之一以上的詞
        （同一個數字常有不同叫法：「第四季行銷預算」＝「行銷活動年底預算」）。

        loose（決策用）：共用一個英文名詞或術語表的詞（CMS、SAP…）也算。決策被改時，新舊說法常常
        只剩主題詞相同（「CMS 先用 WordPress」→「CMS 改用 Strapi」）；是否真的不同交給 LLM 判斷。
        """
        pool = [e for e in self.ledger if e["kind"] == it["kind"]]
        q = set(tokens(it["text"]))
        best = None
        for e, (score, matched) in zip(pool, bm25(list(q), [e["text"] for e in pool], self.recall.glossary)):
            short = min(len(q), len(set(tokens(e["text"])))) or 1
            ok = len(matched) >= 2 and len(matched) / short >= 1 / 3
            if loose and not ok:
                ok = any(m in self.recall.glossary or (m.isascii() and m.isalpha()) for m in matched)
            if ok and (best is None or score > best[0]):
                best = (score, e)
        return best[1] if best else None

    def _drift(self, it: dict, now: float) -> dict | None:
        old = self._match(it)
        new_v, old_v = parse_number(it.get("value")), parse_number(old and old.get("value"))
        if not old or not new_v or not old_v or new_v[1] != old_v[1] or old_v[0] == 0:
            return None
        change = (new_v[0] - old_v[0]) / abs(old_v[0])
        if abs(change) <= self.drift:
            return None
        ids = [u for u in it.get("utt_ids", []) if u in self.utt_t]
        return {"type": "number_drift", "t": now, "trigger": ids[-1] if ids else None, "target": f"ledger:{old['key']}",
                "target_t": -1.0, "jump": ids[-1] if ids else None, "matched": [], "score": round(change, 3),
                "meta": {"id": it["id"], "kind": "number", "text": it["text"], "value": it.get("value"),
                         "change": f"{change:+.0%}", "old": old}}

    def _reminder(self, uid: str, now: float) -> dict | None:
        """未答問題（話題已轉走）與沒有負責人的待辦。每個項目只提醒一次，每句最多一張。"""
        for it in self.items:
            t = self._item_t(it)
            if it["id"] in self.reminded or not active(it) or t is None or now - t < self.remind_after:
                continue
            if it["kind"] == "question":
                later = [u for u in self.recall.utts if u["t"] > t][-self.shift_lines:]
                recent = {tok for u in later for tok in tokens(u["text"])}
                if len(later) < self.shift_lines or set(tokens(it["text"])) & recent:
                    continue   # 還在討論這個問題
                kind = "open_question"
            elif it["kind"] == "action" and not it.get("owner"):
                kind = "unowned_action"
            else:
                continue
            self.reminded.add(it["id"])
            ids = [u for u in it.get("utt_ids", []) if u in self.utt_t]
            return {"type": kind, "t": now, "trigger": uid, "target": f"item:{it['id']}", "target_t": t,
                    "jump": ids[-1] if ids else None, "matched": [], "score": 0.0,
                    "meta": {k: it.get(k) for k in ("id", "kind", "text", "status", "owner", "due")}}
        return None

    def _emit(self, card: dict) -> dict:
        now = card["t"]
        level = "ambient"
        if card["type"] in PROMOTED:
            recent = [x for x in self.promoted_at if now - x < 3600]
            if (not recent or now - recent[-1] >= self.promoted_gap) and len(recent) < self.promoted_per_hour:
                level = "promoted"
                self.promoted_at.append(now)
        card = {**card, "id": f"C{len(self.cards) + 1}", "level": level}
        self.cards.append(card)
        return card
