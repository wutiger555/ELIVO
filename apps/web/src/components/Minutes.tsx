// 會議記錄：摘要＋決策／待辦／問題／數字。被取代的劃線變淡並註明改為哪一項；
// 更新的項目發光並顯示最近一次變更；點時間碼跳回逐字稿；點項目展開修改紀錄。
import { useState } from "react";
import { Button } from "@design/components/core/Button.jsx";
import { Icon } from "@design/components/core/Icon.jsx";
import { Input } from "@design/components/forms/Input.jsx";
import { Select } from "@design/components/forms/Select.jsx";
import { SegmentedControl } from "@design/components/forms/SegmentedControl.jsx";
import type { Item, Kind, Minutes as M } from "../lib/api";
import { timecode } from "../lib/format";

const GROUPS: { kind: Kind; label: string; icon: string; tone: string }[] = [
  { kind: "decision", label: "DECISIONS", icon: "milestone", tone: "decision" },
  { kind: "action", label: "ACTION ITEMS", icon: "square-check", tone: "action" },
  { kind: "question", label: "QUESTIONS", icon: "circle-help", tone: "question" },
  { kind: "number", label: "NUMBERS", icon: "hash", tone: "number" },
];
export const ACTIVE: Record<Kind, string> = { decision: "confirmed", action: "open", question: "open", number: "current" };
export const STATUS: Record<string, [string, string]> = {
  superseded: ["已被取代", "warn"], reversed: ["已撤銷", "warn"], answered: ["已回答", "info"], deferred: ["延後", ""],
  done: ["完成", "accent"], cancelled: ["取消", ""],
};
export const STRUCK = ["superseded", "reversed", "cancelled"];
const BY = { fast: "即時", reflect: "整理", user: "手動" };
export const KIND_ZH: Record<Kind, string> = { decision: "決策", action: "待辦", question: "問題", number: "數字" };
export const STATUS_OPTIONS: Record<Kind, [string, string][]> = {
  decision: [["confirmed", "確認"], ["superseded", "已被取代"], ["reversed", "已撤銷"]],
  action: [["open", "進行中"], ["done", "完成"], ["cancelled", "取消"]],
  question: [["open", "未答"], ["answered", "已回答"], ["deferred", "延後"]],
  number: [["current", "現值"], ["superseded", "已被取代"]],
};

export interface MinutesEditing {
  onAdd: (it: Partial<Item>) => Promise<void>;
  onEdit: (id: string, changes: Partial<Item>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/** 新增或修改項目的表單：依類型顯示負責人、期限、數值、答案、狀態。 */
function ItemForm({ kind, initial, onSave, onCancel, withStatus }: {
  kind: Kind; initial: Partial<Item>; withStatus: boolean;
  onSave: (f: Partial<Item>) => Promise<void>; onCancel: () => void;
}) {
  const [f, setF] = useState<Partial<Item>>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof Item) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try { await onSave(f); } catch (e: any) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="item-form" onClick={(e) => e.stopPropagation()}>
      <Input size="sm" label="內容" value={f.text ?? ""} onChange={set("text")} />
      {kind === "action" && (
        <div className="two">
          <Input size="sm" label="負責人" value={f.owner ?? ""} onChange={set("owner")} />
          <Input size="sm" label="期限" value={f.due ?? ""} onChange={set("due")} />
        </div>
      )}
      {kind === "number" && <Input size="sm" label="數值" placeholder="例如 180 萬" value={f.value ?? ""} onChange={set("value")} />}
      {kind === "question" && withStatus && <Input size="sm" label="答案" value={f.answer ?? ""} onChange={set("answer")} />}
      {withStatus && (
        <Select size="sm" label="狀態" value={f.status} onChange={set("status")}
          options={STATUS_OPTIONS[kind].map(([value, label]) => ({ value, label }))} />
      )}
      {error && <div className="error-text">{error}</div>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button size="sm" variant="ghost" onClick={onCancel}>取消</Button>
        <Button size="sm" variant="primary" disabled={busy || !(f.text ?? "").trim()} onClick={save}>儲存</Button>
      </div>
    </div>
  );
}

function AddItem({ editing }: { editing: MinutesEditing }) {
  const [kind, setKind] = useState<Kind | null>(null);
  if (!kind) {
    return <Button size="sm" variant="ghost" icon="plus" onClick={() => setKind("action")}>新增項目</Button>;
  }
  return (
    <div className="item">
      <div style={{ marginBottom: 10 }}>
        <SegmentedControl size="sm" value={kind} onChange={(v: string) => setKind(v as Kind)}
          options={(Object.keys(KIND_ZH) as Kind[]).map((k) => ({ value: k, label: KIND_ZH[k] }))} />
      </div>
      <ItemForm key={kind} kind={kind} initial={{}} withStatus={false}
        onSave={async (f) => { await editing.onAdd({ ...f, kind }); setKind(null); }} onCancel={() => setKind(null)} />
    </div>
  );
}

function ItemCard({ it, uttT, onJump, editing }: { it: Item; uttT: Record<string, number>; onJump: (id: string) => void; editing?: MinutesEditing }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  if (mode === "edit" && editing) {
    return (
      <div className="item">
        <div className="item-head"><span className="item-id">{it.id}</span><span className="badge">{KIND_ZH[it.kind]}</span></div>
        <ItemForm kind={it.kind} withStatus initial={{ text: it.text, owner: it.owner, due: it.due, value: it.value, answer: it.answer, status: it.status }}
          onCancel={() => setMode("view")}
          onSave={async (f) => {
            // 只送改過的欄位：沒動的欄位不會被標成「手動修改」而鎖住
            const changed = Object.fromEntries(Object.entries(f).filter(([k, v]) => (v ?? "") !== ((it as any)[k] ?? "")));
            if (Object.keys(changed).length) await editing.onEdit(it.id, changed);
            setMode("view");
          }} />
      </div>
    );
  }
  const last = it.history[it.history.length - 1];
  const meta = [["負責", it.owner], ["期限", it.due], ["答案", it.answer], ["改為", it.superseded_by]].filter(([, v]) => v);
  const cls = ["item", it.status !== ACTIVE[it.kind] && "inactive", STRUCK.includes(it.status) && "struck"].filter(Boolean).join(" ");
  return (
    <div className={cls} onClick={() => setOpen(!open)}>
      {/* key 隨修改次數改變：每次更新重新掛載，光暈動畫重播，但卡片本身不重建 */}
      {it.history.length > 1 && <span className="glow" key={it.history.length} />}
      <div className="item-head">
        <span className="item-id">{it.id}</span>
        {STATUS[it.status] && <span className={`badge ${STATUS[it.status][1]}`}>{STATUS[it.status][0]}</span>}
        {!STATUS[it.status] && it.history.length > 1 && <span className="badge accent">已更新</span>}
      </div>
      <div className="item-text">{it.kind === "number" && it.value ? `${it.value}　${it.text}` : it.text}</div>
      {meta.length > 0 && (
        <div className="item-meta">
          {meta.map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}
        </div>
      )}
      {last && it.history.length > 1 && <div className="item-change">↻ {timecode(last.t)}　{last.change}</div>}
      {it.utt_ids.some((u) => uttT[u] != null) && (
        <div className="evidence">
          {it.utt_ids.filter((u) => uttT[u] != null).slice(0, 4).map((u) => (
            <button key={u} type="button" className="tc-chip" title={`跳到 ${u}`} onClick={(e) => { e.stopPropagation(); onJump(u); }}>
              {timecode(uttT[u])}
            </button>
          ))}
        </div>
      )}
      {open && (
        <ul className="history">
          {it.history.map((r, i) => (
            <li key={i}><span className="when">{timecode(r.t)}</span><span><span className="by">{BY[r.by]}</span> {r.change}</span></li>
          ))}
        </ul>
      )}
      {open && editing && (
        <div className="item-actions" onClick={(e) => e.stopPropagation()}>
          {mode === "delete" ? (
            <>
              <span className="hint" style={{ margin: 0, flex: 1 }}>刪除後保留在修改紀錄，AI 之後也不會再把它加回來。</span>
              <Button size="sm" variant="ghost" onClick={() => setMode("view")}>取消</Button>
              <Button size="sm" variant="danger" onClick={() => editing.onDelete(it.id)}>刪除</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" icon="pencil" onClick={() => setMode("edit")}>編輯</Button>
              <Button size="sm" variant="ghost" icon="trash-2" onClick={() => setMode("delete")}>刪除</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Minutes({ minutes, onJump, emptyText, editing }: {
  minutes: M | null; onJump: (uttId: string) => void; emptyText: string; editing?: MinutesEditing;
}) {
  const items = (minutes?.items ?? []).filter((it) => it.status !== "retracted");
  if (!minutes || (!items.length && !minutes.summary.length)) {
    return <div className="minutes"><div className="placeholder">{emptyText}</div>{editing && minutes && <AddItem editing={editing} />}</div>;
  }
  return (
    <div className="minutes">
      {editing && <div><AddItem editing={editing} /></div>}
      {minutes.summary.length > 0 && (
        <section>
          <div className="group-title tone-summary"><Icon name="file-text" size={13} />SUMMARY</div>
          <div className="summary" key={JSON.stringify(minutes.summary)}>
            {minutes.summary.map((t) => (
              <div className="topic" key={t.topic}>
                <div className="topic-title">{t.topic}</div>
                <ul>{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {GROUPS.map((g) => {
        const list = items
          .filter((it) => it.kind === g.kind)
          .sort((a, b) => Number(b.status === ACTIVE[g.kind]) - Number(a.status === ACTIVE[g.kind]) || a.id.localeCompare(b.id, "en", { numeric: true }));
        if (!list.length) return null;
        return (
          <section key={g.kind}>
            <div className={`group-title tone-${g.tone}`}>
              <Icon name={g.icon} size={13} />{g.label}
              <span className="n">{list.filter((it) => it.status === ACTIVE[g.kind]).length}</span>
            </div>
            <div className="items">
              {list.map((it) => <ItemCard key={it.id} it={it} uttT={minutes.utt_t} onJump={onJump} editing={editing} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
