"""「前面說過」提示：不用 LLM，在本機用關鍵字檢索找出與當下這句相關的先前內容。

- 文件：會議記錄項目（決策、數字、問題、待辦，含依據句子的文字）；沒有會議記錄時退回用先前的逐字稿句子。
  另外加上同一個 Space 帳本裡確認過的有效項目（先前會議的決策等），命中時提示類型是 previous。
- 斷詞：中文取相鄰兩字（去掉「我們」「這個」這類常見詞），英文與數字取整個詞，術語表的詞加權。
- 分數：BM25。只在「定稿的句子」（說話告一段落）時檢查，符合條件才出提示。
- 出提示的條件（surfacing policy 的簡化版，見 03-technical-architecture §4.7）：
  - 目標內容至少是 60 秒前說的（不提示剛剛才講的）；
  - 至少兩個有意義的詞相符，且分數超過門檻；句子裡有「之前、上次、不是說」這類回指詞時門檻降低；
  - 同一個目標 10 分鐘內不重複；兩次提示至少間隔 20 秒（句子有回指詞時不受此限）。
成本為零、延遲在毫秒級；效果不夠時再考慮本機 embedding。
"""
import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass, field

from .minutes import STATUSES

CJK = r"㐀-䶿一-鿿"
_TOKEN = re.compile(rf"[{CJK}]+|[a-z0-9]+")
# 太常見、不帶資訊的兩字組
STOP = set("""我們 你們 他們 這個 那個 這樣 那樣 就是 然後 所以 因為 可以 可能 應該 覺得 我覺 什麼 怎麼 一下 一個 一點 有點
沒有 不是 還是 如果 的話 好了 好啊 對啊 大家 現在 今天 剛剛 之前 上次 我來 我會 他們 這邊 那邊 一樣 比較 其實 知道 需要
要不 不要 我再 再看 看一 一下 部分 的部 分我 們上 上禮 禮拜 下禮 大概 左右 差不 不多 沒問 問題 題那 那我 我們 們就 就決
決定 定照 還有 有一 件事 對了 說到 到這 這件 事情 時候 什麼 麼時""".split())
# 虛詞：含這些字的兩字組多半不帶資訊（「動的」「的預」）
FUNC = set("的了是在有和跟就也都嗎呢吧啊喔呀嘛著過個們這那要會還把被讓給")
ANAPHORA = re.compile(r"之前|上次|前面|剛剛說|不是說|原本|那個.{0,6}(方案|數字|預算|決定)|還是.{0,4}(一樣|那樣)")


def tokens(text: str) -> list[str]:
    text = unicodedata.normalize("NFKC", text).lower()
    out = []
    for run in _TOKEN.findall(text):
        if re.match(rf"[{CJK}]", run):
            out += [run[i:i + 2] for i in range(len(run) - 1)
                    if run[i:i + 2] not in STOP and run[i] not in FUNC and run[i + 1] not in FUNC]
        elif len(run) >= 2 or run.isdigit():
            out.append(run)
    return out


def bm25(q: list[str], texts: list[str], glossary: set[str] = frozenset()) -> list[tuple[float, list[str]]]:
    """每份文件對查詢詞的 BM25 分數與相符的詞。"""
    if not texts:
        return []
    toks = [tokens(t) for t in texts]
    n, avgdl = len(texts), sum(map(len, toks)) / len(texts) or 1
    df = Counter(tok for ts in toks for tok in set(ts))
    qset = set(q)
    out = []
    for ts in toks:
        tf = Counter(ts)
        matched = [tok for tok in qset if tf[tok]]
        score = 0.0
        for tok in matched:
            # 下限 1.0：會議剛開始、可比對的內容很少時，BM25 的 idf 會小到任何相符都過不了門檻
            idf = max(1.0, math.log(1 + (n - df[tok] + 0.5) / (df[tok] + 0.5)))
            w = 3.0 if tok in glossary else 1.0
            score += w * idf * tf[tok] * 2.2 / (tf[tok] + 1.2 * (0.25 + 0.75 * len(ts) / avgdl))
        out.append((score, matched))
    return out


@dataclass
class Doc:
    key: str               # "item:D2" 或 "utt:我-5"
    text: str
    t: float               # 內容出現的時間（取依據句子中最晚的一句）
    utt_id: str | None     # 點提示要跳到的句子
    meta: dict = field(default_factory=dict)


class Recall:
    def __init__(self, glossary: list[str] | None = None, min_age: float = 60.0, min_gap: float = 20.0,
                 repeat_after: float = 600.0, threshold: float = 4.0):
        self.glossary = {g.lower() for g in (glossary or []) if g}
        self.min_age, self.min_gap, self.repeat_after, self.threshold = min_age, min_gap, repeat_after, threshold
        self.utts: list[dict] = []
        self.items: list[dict] = []
        self.ledger: list[dict] = []          # 帳本（store.ledger 的項目）：先前會議確認過的內容
        self.utt_t: dict[str, float] = {}
        self.last_hint_at = -1e9
        self.shown: dict[str, float] = {}    # 目標 key → 上次提示時間
        self.hints: list[dict] = []

    # ---- 輸入 ----

    def set_items(self, items: list[dict], utt_t: dict[str, float]):
        self.items = [it for it in items if it["status"] != "retracted"]
        self.utt_t.update(utt_t)

    def set_ledger(self, entries: list[dict]):
        self.ledger = [e for e in entries if e["status"] == STATUSES[e["kind"]][0]]   # 只用還有效的項目

    def add_utt(self, uid: str, speaker: str, text: str, t: float) -> dict | None:
        """一句定稿：先檢查要不要出提示，再把這句加入索引。"""
        hint = self._check(uid, text, t)
        self.utts.append({"id": uid, "speaker": speaker, "text": text, "t": t})
        self.utt_t[uid] = t
        return hint

    def load(self, lines: list[dict]):
        """從資料庫恢復已經說過的句子（只建索引，不出提示）。"""
        for l in lines:
            self.utts.append({"id": l["id"], "speaker": l["speaker"], "text": l["text"], "t": l["t"]})
            self.utt_t[l["id"]] = l["t"]

    def delete_utt(self, uid: str):
        self.utts = [u for u in self.utts if u["id"] != uid]
        self.utt_t.pop(uid, None)

    # ---- 檢索 ----

    def _docs(self, now: float) -> list[Doc]:
        utt_text = {u["id"]: u["text"] for u in self.utts}
        docs = []
        for it in self.items:
            ids = [u for u in it.get("utt_ids", []) if u in self.utt_t]
            t = max((self.utt_t[u] for u in ids), default=None)
            if t is None or now - t < self.min_age:
                continue
            text = " ".join(filter(None, [it["text"], it.get("value"), it.get("answer")] + [utt_text.get(u, "") for u in ids]))
            docs.append(Doc(f"item:{it['id']}", text, t, ids[-1] if ids else None,
                            {k: it.get(k) for k in ("id", "kind", "text", "status", "value", "answer", "superseded_by")}))
        if not docs:   # 沒有會議記錄時（例如沒有 LLM 金鑰）退回用逐字稿
            docs = [Doc(f"utt:{u['id']}", u["text"], u["t"], u["id"], {"speaker": u["speaker"], "text": u["text"]})
                    for u in self.utts if now - u["t"] >= self.min_age]
        for e in self.ledger:
            text = " ".join(filter(None, [e["text"], e.get("value"), e.get("answer"), e.get("quote")]))
            docs.append(Doc(f"ledger:{e['key']}", text, -1.0, None,
                            {**{k: e.get(k) for k in ("id", "kind", "text", "status", "value", "answer", "owner", "due", "quote", "jump")},
                             "meeting": e["meeting"]}))
        return docs

    def _check(self, uid: str, text: str, now: float) -> dict | None:
        q = tokens(text)
        anaphora = bool(ANAPHORA.search(text))
        # 有回指詞（之前、上次、不是說…）時不受提示間隔限制：使用者正在問前面的事
        if len(q) < 2 or (now - self.last_hint_at < self.min_gap and not anaphora):
            return None
        docs = self._docs(now)
        if not docs:
            return None
        best = None
        for d, (score, matched) in zip(docs, bm25(q, [d.text for d in docs], self.glossary)):
            if now - self.shown.get(d.key, -1e9) < self.repeat_after or len(matched) < 2:
                continue
            if best is None or score > best[0]:
                best = (score, d, matched)
        if best is None:
            return None
        score, d, matched = best
        if score < (self.threshold * 0.6 if anaphora else self.threshold):
            return None
        self.last_hint_at = now
        self.shown[d.key] = now
        hint = {"id": f"H{len(self.hints) + 1}", "type": "previous" if d.key.startswith("ledger:") else "recall",
                "t": now, "trigger": uid, "target": d.key, "target_t": d.t,
                "jump": d.utt_id, "matched": sorted(matched), "score": round(score, 2), "meta": d.meta}
        self.hints.append(hint)
        return hint
