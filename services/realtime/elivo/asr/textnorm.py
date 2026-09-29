"""文字正規化、MER 計算、串流用的顯示單位切分。

MER（mixed error rate）：中文按字、英文按詞計，先做 NFKC、小寫、去標點。
數字寫法不同（「八百二十萬」vs「820 萬」）會算錯，gold 逐字稿請統一用阿拉伯數字。
"""
import re
import unicodedata

from opencc import OpenCC

_s2twp = OpenCC("s2twp")

_CJK = r"㐀-䶿一-鿿豈-﫿"
_MER_TOKEN = re.compile(rf"[{_CJK}]|[a-z0-9]+(?:['.\-][a-z0-9]+)*")
# 顯示單位：英數詞（含尾端空白）、單一中文字或標點、連續空白
_UNIT = re.compile(r"[A-Za-z0-9][A-Za-z0-9'.\-]*\s*|\s+|.", re.S)


def to_tw(text: str) -> str:
    """簡體 → 台灣正體與台灣用語。對已是正體的輸出也安全。"""
    return _s2twp.convert(text)


def mer_tokens(text: str) -> list[str]:
    text = unicodedata.normalize("NFKC", text).lower()
    return _MER_TOKEN.findall(text)


def _edit_ops(ref: list[str], hyp: list[str]) -> tuple[int, int, int]:
    """回傳 (substitutions, deletions, insertions)。"""
    prev = [(j, 0, 0, j) for j in range(len(hyp) + 1)]  # (cost, S, D, I)
    for i in range(1, len(ref) + 1):
        cur = [(i, 0, i, 0)]
        for j in range(1, len(hyp) + 1):
            if ref[i - 1] == hyp[j - 1]:
                cur.append(prev[j - 1])
                continue
            s, d, n = prev[j - 1], prev[j], cur[j - 1]
            best = min(
                (s[0] + 1, s[1] + 1, s[2], s[3]),
                (d[0] + 1, d[1], d[2] + 1, d[3]),
                (n[0] + 1, n[1], n[2], n[3] + 1),
            )
            cur.append(best)
        prev = cur
    _, sub, dele, ins = prev[-1]
    return sub, dele, ins


def mer(ref: str, hyp: str) -> dict:
    r, h = mer_tokens(ref), mer_tokens(to_tw(hyp))
    sub, dele, ins = _edit_ops(r, h)
    n = max(len(r), 1)
    return {"mer": (sub + dele + ins) / n, "sub": sub, "del": dele, "ins": ins, "ref_tokens": len(r)}


def term_recall(ref: str, hyp: str, terms: list[str]) -> dict:
    """術語召回率：ref 出現幾次、hyp 正確出現幾次（取 min）。"""
    norm = lambda s: " ".join(mer_tokens(s))
    r, h = norm(ref), norm(to_tw(hyp))
    hit = total = 0
    missed = []
    for term in terms:
        t = norm(term)
        if not t:
            continue
        rc, hc = r.count(t), h.count(t)
        total += rc
        hit += min(rc, hc)
        if hc < rc:
            missed.append(term)
    return {"recall": hit / total if total else None, "hit": hit, "total": total, "missed": missed}


def display_units(text: str) -> list[str]:
    return _UNIT.findall(text)


def unit_key(unit: str) -> str:
    """比對 LocalAgreement 用：忽略大小寫、空白與標點差異。"""
    toks = mer_tokens(unit)
    return toks[0] if toks else ""
