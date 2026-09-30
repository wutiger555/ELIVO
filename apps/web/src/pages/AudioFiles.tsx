// 錄音檔：所有保存的會議錄音、各占多少空間；可以單場刪除，或一次刪除 N 天以前的錄音（逐字稿與會議記錄保留）。
import { useCallback, useEffect, useState } from "react";
import { Button } from "@design/components/core/Button.jsx";
import { Icon } from "@design/components/core/Icon.jsx";
import { IconButton } from "@design/components/core/IconButton.jsx";
import { Select } from "@design/components/forms/Select.jsx";
import { Titlebar } from "../components/Chrome";
import { AskDialog } from "../components/Dialogs";
import { api, type AudioLibrary } from "../lib/api";
import { bytes, dateTime, duration, go } from "../lib/format";

const DAYS = [30, 90, 180, 365];

export function AudioFiles() {
  const [lib, setLib] = useState<AudioLibrary | null>(null);
  const [days, setDays] = useState(90);
  const [ask, setAsk] = useState<{ title: string; description: string; run: () => Promise<unknown> } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const reload = useCallback(() => { api.audioLibrary().then(setLib).catch((e) => setError(e.message)); }, []);
  useEffect(reload, [reload]);

  const cutoff = Date.now() / 1000 - days * 86400;
  const old = (lib?.meetings ?? []).filter((r) => (r.meeting.ended_at ?? r.meeting.started_at ?? r.meeting.created_at) < cutoff
    && !["live", "paused", "ending", "interrupted"].includes(r.meeting.status));
  const oldBytes = old.reduce((n, r) => n + r.bytes, 0);

  return (
    <div className="app">
      <Titlebar><span className="crumb">錄音檔</span></Titlebar>
      <div className="form-page">
        <div className="audio-page">
          <div className="list-head">
            <h1>錄音檔</h1>
            {lib && <span className="muted">{lib.meetings.length} 場 · 共 {bytes(lib.total_bytes)} · 這台 Mac 剩餘 {bytes(lib.free_bytes)}</span>}
          </div>
          <div className="panel cleanup">
            <span>刪除</span>
            <Select size="sm" value={String(days)} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 120 }}
              options={DAYS.map((d) => ({ value: String(d), label: `${d} 天以前` }))} />
            <span className="muted">的錄音：{old.length} 場，{bytes(oldBytes)}</span>
            <div className="spacer" />
            <Button size="sm" variant="danger" disabled={!old.length} onClick={() => setAsk({
              title: `刪除 ${old.length} 場會議的錄音？`, description: `釋出 ${bytes(oldBytes)}。逐字稿與會議記錄保留；錄音刪除後無法復原。`,
              run: async () => { const r = await api.audioCleanup(days); setNote(`已刪除 ${r.meetings} 場的錄音，釋出 ${bytes(r.freed)}。`); },
            })}>刪除</Button>
          </div>
          {note && <div className="hint">{note}</div>}
          {error && <div className="error-text">{error}</div>}
          <div className="meetings">
            {lib?.meetings.length === 0 && <div className="empty-state">沒有保存的錄音。</div>}
            {lib?.meetings.map((r) => (
              <div key={r.meeting.id} className="meeting-row audio-row">
                <button type="button" className="title" onClick={() => r.meeting.status !== "deleted" && go(`/m/${r.meeting.id}`)}>{r.meeting.title}</button>
                <span className="when">{dateTime(r.meeting.started_at ?? r.meeting.created_at)}</span>
                <span className="sub">
                  <Icon name="audio-lines" size={13} />
                  {r.files.map((f) => f.speaker).join("、")}
                  {r.meeting.duration_s > 0 && <span>{duration(r.meeting.duration_s)}</span>}
                </span>
                <span className="sub right">
                  <span>{bytes(r.bytes)}</span>
                  <IconButton icon="trash-2" label="刪除這場的錄音" size="sm" variant="ghost" onClick={() => setAsk({
                    title: "刪除這場的錄音？", description: `「${r.meeting.title}」，${bytes(r.bytes)}。逐字稿與會議記錄保留。`,
                    run: () => api.deleteAudio(r.meeting.id),
                  })} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {ask && <AskDialog title={ask.title} description={ask.description} confirm="刪除" danger
        onConfirm={async () => { try { await ask.run(); } catch (e: any) { setError(e.message); } setAsk(null); reload(); }}
        onClose={() => setAsk(null)} />}
    </div>
  );
}
