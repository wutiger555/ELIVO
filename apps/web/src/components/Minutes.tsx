// 會議記錄：摘要＋決策／待辦／問題／數字。被取代的劃線變淡並註明改為哪一項；
// 更新的項目發光並顯示最近一次變更；點時間碼跳回逐字稿；點項目展開修改紀錄。
import { useState } from "react";
import { Icon } from "@design/components/core/Icon.jsx";
import type { Item, Kind, Minutes as M } from "../lib/api";
import { timecode } from "../lib/format";

const GROUPS: { kind: Kind; label: string; icon: string; tone: string }[] = [
  { kind: "decision", label: "DECISIONS", icon: "milestone", tone: "decision" },
  { kind: "action", label: "ACTION ITEMS", icon: "square-check", tone: "action" },
  { kind: "question", label: "QUESTIONS", icon: "circle-help", tone: "question" },
  { kind: "number", label: "NUMBERS", icon: "hash", tone: "number" },
];
export const ACTIVE: Record<Kind, string> = { decision: "confirmed", action: "open", question: "open", number: "current" };
const STATUS: Record<string, [string, string]> = {
  superseded: ["已被取代", "warn"], reversed: ["已撤銷", "warn"], answered: ["已回答", "info"], deferred: ["延後", ""],
  done: ["完成", "accent"], cancelled: ["取消", ""],
};
const STRUCK = ["superseded", "reversed", "cancelled"];
const BY = { fast: "即時", reflect: "整理", user: "手動" };

function ItemCard({ it, uttT, onJump }: { it: Item; uttT: Record<string, number>; onJump: (id: string) => void }) {
  const [open, setOpen] = useState(false);
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
    </div>
  );
}

export function Minutes({ minutes, onJump, emptyText }: { minutes: M | null; onJump: (uttId: string) => void; emptyText: string }) {
  const items = (minutes?.items ?? []).filter((it) => it.status !== "retracted");
  if (!minutes || (!items.length && !minutes.summary.length)) return <div className="placeholder">{emptyText}</div>;
  return (
    <div className="minutes">
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
              {list.map((it) => <ItemCard key={it.id} it={it} uttT={minutes.utt_t} onJump={onJump} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
