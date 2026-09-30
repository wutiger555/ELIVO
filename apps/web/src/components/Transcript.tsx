// 逐字稿：正在說的一句放大，定稿後縮回；新確認的字逐字浮現；自動捲動把最新一句停在畫面約 62% 高度。
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@design/components/core/Button.jsx";
import { IconButton } from "@design/components/core/IconButton.jsx";
import type { Utt } from "../lib/api";
import { timecode } from "../lib/format";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

type Edit = { onEdit?: (id: string, text: string) => Promise<void>; onDelete?: (id: string) => Promise<void> };

/** 修正或刪除一句逐字稿（只有定稿的句子可以編輯）。 */
function RowEditor({ u, mode, setMode, onEdit, onDelete }: Edit & { u: Utt; mode: "edit" | "delete"; setMode: (m: "view" | "edit" | "delete") => void }) {
  const [draft, setDraft] = useState(u.committed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); setMode("view"); } catch (e: any) { setError(e.message); setBusy(false); }
  };
  if (mode === "delete") {
    return (
      <div className="utt-editor">
        <div className="hint" style={{ margin: 0 }}>刪除這句？會議記錄裡以這句為依據的地方也會一併移除，無法復原。</div>
        <div className="row">
          <Button size="sm" variant="ghost" onClick={() => setMode("view")}>取消</Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => onDelete!(u.id))}>刪除</Button>
        </div>
        {error && <div className="error-text">{error}</div>}
      </div>
    );
  }
  const save = () => run(() => onEdit!(u.id, draft));
  return (
    <div className="utt-editor">
      <textarea
        className="field" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMode("view");
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save(); }
        }}
      />
      <div className="row">
        <span className="hint" style={{ margin: 0, flex: 1 }}>Enter 儲存 · Esc 取消</span>
        <Button size="sm" variant="ghost" onClick={() => setMode("view")}>取消</Button>
        <Button size="sm" variant="primary" disabled={busy || !draft.trim()} onClick={save}>儲存</Button>
      </div>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}

const Row = memo(function Row({ u, flash, onEdit, onDelete }: Edit & { u: Utt; flash: number }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  // settled：已經顯示過的確定字（純文字）；fresh：這次新增、要逐字浮現的字
  const [view, setView] = useState({ settled: u.committed, fresh: "", rewrite: 0 });
  const prev = useRef(u.committed);
  useEffect(() => {
    const old = prev.current;
    prev.current = u.committed;
    if (u.committed === old) return;
    if (u.committed.startsWith(old) && !reduced) {
      setView((v) => ({ ...v, settled: old, fresh: u.committed.slice(old.length) }));
      const id = window.setTimeout(() => setView((v) => ({ ...v, settled: u.committed, fresh: "" })), 900);
      return () => window.clearTimeout(id);
    }
    setView((v) => ({ settled: u.committed, fresh: "", rewrite: v.rewrite + 1 }));   // 定稿改寫了先前的確定字
  }, [u.committed]);

  const chars = [...view.fresh];
  const step = Math.min(22, 450 / Math.max(1, chars.length));   // 總長度上限約 450ms
  return (
    <div id={`utt-${u.id}`} className={`utt${u.final ? "" : " live"}${flash ? " flash" : ""}`} key={flash}>
      <div className="gutter">
        <span className={`who${u.speaker === "我" ? " me" : ""}`}>{u.speaker}</span>
        <span className="tc">{timecode(u.t)}</span>
        {u.edited && <span className="tc">已修改</span>}
      </div>
      {mode !== "view" ? <RowEditor u={u} mode={mode} setMode={setMode} onEdit={onEdit} onDelete={onDelete} /> : (
      <div className="text">
        <span key={view.rewrite} className={view.rewrite ? "rewrite" : undefined}>{view.settled}</span>
        {chars.map((ch, i) => (
          <span key={view.settled.length + i} className="ink" style={{ animationDelay: `${Math.round(i * step)}ms` }}>{ch}</span>
        ))}
        <span className="t">{u.tentative}</span>
        {u.final && onEdit && (
          <span className="utt-actions">
            <IconButton icon="pencil" label="修正這句" size="sm" onClick={() => setMode("edit")} />
            <IconButton icon="trash-2" label="刪除這句" size="sm" onClick={() => setMode("delete")} />
          </span>
        )}
      </div>
      )}
    </div>
  );
});

export function Transcript({ utts, pauses = [], focus, emptyText = "等待說話…", onEdit, onDelete, follow = true }: Edit & {
  follow?: boolean;   // 會議進行中：自動跟著最新一句；會後：從頭開始看
  utts: Utt[];
  pauses?: { start_t: number; end_t: number | null }[];
  focus?: { id: string; n: number } | null;
  emptyText?: string;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(follow);
  const programmatic = useRef(false);

  const target = () => {
    const el = scroll.current, last = list.current?.lastElementChild as HTMLElement | null;
    if (!el || !last) return 0;
    return Math.max(0, last.offsetTop + last.offsetHeight - el.clientHeight * 0.62);
  };
  const live = follow;
  const scrollToLatest = () => {
    const el = scroll.current;
    if (!el || Math.abs(el.scrollTop - target()) < 2) return;
    programmatic.current = true;
    window.setTimeout(() => { programmatic.current = false; }, 800);
    el.scrollTo({ top: target(), behavior: reduced ? "auto" : "smooth" });
  };
  useLayoutEffect(() => { if (stick && live) scrollToLatest(); });

  useEffect(() => {
    if (!focus) return;
    setStick(false);
    document.getElementById(`utt-${focus.id}`)?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }, [focus]);

  // 暫停區間插在對應的時間點之後
  const rows: (Utt | { pause: { start_t: number; end_t: number | null } })[] = [];
  const marks = [...pauses];
  for (const u of utts) {
    while (marks.length && marks[0].start_t <= u.t) rows.push({ pause: marks.shift()! });
    rows.push(u);
  }
  for (const p of marks) rows.push({ pause: p });

  return (
    <>
      <div
        className="scroll"
        ref={scroll}
        onScroll={() => { if (live && !programmatic.current) setStick((scroll.current?.scrollTop ?? 0) >= target() - 150); }}
      >
        <div className={`transcript${live ? "" : " static"}`} ref={list}>
          {!utts.length && <div className="placeholder">{emptyText}</div>}
          {rows.map((r) =>
            "pause" in r ? (
              <div className="pause-mark" key={`p-${r.pause.start_t}`}>
                {/* 會議時鐘不含暫停，所以暫停只有一個時間點 */}
                {r.pause.end_t == null ? "暫停中" : "暫停"} · {timecode(r.pause.start_t)}
              </div>
            ) : (
              <Row key={r.id} u={r} flash={focus?.id === r.id ? focus.n : 0} onEdit={onEdit} onDelete={onDelete} />
            ),
          )}
        </div>
      </div>
      {live && <button className={`jump${stick ? "" : " show"}`} type="button" onClick={() => { setStick(true); scrollToLatest(); }}>回到最新</button>}
    </>
  );
}
