"""術語校正：用拼音比對，把語音辨識寫錯的人名、公司名、產品名改成術語表的寫法；也負責挑選送給 Whisper 的術語提示。

研究見 docs/research/E-far-field-and-multi-device.md §A2。
- 中文術語：逐字稿與術語都轉成無聲調拼音（多音字取所有讀音），用滑動視窗比對。
  - 3 字以上、讀音完全相同 → 直接改（多半是人名：林總翰 → 林宗翰）。
  - 其他讀音相近的 → 列為候選，交給 LLM 依上下文判斷，不會直接改：
    - 2 字、讀音相同（「開機」和「凱基」只有上下文分得出來）；
    - 台灣口音的模糊音下相同（zh/z、ch/c、sh/s、n/l、eng/en、ing/in）；
    - 遠場收音常見的「聽得差不多」（只限 3 字以上）：至少一半的音節相同，其他音節只差一個字母（林宗翰 → 林中漢）。
      2 字的詞太容易撞到一般用語（「十萬」和「思涵」只差一個字母），只比對讀音相同或模糊音相同。
    含「的、了、是」這類虛詞的片段不比對（多半是一般句子）。
  - 三個字、第一個字是常見姓氏的術語視為人名，另外比對名字（林宗翰 → 也比對「宗翰」），因為同事之間多半只叫名字。
- 英文術語：忽略大小寫與空白完全相同就直接改（wordpress → WordPress、sales force → Salesforce）；
  拼字相近（同字首、相似度 ≥ 0.8）列為候選。
每次修改都記錄原文（fixes），畫面上看得到改了什麼。

Whisper 的提示最多 224 個 token，超過時只保留最後一段（約 80–150 個中文字）；術語表很長時，
prompt() 優先放最近兩分鐘提到的術語，其餘依術語表順序補到上限。
"""
import difflib
import re
from dataclasses import dataclass, field
from functools import lru_cache

from pypinyin import Style, pinyin

_CJK = re.compile(r"[㐀-䶿一-鿿]")
_WORD = re.compile(r"[A-Za-z][A-Za-z0-9.+\-]*")
PROMPT_BUDGET = 200   # 粗估的 token 數：中文字算 2、英文字母算 0.4、分隔符號算 1
FUNC = set("的了是在有和跟就也都嗎呢吧啊喔呀嘛著過個們這那要會還把被讓給我你他她它")
SURNAMES = set("陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周徐蘇葉莊呂江何蕭羅高潘簡朱鍾彭游詹胡施沈余趙盧梁顏柯孫魏翁戴范宋方鄧杜傅侯曹薛丁卓阮馬董温唐藍蔣石古紀姚連馮歐程湯黃田康姜白汪鄒尤巫鐘黎涂龔嚴韓袁金童陸夏柳凃邵")


@lru_cache(maxsize=20000)
def readings(ch: str) -> frozenset[str]:
    """一個中文字所有可能的無聲調讀音。"""
    return frozenset(pinyin(ch, style=Style.NORMAL, heteronym=True)[0])


def fuzzy(syl: str) -> str:
    """台灣口音常見的合流：捲舌與不捲舌、n/l、後鼻音與前鼻音。"""
    for a, b in (("zh", "z"), ("ch", "c"), ("sh", "s")):
        if syl.startswith(a):
            syl = b + syl[len(a):]
            break
    if syl.startswith("n"):
        syl = "l" + syl[1:]
    for a, b in (("eng", "en"), ("ing", "in")):
        if syl.endswith(a):
            syl = syl[: -len(a)] + b
    return syl


@lru_cache(maxsize=20000)
def _fuzzy_readings(ch: str) -> frozenset[str]:
    return frozenset(fuzzy(r) for r in readings(ch))


def _near(a: str, b: str) -> bool:
    """兩個字的讀音只差一個字母（模糊音之後比較）。"""
    for x in _fuzzy_readings(a):
        for y in _fuzzy_readings(b):
            if x == y or (abs(len(x) - len(y)) <= 1 and _lev1(x, y)):
                return True
    return False


def _lev1(x: str, y: str) -> bool:
    """編輯距離 ≤ 1。"""
    if len(x) > len(y):
        x, y = y, x
    i = 0
    while i < len(x) and x[i] == y[i]:
        i += 1
    return x[i:] == y[i + 1:] or x[i + 1:] == y[i + 1:]


def _weight(term: str) -> float:
    return sum(2 if _CJK.match(c) else 0.4 for c in term) + 1


def _key(s: str) -> str:
    return re.sub(r"\s+", "", s).lower()


@dataclass
class Fix:
    text: str                                          # 已套用直接修改的文字
    fixes: list[dict] = field(default_factory=list)    # 已套用的：{"from", "to", "auto": True}
    candidates: list[dict] = field(default_factory=list)   # 待 LLM 判斷的：{"from", "to", "start", "end"}（位置對應 text）


class GlossaryFixer:
    def __init__(self, terms: list[str] | None = None):
        self.terms = [t.strip() for t in (terms or []) if t.strip()]
        cjk = {t for t in self.terms if 2 <= len(t) <= 8 and all(_CJK.match(c) for c in t)}
        # 比對用的形式 → 要改成的寫法；人名另外加上名字（林宗翰 → 宗翰）
        self.cjk: dict[str, str] = {t: t for t in cjk}
        for t in cjk:
            if len(t) == 3 and t[0] in SURNAMES and t[1:] not in self.cjk:
                self.cjk[t[1:]] = t[1:]
        self.cjk_order = sorted(self.cjk, key=len, reverse=True)   # 長的先比對
        self.en = {_key(t): t for t in self.terms if re.fullmatch(r"[A-Za-z][A-Za-z0-9.+\- ]*", t)}
        self.en_max = max((len(t.split()) for t in self.en.values()), default=1)

    # ---- 校正 ----

    def fix(self, text: str) -> Fix:
        out = Fix(text)
        if not self.terms:
            return out
        # 第一輪：直接修改；第二輪在修改後的文字上找候選（已改成術語的地方不會再被列出）
        auto, _ = self._matches(text)
        out.text = self._apply(text, auto)
        out.fixes = [{"from": m["from"], "to": m["to"], "auto": True} for m in auto]
        _, out.candidates = self._matches(out.text)
        return out

    def apply(self, text: str, candidates: list[dict], accepted: list[int]) -> tuple[str, list[dict]]:
        """套用 LLM 接受的候選。"""
        chosen = [c for i, c in enumerate(candidates) if i in set(accepted)]
        return self._apply(text, chosen), [{"from": c["from"], "to": c["to"], "auto": False} for c in chosen]

    def _matches(self, text: str) -> tuple[list[dict], list[dict]]:
        auto, cands, taken = [], [], set()

        def add(start, end, term, sure):
            if taken & set(range(start, end)):
                return
            taken.update(range(start, end))
            (auto if sure else cands).append({"from": text[start:end], "to": term, "start": start, "end": end})

        for form in self.cjk_order:
            term, n = self.cjk[form], len(form)
            for i in range(len(text) - n + 1):
                window = text[i:i + n]
                if window == form:
                    taken.update(range(i, i + n))   # 已經寫對的術語不要被較短的術語改掉
                    continue
                if not all(_CJK.match(c) for c in window) or any(c in FUNC and c not in form for c in window):
                    continue
                pairs = list(zip(window, form))
                exact = sum(bool(readings(a) & readings(b)) for a, b in pairs)
                if exact == n:
                    add(i, i + n, term, sure=n >= 3)
                    continue
                same = sum(bool(_fuzzy_readings(a) & _fuzzy_readings(b)) for a, b in pairs)
                if same == n or (n >= 3 and same * 2 >= n and all(_near(a, b) for a, b in pairs)):
                    add(i, i + n, term, sure=False)
        self._match_en(text, add, taken)
        return sorted(auto, key=lambda m: m["start"]), sorted(cands, key=lambda m: m["start"])

    def _match_en(self, text, add, taken):
        words = list(_WORD.finditer(text))
        for size in range(self.en_max, 0, -1):   # 多個字的術語先比對（sales force → Salesforce）
            for j in range(len(words) - size + 1):
                span = words[j:j + size]
                if size > 1 and any(text[a.end():b.start()].strip() for a, b in zip(span, span[1:])):
                    continue   # 中間夾著其他字，不是連在一起的詞
                start, end = span[0].start(), span[-1].end()
                key = _key(text[start:end])
                term = self.en.get(key)
                if term and text[start:end] == term:
                    taken.update(range(start, end))   # 已經寫對
                elif term:
                    add(start, end, term, sure=True)
                elif size == 1 and len(key) >= 4:
                    for low, term in self.en.items():
                        if key[0] == low[0] and difflib.SequenceMatcher(None, key, low).ratio() >= 0.8:
                            add(start, end, term, sure=False)
                            break

    @staticmethod
    def _apply(text: str, matches: list[dict]) -> str:
        for m in sorted(matches, key=lambda m: -m["start"]):
            text = text[:m["start"]] + m["to"] + text[m["end"]:]
        return text

    # ---- 送給 Whisper 的術語提示 ----

    def prompt(self, recent: str = "") -> str | None:
        """最近提到的術語優先，其餘依術語表順序，總長度不超過 Whisper 的提示上限。"""
        if not self.terms:
            return None
        recent_low = recent.lower()
        ordered = [t for t in self.terms if t.lower() in recent_low] + [t for t in self.terms if t.lower() not in recent_low]
        picked, used = [], 0.0
        for t in ordered:
            if used + _weight(t) > PROMPT_BUDGET:
                continue
            picked.append(t)
            used += _weight(t)
        return "、".join(picked)
