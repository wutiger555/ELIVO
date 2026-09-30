// 主動提示：本場前面提過、先前會議（帳本）、數字不同、決策不同、還沒回答的問題、沒有負責人的待辦。
// 醒目（promoted）的只有「數字不同」「決策不同」，而且有配額；其他安靜列出。永遠不發聲。
import { Icon } from "@design/components/core/Icon.jsx";
import type { Hint } from "../lib/api";
import { timecode } from "../lib/format";

const KIND = { decision: "決策", action: "待辦", question: "問題", number: "數字" } as const;
const STATUS: Record<string, string> = { superseded: "已被取代", reversed: "已撤銷", answered: "已回答", done: "完成", cancelled: "取消", deferred: "延後" };
const day = (epoch?: number) => { if (!epoch) return ""; const d = new Date(epoch * 1000); return `${d.getMonth() + 1}/${d.getDate()}`; };
/** 「9/23 週會」；會議名稱已經有日期時不重複。 */
const when = (mt?: { title: string; started_at: number }) => !mt ? "" : mt.title.includes(day(mt.started_at)) ? mt.title : `${day(mt.started_at)} ${mt.title}`;

/** 卡片的標題列、內文、補充。文案規則：標題 ≤ 12 字、陳述事實、附日期與來源（04-mvp-spec §6）。 */
function content(h: Hint): { head: string; tone?: string; text: string; sub?: string } {
  const m = h.meta;
  const value = (v?: string | null, t?: string) => (v ? `${v}　${t ?? ""}` : t ?? "");
  switch (h.type) {
    case "previous":
      return { head: when(m.meeting), text: m.kind === "number" ? value(m.value, m.text) : m.text ?? "",
        sub: m.answer ? `答案：${m.answer}` : m.owner ? `負責 ${m.owner}` : undefined };
    case "number_drift":
      return { head: `與 ${day(m.old?.meeting.started_at)} 不同`, tone: "warn", text: `${m.old?.value} → ${m.value}（${m.change}）　${m.text}`,
        sub: `${m.old?.meeting.title}：${m.old?.text}` };
    case "conflict":
      return { head: `與 ${day(m.old?.meeting.started_at)} 決策不同`, tone: "warn", text: m.note || m.text || "",
        sub: `上次：${m.old?.text}（${m.old?.meeting.title}）` };
    case "open_question":
      return { head: "還沒回答", tone: "info", text: m.text ?? "" };
    case "unowned_action":
      return { head: "還沒有負責人", tone: "info", text: m.text ?? "" };
    default:
      return { head: timecode(h.target_t), text: m.kind === "number" ? value(m.value, m.text) : m.text ?? "",
        sub: m.answer ? `答案：${m.answer}` : undefined };
  }
}

export function Hints({ hints, onJump }: { hints: Hint[]; onJump: (uttId: string) => void }) {
  if (!hints.length) return null;
  const recent = [...hints].reverse().slice(0, 4);
  return (
    <section className="hints">
      <div className="group-title tone-summary"><Icon name="lightbulb" size={13} />提示<span className="n">{hints.length}</span></div>
      <div className="items">
        {recent.map((h, i) => {
          const c = content(h);
          const m = h.meta;
          // 先前會議的卡片：在新分頁打開那場會議（不離開進行中的會議）；其他跳到本場的那一句
          const open = h.type === "previous" && m.meeting
            ? () => window.open(`#/m/${m.meeting!.id}${m.jump ? `?at=${encodeURIComponent(m.jump)}` : ""}`, "_blank")
            : h.jump ? () => onJump(h.jump!) : undefined;
          return (
            <button key={h.id} type="button" className={`hint-card${i === 0 ? " latest" : ""}${h.level === "promoted" ? " promoted" : ""}`}
              disabled={!open} onClick={open} title={h.matched.length ? `相符：${h.matched.join("、")}` : undefined}>
              {i === 0 && <span className="glow" key={h.id} />}
              <span className="hint-head">
                <span className={`tc${c.tone ? ` tone-${c.tone}` : ""}`}>{c.head}</span>
                {h.type === "previous" && <span className="badge">上次</span>}
                {m.kind && (h.type === "recall" || h.type === "previous") && <span className="badge">{KIND[m.kind]}</span>}
                {h.type === "recall" && !m.kind && m.speaker && <span className="badge">{m.speaker}</span>}
                {m.status && STATUS[m.status] && (
                  <span className="badge warn">{STATUS[m.status]}{m.superseded_by ? ` → ${m.superseded_by}` : ""}</span>
                )}
                {h.type === "previous" && m.meeting && <Icon name="arrow-up-right" size={12} />}
              </span>
              <span className="hint-text">{c.text}</span>
              {c.sub && <span className="hint-sub">{c.sub}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
