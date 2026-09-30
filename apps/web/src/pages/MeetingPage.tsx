// 會議頁：依狀態顯示。尚未開始 → 開始；收音中／暫停／未正常結束 → 即時畫面與控制；
// 整理中 → 等最後整理；待確認 → 30 秒確認；已確認 → 會後檢視（記錄＋逐字稿、匯出、刪除）。
import { useEffect, useMemo, useState } from "react";
import { Button } from "@design/components/core/Button.jsx";
import { IconButton } from "@design/components/core/IconButton.jsx";
import { Icon } from "@design/components/core/Icon.jsx";
import { Tabs } from "@design/components/navigation/Tabs.jsx";
import { Levels, RecCapsule, Titlebar } from "../components/Chrome";
import { AskDialog, ConfirmDialog, MeetingEditDialog, PairDialog } from "../components/Dialogs";
import { Hints } from "../components/Hints";
import { Minutes, type MinutesEditing } from "../components/Minutes";
import { Transcript } from "../components/Transcript";
import { AudioBar, type Seek } from "../components/AudioBar";
import { api, type Utt } from "../lib/api";
import { STATUS_LABEL, dateTime, duration, go, timecode, useTick } from "../lib/format";
import { NOTICE, untitled } from "../lib/quick";
import { meetingClock, useMeeting, type MeetingState } from "../lib/useMeeting";

export interface Editing {
  onEditUtt: (id: string, text: string) => Promise<void>;
  onDeleteUtt: (id: string) => Promise<void>;
  minutes: MinutesEditing;
}

export function LiveBody({ s, emptyMinutes, editing, at, onSeek }: {
  s: MeetingState; emptyMinutes: string; editing?: Editing; at?: string | null; onSeek?: (u: Utt) => void;
}) {
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  // 從帳本點進來（#/m/:id?at=句子id）：逐字稿載入後跳到那一句
  const [pending, setPending] = useState(at);
  useEffect(() => {
    if (pending && s.utts.some((u) => u.id === pending)) { setFocus({ id: pending, n: 1 }); setPending(null); }
  }, [pending, s.utts]);
  const m = s.minutes;
  return (
    <div className="live">
      <section className="conversation">
        <div className="label">Live conversation <span className="meta">繁中 · 中英混說</span></div>
        <Transcript utts={s.utts} pauses={s.pauses} focus={focus} onEdit={editing?.onEditUtt} onDelete={editing?.onDeleteUtt} onSeek={onSeek}
          follow={!["ended", "confirmed"].includes(s.meeting?.status ?? "")} />
      </section>
      <aside className="context panel">
        <div className="label">Live minutes <span className="meta">{m ? `v${m.version}${m.reflected_at != null ? ` · 整理於 ${timecode(m.reflected_at)}` : ""}` : ""}</span></div>
        <div className="scroll">
          <Hints hints={s.hints} onJump={(id) => setFocus({ id, n: (focus?.n ?? 0) + 1 })} />
          <Minutes minutes={m} emptyText={emptyMinutes} editing={editing?.minutes} onJump={(id) => setFocus({ id, n: (focus?.n ?? 0) + 1 })} />
        </div>
      </aside>
    </div>
  );
}

function Stats({ s }: { s: MeetingState }) {
  const st = s.stats;
  if (!st || !st.utterances) return null;
  const f = (v: number | null) => (v == null ? "–" : `${v.toFixed(1)}s`);
  return <div className="stats">首字 <b>{f(st.first_p50)}</b> · 定稿 <b>{f(st.final_p50)}</b> · <b>{st.utterances}</b> 句</div>;
}

export function MeetingPage({ id, at }: { id: string; at?: string | null }) {
  const s = useMeeting(`/ws/meetings/${id}`);
  const [dialog, setDialog] = useState<"" | "pair" | "stop" | "confirm" | "delete" | "edit">("");
  const [noticeDone, setNoticeDone] = useState(false);   // 開始後提醒告知與會者（ADR-0003），複製或關閉後不再顯示
  const [confirmDismissed, setConfirmDismissed] = useState(false);
  const [tab, setTab] = useState(at ? "both" : "minutes");
  const [seek, setSeek] = useState<Seek | null>(null);
  const [error, setError] = useState("");
  const m = s.meeting;
  useTick(500, m?.status === "live");

  // 會議剛結束時自動跳出確認
  useEffect(() => {
    if (m?.status === "ended" && !confirmDismissed) setDialog((d) => d || "confirm");
  }, [m?.status, confirmDismissed]);

  // 手動編輯：改動會透過 WebSocket 推回來，所以這裡只呼叫 API，失敗時丟出錯誤給表單顯示
  const editing: Editing = useMemo(() => ({
    onEditUtt: async (uid, text) => { await api.editUtt(id, uid, text); },
    onDeleteUtt: async (uid) => { await api.deleteUtt(id, uid); },
    minutes: {
      onAdd: async (it) => { await api.addItem(id, it); },
      onEdit: async (itemId, changes) => { await api.editItem(id, itemId, changes); },
      onDelete: async (itemId) => { await api.deleteItem(id, itemId); },
    },
  }), [id]);

  const act = async (a: "start" | "pause" | "resume" | "stop") => {
    setError("");
    try { await api.action(id, a); } catch (e: any) { setError(e.message); }
  };
  const exportMd = async () => {
    const md = await api.exportMd(id);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `${m?.title ?? "meeting"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!m) {
    return (
      <div className="app">
        <Titlebar><span className="crumb">{s.denied ? "找不到這場會議" : "連線中…"}</span></Titlebar>
      </div>
    );
  }

  const speakers = m.sources.map((x) => x.speaker);
  const inMeeting = ["live", "paused", "interrupted", "ending"].includes(m.status);
  const recState = m.status === "live" ? "rec" : m.status === "ending" ? "ending" : !s.connected ? "offline" : m.status === "draft" ? "idle" : "paused";
  const emptyMinutes = m.minutes_error
    ? `會議記錄未啟用：${m.minutes_error}`
    : "會中出現的決策、待辦、問題與數字會整理在這裡；結論改變時記錄會跟著改版。";

  return (
    <div className="app">
      <Titlebar>
        <IconButton icon="chevron-left" label="回到會議庫" size="sm" onClick={() => go("/")} />
        <span className="crumb"><b>{m.title}</b>{m.mode === "ephemeral" && <span className="badge info" style={{ marginLeft: 8 }}>Ephemeral</span>}</span>
        <IconButton icon="settings-2" label="會議資料（名稱、分類、標籤）" size="sm" onClick={() => setDialog("edit")} />
        <div className="spacer" />
        {inMeeting && <Stats s={s} />}
        {m.status === "live" && <Levels levels={s.levels} speakers={speakers} />}
        {(inMeeting || m.status === "draft") && <RecCapsule state={recState} clock={timecode(meetingClock(s))} />}
        {inMeeting && m.status !== "ending" && (
          <div className="row">
            {m.status === "live" && <Button size="sm" icon="pause" onClick={() => act("pause")}>暫停</Button>}
            {(m.status === "paused" || m.status === "interrupted") && <Button size="sm" icon="play" onClick={() => act("resume")}>繼續</Button>}
            <IconButton icon="qr-code" label="第二螢幕" size="sm" variant="secondary" onClick={() => setDialog("pair")} />
            <Button size="sm" variant="danger" icon="square" onClick={() => setDialog("stop")}>結束</Button>
          </div>
        )}
        {(m.status === "ended" || m.status === "confirmed") && (
          <div className="row">
            {m.status === "ended" && <Button size="sm" variant="primary" icon="check" onClick={() => setDialog("confirm")}>確認決策與待辦</Button>}
            <Button size="sm" icon="download" onClick={exportMd}>匯出 Markdown</Button>
            <IconButton icon="trash-2" label="刪除這場會議" size="sm" variant="secondary" onClick={() => setDialog("delete")} />
          </div>
        )}
      </Titlebar>

      {error && <div className="banner" style={{ margin: "12px 12px 0" }}><Icon name="triangle-alert" size={16} />{error}</div>}
      {m.status === "interrupted" && (
        <div className="banner" style={{ margin: "12px 12px 0" }}>
          <Icon name="triangle-alert" size={16} />
          <span style={{ flex: 1 }}>這場會議上次沒有正常結束。已保存到中斷前的逐字稿與記錄；可以繼續收音，或直接結束並整理。</span>
          <Button size="sm" icon="play" onClick={() => act("resume")}>繼續收音</Button>
          <Button size="sm" variant="primary" onClick={() => setDialog("stop")}>結束並整理</Button>
        </div>
      )}
      {inMeeting && m.status !== "ending" && !noticeDone && (
        <div className="banner" style={{ margin: "12px 12px 0", background: "var(--info-soft)" }}>
          <Icon name="info" size={16} />
          <span style={{ flex: 1 }}>記得告知與會者正在使用 ELIVO 記錄。不希望被記錄時，隨時可以暫停或刪除。</span>
          <Button size="sm" variant="ghost" icon="copy" onClick={() => navigator.clipboard.writeText(NOTICE).then(() => setNoticeDone(true))}>複製告知文字</Button>
          <IconButton icon="x" label="已告知" size="sm" variant="ghost" onClick={() => setNoticeDone(true)} />
        </div>
      )}
      {(m.status === "ended" || m.status === "confirmed") && (untitled(m.title) || !m.space_id) && (
        <div className="banner" style={{ margin: "12px 12px 0", background: "var(--info-soft)" }}>
          <Icon name="folder-pen" size={16} />
          <span style={{ flex: 1 }}>補上名稱與分類：之後比較好找；歸到 Space 後，確認過的決策也會在之後的會議提醒你。</span>
          <Button size="sm" onClick={() => setDialog("edit")}>補上</Button>
        </div>
      )}
      {m.status === "ending" && (
        <div className="banner" style={{ margin: "12px 12px 0", background: "var(--info-soft)" }}>
          <Icon name="loader" size={16} />正在做最後一次整理，完成後會請你確認決策與待辦。
        </div>
      )}

      {m.status === "draft" && (
        <div className="detail">
          <div className="detail-head panel">
            <h1>{m.title}</h1>
            <span className="muted">尚未開始 · 音源：{speakers.join("、")}</span>
            <div className="spacer" />
            <Button variant="primary" icon="circle-dot" onClick={() => act("start")}>開始會議</Button>
          </div>
        </div>
      )}

      {inMeeting && <LiveBody s={s} emptyMinutes={emptyMinutes} editing={m.status === "ending" ? undefined : editing} />}

      {(m.status === "ended" || m.status === "confirmed") && (
        <div className="detail">
          <div className="detail-head panel">
            <h1>{m.title}</h1>
            <span className={`badge ${m.status === "ended" ? "accent" : ""}`}>{STATUS_LABEL[m.status]}</span>
            <span className="muted">{dateTime(m.started_at)} · {duration(m.duration_s)}</span>
            {m.tags.map((t) => <span className="chip" key={t}>#{t}</span>)}
            <div className="spacer" />
            <Tabs value={tab} onChange={setTab} items={[{ id: "minutes", label: "會議記錄" }, { id: "both", label: "記錄＋逐字稿" }]} />
          </div>
          <AudioBar meetingId={id} seek={seek} />
          {tab === "both"
            ? <LiveBody s={s} emptyMinutes={emptyMinutes} editing={editing} at={at}
                onSeek={(u) => setSeek({ t: u.t, speaker: u.speaker, n: (seek?.n ?? 0) + 1 })} />
            : (
              <div className="panel context" style={{ flex: 1, minHeight: 0 }}>
                <div className="scroll">
                  <Minutes minutes={s.minutes} emptyText={m.mode === "ephemeral" ? "Ephemeral 會議只保留確認過的決策與待辦。" : emptyMinutes}
                    editing={editing.minutes} onJump={() => setTab("both")} />
                </div>
              </div>
            )}
        </div>
      )}

      {dialog === "pair" && <PairDialog meetingId={id} onClose={() => setDialog("")} />}
      {dialog === "edit" && <MeetingEditDialog meeting={m} onClose={() => setDialog("")} />}
      {dialog === "stop" && (
        <AskDialog title="結束這場會議？" description="結束後停止收音，並做最後一次整理；接著請你確認決策與待辦。" confirm="結束會議"
          onConfirm={async () => { setDialog(""); await act("stop"); }} onClose={() => setDialog("")} />
      )}
      {dialog === "confirm" && (
        <ConfirmDialog meetingId={id} minutes={s.minutes}
          onDone={() => { setDialog(""); setConfirmDismissed(true); }}
          onLater={() => { setDialog(""); setConfirmDismissed(true); }} />
      )}
      {dialog === "delete" && (
        <AskDialog title="刪除這場會議？" description="逐字稿、會議記錄與保存的錄音都會一起刪除，無法復原。" confirm="刪除" danger
          onConfirm={async () => { await api.deleteMeeting(id); go("/"); }} onClose={() => setDialog("")} />
      )}
    </div>
  );
}
