"""階段二：會中持續修正的會議記錄（Live Minutes）。

會議記錄是一份「有版本的狀態」，不是一段一直重寫的文字：
- 每個項目（決策、待辦、問題、數字）有固定 id 與狀態，被推翻、取代、回答時狀態改變，但不會消失。
- 每次變更都寫進該項目的 history：會議內時間、依據句子、由誰改（fast／reflect）、變更說明。

兩種節奏：
- fast（例如 Claude Haiku 4.5，每 12 秒、有新句子才跑）：只看新的逐字稿，輸出「操作」
  （add／update／supersede／resolve／retract），由程式套用，所以每次變更都可追溯。
- reflect（例如 Claude Sonnet 4.6，每 150 秒）：重讀全文與目前記錄，輸出修正後的完整記錄與分主題摘要；
  程式比對差異寫進 history。整理期間 fast 照跑；整理期間被 fast 改過或新增的項目，不會被整理結果覆蓋。

會議結束時再跑一次 fast 與 reflect，輸出 Markdown 會議記錄（未經確認的草稿）。
依 ADR-0003：prompt 明確禁止判斷情緒、態度或參與度。
"""
import asyncio
import json
import time
from typing import Literal

from pydantic import BaseModel

from llm import PROVIDERS, Disable, QuotaExceeded, Retry, Skip

Kind = Literal["decision", "action", "question", "number"]
PREFIX = {"decision": "D", "action": "A", "question": "Q", "number": "N"}
STATUSES = {
    "decision": ("confirmed", "superseded", "reversed", "retracted"),
    "action": ("open", "done", "cancelled", "retracted"),
    "question": ("open", "answered", "deferred", "retracted"),
    "number": ("current", "superseded", "retracted"),
}
STATUS_ZH = {"confirmed": "確認", "superseded": "已被取代", "reversed": "已撤銷", "retracted": "已撤回", "open": "進行中",
             "done": "完成", "cancelled": "取消", "answered": "已回答", "deferred": "延後", "current": "現值"}
FIELDS_ZH = {"text": "內容", "owner": "負責人", "due": "期限", "value": "數值", "answer": "答案", "status": "狀態",
             "superseded_by": "被取代為"}
MAX_REFLECT_LINES = 400


class Revision(BaseModel):
    t: float                          # 會議內秒數
    by: Literal["fast", "reflect"]
    change: str
    utt_ids: list[str] = []


class Item(BaseModel):
    id: str
    kind: Kind
    text: str
    status: str
    owner: str | None = None
    due: str | None = None
    value: str | None = None
    answer: str | None = None
    superseded_by: str | None = None
    utt_ids: list[str] = []
    history: list[Revision] = []


class Topic(BaseModel):
    topic: str
    points: list[str]


# ---- fast：輸出操作 ----

class Op(BaseModel):
    op: Literal["add", "update", "supersede", "resolve", "retract"]
    id: str | None = None             # update／supersede／resolve／retract：既有項目的 id
    kind: Kind | None = None          # add／supersede：新項目的類型
    text: str | None = None
    owner: str | None = None
    due: str | None = None
    value: str | None = None
    answer: str | None = None
    status: str | None = None
    reason: str
    utt_ids: list[str] = []


class OpBatch(BaseModel):
    ops: list[Op]


# ---- reflect：輸出修正後的完整記錄 ----

class ReflectItem(BaseModel):
    id: str                           # 既有項目沿用原 id；新項目用 new-1、new-2…
    kind: Kind
    text: str
    status: str
    owner: str | None = None
    due: str | None = None
    value: str | None = None
    answer: str | None = None
    superseded_by: str | None = None
    utt_ids: list[str] = []


class Correction(BaseModel):
    id: str
    change: str


class Reflection(BaseModel):
    items: list[ReflectItem]
    summary: list[Topic]
    corrections: list[Correction]


COMMON_RULES = """規則：
- 只根據逐字稿，不要推測，也不要補充外部知識；語音辨識的錯字若無法確定原意，照原文保留。
- 不判斷任何人的情緒、態度、語氣或參與度。
- 使用台灣正體中文，英文術語保留原文。
- owner 只填逐字稿明確說出的（例如「我來」就填該行的說話者），否則填 null；due 同理。
- 有人承諾或被指派要做某件事（例如「我來寫」「我會跟財務說明」「你專心處理 SAP 整合」），一定要記成 action，並填 owner。
  如果這件事同時回答了一個問題（例如「誰負責？」「我來」），問題標為已回答，另外再記一個 action。
- 負責人改變時更新 action 的 owner，不要另外新增一個 action。
- 如果有提供術語表：只有當逐字稿的字詞與某個術語「發音明顯相近」時（例如 Hotspot → HubSpot），才改用術語表的寫法。
  一般詞彙不要改寫成術語（例如「匯入」「導入」不是 data migration），也不要把一個術語換成另一個術語（SAP 不是 Salesforce）。"""

KINDS = """項目類型：
- decision：已經拍板的決定。提議、討論中、還在考慮的不算。
- action：有人承諾或被指派要做的事。
- question：被提出、但還沒有人回答的問題。
- number：具體的數字（金額、日期、百分比、數量）。value 放數值與單位，text 說明它代表什麼。"""

FAST_SYSTEM = f"""你是會議助理 ELIVO 的即時記錄員。你會收到：目前的會議記錄（每個項目有 id、類型、狀態）、先前幾句逐字稿（已處理過，只供理解上下文）、以及新的逐字稿。逐字稿每行格式為「[句子 id 時間] 說話者：內容」，說話者只有「我」與「他人」兩種；逐字稿由語音辨識產生，可能有錯字、沒有標點、中英混雜。

你的工作：根據「新的逐字稿」，輸出要對會議記錄做的操作 ops。沒有需要更新的就輸出空陣列。

{KINDS}

操作：
- add：新增項目，填 kind、text（數字另填 value；待辦可填 owner、due）。
- update：修改既有項目的欄位，例如 owner、due、text；或把 status 改為 done／cancelled（待辦）、deferred（問題延後處理）、reversed（決策被撤銷且沒有替代方案）。
- supersede：既有的決策或數字被新的取代時使用（例如改用別的方案、預算調整）。id 填被取代的舊項目，text／value 填新的內容。不要用 add 另外新增，也不要直接改舊項目的文字。
- resolve：既有的問題被回答了。id 填該問題，answer 填答案。
- retract：先前的項目其實記錯了（例如把提議當成決策）。

每個操作都要有 reason（一句話說明依據）與 utt_ids（依據的句子 id）。id 只能用目前記錄裡已經存在的 id；同一件事不要重複新增，新增前先檢查目前記錄。

{COMMON_RULES}"""

REFLECT_SYSTEM = f"""你是會議助理 ELIVO 的記錄審稿人。即時記錄員是邊聽邊記的，可能記錯、漏記、重複，或沒注意到後來的內容推翻了先前的結論。你會收到目前的會議記錄（含 id、狀態、依據句子）與到目前為止的完整逐字稿。逐字稿每行格式為「[句子 id 時間] 說話者：內容」，由語音辨識產生，可能有錯字。

請重讀全文，輸出修正後的完整會議記錄：

items：所有項目，包含已被取代、已回答、已撤回的（歷史要保留，不要刪除）。既有項目沿用原 id；新增的項目 id 用 new-1、new-2…
- 決策被後來的決策取代：舊項目 status=superseded，superseded_by 指向新項目的 id。
- 數字被更新：舊數字 status=superseded，superseded_by 指向新數字的 id。
- 問題被回答：status=answered，answer 填答案。
- 記錯或重複的項目：status=retracted。
- 狀態只能用：decision 用 confirmed／superseded／reversed／retracted；action 用 open／done／cancelled／retracted；question 用 open／answered／deferred／retracted；number 用 current／superseded／retracted。

summary：依主題整理的會議摘要，每個主題 1–4 點，反映「目前」的結論；被推翻的結論要寫成「原本…，後來因為…改為…」。

corrections：這次你修改了哪些項目、為什麼（每筆一句話，id 填項目 id）；沒有修改就給空陣列。

只修正真正的錯誤（記錯、漏記、重複、狀態或負責人不對）。沒有錯的項目，text 與其他欄位原樣保留，不要為了措辭改寫。

{KINDS}

{COMMON_RULES}"""


def timecode(s: float | None) -> str:
    s = int(s or 0)
    return f"{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d}"


class MinutesEngine:
    def __init__(self, emit, on_record, clock, provider: str = "ica", fast_model: str = "claude-haiku-4-5",
                 reflect_model: str = "claude-sonnet-4-6", fast_interval: float = 12.0, reflect_interval: float = 150.0,
                 glossary: list[str] | None = None):
        self.llm = PROVIDERS[provider]()
        self.provider = provider
        self.emit, self.on_record, self.clock = emit, on_record, clock
        self.fast_model, self.reflect_model = fast_model, reflect_model
        self.fast_interval, self.reflect_interval = fast_interval, reflect_interval
        self.items: dict[str, Item] = {}
        self.summary: list[Topic] = []
        self.reflected_at: float | None = None
        self.version = 0
        self.lines: list[dict] = []       # {"id", "speaker", "text", "t"}
        self.utt_t: dict[str, float] = {}
        self.fast_cursor = 0              # lines[:fast_cursor] 已經過 fast
        self.reflect_cursor = 0
        self.counters = {k: 0 for k in PREFIX}
        self.seq = 0                      # 每次套用變更加一
        self.touched: dict[str, int] = {} # 項目 id → 最後一次被改的 seq
        self.lock = asyncio.Lock()        # fast 本身不重疊
        self.enabled = True
        self.glossary = "術語表（正確寫法）：" + "、".join(glossary) + "\n\n" if glossary else ""

    # ---- 輸入 ----

    def add_final(self, ev: dict):
        self.lines.append({"id": ev["id"], "speaker": ev["speaker"], "text": ev["committed"], "t": ev.get("t", 0.0)})
        self.utt_t[ev["id"]] = ev.get("t", 0.0)

    async def run(self):
        await asyncio.gather(self._loop(self.fast, self.fast_interval), self._loop(self.reflect, self.reflect_interval))

    async def _loop(self, fn, interval):
        while self.enabled:
            await asyncio.sleep(interval)
            await fn()

    async def finish(self):
        """會議結束：把剩下的句子跑完 fast，再整體整理一次。"""
        await self.fast()
        await self.reflect(force=True)

    # ---- fast ----

    async def fast(self):
        async with self.lock:
            await self._fast_locked()

    async def _fast_locked(self):
        if not self.enabled or self.fast_cursor >= len(self.lines):
            return
        end = len(self.lines)
        ctx = self.lines[max(0, self.fast_cursor - 8):self.fast_cursor]
        prompt = (
            f"{self.glossary}目前的會議記錄：\n{self._state_for_prompt()}\n\n"
            f"先前的逐字稿（已處理，只供理解上下文）：\n{self._fmt(ctx) or '（無）'}\n\n"
            f"新的逐字稿：\n{self._fmt(self.lines[self.fast_cursor:end])}"
        )
        res = await self._call("fast", self.fast_model, FAST_SYSTEM, prompt, OpBatch, 4096, n_lines=end)
        if res is None:
            return
        if res is not Retry:
            self.fast_cursor = end
        if isinstance(res, OpBatch):
            changed = sum(self._apply(op) for op in res.ops)
            if changed:
                self._publish()

    def _apply(self, op: Op) -> bool:
        now = self.clock()
        ids = [u for u in op.utt_ids if u in self.utt_t]
        target = self.items.get(op.id) if op.id else None
        if op.op == "add":
            if not op.kind or not op.text:
                return False
            item = self._new_item(op.kind, op.text, op.owner, op.due, op.value, ids)
            item.history.append(Revision(t=now, by="fast", change=f"新增：{op.reason}", utt_ids=ids))
            return True
        if target is None:
            return False
        if op.op == "update":
            changes = {k: getattr(op, k) for k in ("text", "owner", "due", "value", "answer") if getattr(op, k)}
            if op.status in STATUSES[target.kind]:
                changes["status"] = op.status
            return self._change(target, changes, "fast", op.reason, ids)
        if op.op == "supersede":
            if target.kind not in ("decision", "number"):
                return False
            new = self._new_item(target.kind, op.text or target.text, op.owner, op.due, op.value, ids)
            new.history.append(Revision(t=now, by="fast", change=f"取代 {target.id}：{op.reason}", utt_ids=ids))
            return self._change(target, {"status": "superseded", "superseded_by": new.id}, "fast",
                                f"被 {new.id} 取代：{op.reason}", ids)
        if op.op == "resolve" and target.kind == "question":
            return self._change(target, {"status": "answered", "answer": op.answer}, "fast", op.reason, ids)
        if op.op == "retract":
            return self._change(target, {"status": "retracted"}, "fast", op.reason, ids)
        return False

    # ---- reflect ----

    async def reflect(self, force: bool = False):
        if not self.enabled or (not force and self.reflect_cursor >= len(self.lines)) or not self.lines:
            return
        # 先讓 fast 處理完所有已知句子，再以這個時間點為快照：
        # 整理期間 fast 只會處理快照之後的新句子，兩邊不會各自新增同一件事
        async with self.lock:
            await self._fast_locked()
            end, seq0 = self.fast_cursor, self.seq
            prompt = (
                f"{self.glossary}目前的會議記錄：\n{self._state_for_prompt(with_evidence=True)}\n\n"
                f"到目前為止的完整逐字稿：\n{self._fmt(self.lines[-MAX_REFLECT_LINES:end])}"
            )
        res = await self._call("reflect", self.reflect_model, REFLECT_SYSTEM, prompt, Reflection, 12000, n_lines=end)
        if not isinstance(res, Reflection):
            return
        self._merge(res, seq0)
        self.summary = res.summary
        self.reflected_at = self.clock()
        self.reflect_cursor = end
        self._publish()

    def _merge(self, res: Reflection, seq0: int):
        now = self.clock()
        corrections = {c.id: c.change for c in res.corrections}
        # 整理期間被 fast 改過或新增的項目，fast 的版本比較新，不用整理結果覆蓋
        fresh = {i for i, s in self.touched.items() if s > seq0}
        idmap = {}
        for ri in res.items:
            if ri.id in self.items:
                idmap[ri.id] = ri.id
            else:
                item = self._new_item(ri.kind, ri.text, ri.owner, ri.due, ri.value, [u for u in ri.utt_ids if u in self.utt_t])
                item.status = ri.status if ri.status in STATUSES[ri.kind] else item.status
                item.answer = ri.answer
                item.history.append(Revision(t=now, by="reflect", change=f"整理時新增：{corrections.get(ri.id, '重讀全文時發現')}",
                                             utt_ids=item.utt_ids))
                idmap[ri.id] = item.id
        for ri in res.items:
            if ri.id not in self.items or ri.id in fresh:
                continue
            item = self.items[ri.id]
            changes = {k: getattr(ri, k) for k in ("text", "owner", "due", "value", "answer") if getattr(ri, k) != getattr(item, k)}
            if ri.status in STATUSES[item.kind] and ri.status != item.status:
                changes["status"] = ri.status
            sup = idmap.get(ri.superseded_by) if ri.superseded_by else None
            if sup != item.superseded_by and (sup or item.status == "superseded"):
                changes["superseded_by"] = sup
            if changes:
                self._change(item, changes, "reflect", corrections.get(ri.id, "重讀全文後修正"),
                             [u for u in ri.utt_ids if u in self.utt_t])
        # 整理結果裡沒有、也不是整理期間新增的項目：視為記錯或重複，撤回但保留歷史
        kept = {ri.id for ri in res.items}
        for item in list(self.items.values()):
            if item.id not in kept and item.id not in fresh and item.status != "retracted" and item.id not in idmap.values():
                self._change(item, {"status": "retracted"}, "reflect", corrections.get(item.id, "整理時判斷為重複或記錯"), [])

    # ---- 共用 ----

    async def _call(self, role, model, system, prompt, schema, max_tokens, n_lines):
        t0 = time.monotonic()
        try:
            out, usage = await self.llm.complete_json(model, system, prompt, schema, max_tokens)
        except Disable as e:
            print(f"會議記錄：{e}，停用", flush=True)
            self.enabled = False
            return None
        except Retry as e:
            print(f"會議記錄（{role}）：暫時失敗（{e}），下一輪重試", flush=True)
            return Retry
        except Skip as e:
            print(f"會議記錄（{role}）：{e}", flush=True)
            return Skip
        except QuotaExceeded as e:
            if role == "reflect" and model != self.fast_model:
                print(f"會議記錄：{e}；整理改用 {self.fast_model}", flush=True)
                self.reflect_model = self.fast_model
                return await self._call(role, self.fast_model, system, prompt, schema, max_tokens, n_lines)
            print(f"會議記錄（{role}）：{e}", flush=True)
            return Skip
        self.on_record({"type": "llm", "pass": role, "provider": self.provider, "model": model,
                        "elapsed_s": time.monotonic() - t0, "n_lines": n_lines, **usage})
        return out

    def _new_item(self, kind, text, owner, due, value, utt_ids) -> Item:
        self.counters[kind] += 1
        item = Item(id=f"{PREFIX[kind]}{self.counters[kind]}", kind=kind, text=text, status=STATUSES[kind][0],
                    owner=owner, due=due, value=value, utt_ids=utt_ids)
        self.items[item.id] = item
        self.seq += 1
        self.touched[item.id] = self.seq
        return item

    def _change(self, item: Item, changes: dict, by: str, reason: str, utt_ids: list[str]) -> bool:
        diffs = []
        for k, v in changes.items():
            old = getattr(item, k)
            if v == old:
                continue
            setattr(item, k, v)
            if k == "superseded_by":
                continue  # 「已被取代」的狀態與理由已說明取代關係，不重複列出
            fmt = lambda x: STATUS_ZH.get(x, x) if k == "status" else (x or "（無）")
            diffs.append(f"{FIELDS_ZH[k]}：{fmt(v)}" if old is None else f"{FIELDS_ZH[k]}：{fmt(old)} → {fmt(v)}")
        if not diffs and "superseded_by" not in changes:
            return False
        item.utt_ids = list(dict.fromkeys(item.utt_ids + utt_ids))
        item.history.append(Revision(t=self.clock(), by=by, change=f"{'；'.join(diffs)}（{reason}）", utt_ids=utt_ids))
        self.seq += 1
        self.touched[item.id] = self.seq
        return True

    def _fmt(self, lines: list[dict]) -> str:
        return "\n".join(f"[{l['id']} {timecode(l['t'])}] {l['speaker']}：{l['text']}" for l in lines)

    def _state_for_prompt(self, with_evidence: bool = False) -> str:
        rows = []
        for it in self.items.values():
            if it.status == "retracted" and not with_evidence:
                continue
            d = {"id": it.id, "kind": it.kind, "text": it.text, "status": it.status}
            for k in ("owner", "due", "value", "answer", "superseded_by"):
                if getattr(it, k):
                    d[k] = getattr(it, k)
            if with_evidence:
                d["utt_ids"] = it.utt_ids
            rows.append(d)
        return json.dumps(rows, ensure_ascii=False) if rows else "（目前沒有項目）"

    def export(self) -> dict:
        return {
            "version": self.version,
            "reflected_at": self.reflected_at,
            "summary": [t.model_dump() for t in self.summary],
            "items": [it.model_dump() for it in self.items.values()],
            "utt_t": self.utt_t,
        }

    def _publish(self):
        self.version += 1
        self.emit({"type": "minutes", "minutes": self.export()})

    # ---- 會後輸出 ----

    def to_markdown(self) -> str:
        ref = lambda it: "、".join(f"{timecode(self.utt_t[u])}" for u in it.utt_ids[:3] if u in self.utt_t)
        by_kind = lambda k: [it for it in self.items.values() if it.kind == k and it.status != "retracted"]
        out = ["# 會議記錄（自動整理草稿，未經確認）", ""]
        if self.summary:
            out += ["## 摘要", ""]
            for t in self.summary:
                out.append(f"**{t.topic}**")
                out += [f"- {p}" for p in t.points]
                out.append("")
        sections = [("decision", "決策"), ("action", "待辦"), ("question", "問題"), ("number", "數字")]
        for kind, title in sections:
            items = by_kind(kind)
            if not items:
                continue
            out += [f"## {title}", ""]
            for it in items:
                body = f"{it.value}：{it.text}" if kind == "number" and it.value else it.text
                if it.status in ("superseded", "reversed", "cancelled"):
                    body = f"~~{body}~~"
                extra = [STATUS_ZH.get(it.status, it.status)]
                if it.superseded_by:
                    extra.append(f"由 {it.superseded_by} 取代")
                if it.owner:
                    extra.append(f"負責：{it.owner}")
                if it.due:
                    extra.append(f"期限：{it.due}")
                if it.answer:
                    extra.append(f"答案：{it.answer}")
                out.append(f"- **{it.id}** {body}（{'；'.join(extra)}）" + (f" ｜ {ref(it)}" if ref(it) else ""))
            out.append("")
        revs = sorted(((r.t, it.id, r) for it in self.items.values() for r in it.history), key=lambda x: x[0])
        if revs:
            out += ["## 修改紀錄", ""]
            out += [f"- {timecode(t)} {iid}（{'即時' if r.by == 'fast' else '整理'}）{r.change}" for t, iid, r in revs]
        return "\n".join(out) + "\n"
