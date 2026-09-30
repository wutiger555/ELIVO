// 「前面提過」：當下這句和先前的決策、數字、問題或發言相關時，安靜地列出來（本機關鍵字檢索，不用 AI）。
import { Icon } from "@design/components/core/Icon.jsx";
import type { Hint } from "../lib/api";
import { timecode } from "../lib/format";

const KIND = { decision: "決策", action: "待辦", question: "問題", number: "數字" } as const;
const STATUS: Record<string, string> = { superseded: "已被取代", reversed: "已撤銷", answered: "已回答", done: "完成", cancelled: "取消", deferred: "延後" };

export function Hints({ hints, onJump }: { hints: Hint[]; onJump: (uttId: string) => void }) {
  if (!hints.length) return null;
  const recent = [...hints].reverse().slice(0, 3);
  return (
    <section className="hints">
      <div className="group-title tone-summary"><Icon name="corner-down-left" size={13} />前面提過<span className="n">{hints.length}</span></div>
      <div className="items">
        {recent.map((h, i) => {
          const m = h.meta;
          const kind = m.kind ? KIND[m.kind] : m.speaker;
          const text = m.kind === "number" && m.value ? `${m.value}　${m.text}` : m.text;
          return (
            <button key={h.id} type="button" className={`hint${i === 0 ? " latest" : ""}`} disabled={!h.jump}
              onClick={() => h.jump && onJump(h.jump)} title={`相符：${h.matched.join("、")}`}>
              {i === 0 && <span className="glow" key={h.id} />}
              <span className="hint-head">
                <span className="tc">{timecode(h.target_t)}</span>
                {kind && <span className="badge">{kind}</span>}
                {m.status && STATUS[m.status] && (
                  <span className="badge warn">{STATUS[m.status]}{m.superseded_by ? ` → ${m.superseded_by}` : ""}</span>
                )}
              </span>
              <span className="hint-text">{text}</span>
              {m.answer && <span className="hint-sub">答案：{m.answer}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
