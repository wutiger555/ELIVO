// 會議庫：左側 Space／例行會議／標籤，右側會議清單與搜尋。
import { useCallback, useEffect, useState } from "react";
import { Button } from "@design/components/core/Button.jsx";
import { Icon } from "@design/components/core/Icon.jsx";
import { Input } from "@design/components/forms/Input.jsx";
import { Tabs } from "@design/components/navigation/Tabs.jsx";
import { Titlebar } from "../components/Chrome";
import { GroupSettingsDialog } from "../components/Dialogs";
import { Ledger } from "../components/Ledger";
import { api, type AppStatus, type Meeting, type Space } from "../lib/api";
import { STATUS_LABEL, dateTime, duration, go } from "../lib/format";
import { quickRecord } from "../lib/quick";

type Filter = { space_id?: string; series_id?: string; tag?: string };

function AddInline({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<unknown> }) {
  const [v, setV] = useState("");
  const submit = async () => { if (v.trim()) { await onAdd(v.trim()); setV(""); } };
  return (
    <div className="nav-add">
      <input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <Button size="sm" variant="ghost" icon="plus" onClick={submit}>新增</Button>
    </div>
  );
}

function StatusBadge({ status }: { status: Meeting["status"] }) {
  const tone = { live: "danger", paused: "warn", ending: "info", ended: "accent", interrupted: "warn", confirmed: "", draft: "" }[status];
  return <span className={`badge ${tone}`}>{status === "live" && <span className="pulse" />}{STATUS_LABEL[status]}</span>;
}

export function Library() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tags, setTags] = useState<{ tag: string; n: number }[]>([]);
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [filter, setFilter] = useState<Filter>({});
  const [q, setQ] = useState("");
  const [addSeries, setAddSeries] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [view, setView] = useState("meetings");   // 選了 Space 時：會議清單／帳本
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const [listVersion, setListVersion] = useState(0);
  const reload = useCallback(() => {
    setListVersion((v) => v + 1);
    Promise.all([api.spaces(), api.tags(), api.status()])
      .then(([s, t, st]) => { setSpaces(s); setTags(t); setStatus(st); setError(""); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(reload, [reload]);
  useEffect(() => {
    const id = window.setTimeout(() => api.meetings({ ...filter, q }).then(setMeetings).catch((e) => setError(e.message)), q ? 250 : 0);
    return () => window.clearTimeout(id);
  }, [filter, q, listVersion]);

  const spaceName = (id: string | null) => spaces.find((s) => s.id === id)?.name;
  const seriesName = (id: string | null) => spaces.flatMap((s) => s.series).find((s) => s.id === id)?.name;
  const heading = filter.series_id ? seriesName(filter.series_id) : filter.space_id ? spaceName(filter.space_id) : filter.tag ? `#${filter.tag}` : "全部會議";
  const newHref = `/new?${new URLSearchParams(Object.entries({ space: filter.space_id ?? "", series: filter.series_id ?? "" }).filter(([, v]) => v))}`;
  const is = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter);
  const ledger = view === "ledger" && !!filter.space_id;

  return (
    <div className="app">
      <Titlebar>
        <div className="spacer" />
        <Input size="sm" icon="search" placeholder="搜尋標題或逐字稿" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
        <Button icon="settings-2" onClick={() => go(newHref)}>設定後開始</Button>
        <Button variant="primary" icon="circle-dot" disabled={starting || !!status?.capturing} onClick={async () => {
          setStarting(true);
          const sr = spaces.flatMap((x) => x.series).find((x) => x.id === filter.series_id);
          const sp = spaces.find((x) => x.id === (filter.space_id ?? sr?.space_id));
          try { go(`/m/${await quickRecord(sp, sr?.id)}`); } catch (e: any) { setStartError(e.message); setStarting(false); }
        }}>開始錄音</Button>
      </Titlebar>
      <div className="library">
        <nav className="sidebar panel">
          <div className="scroll">
            <button className={`nav-item${is({}) ? " on" : ""}`} onClick={() => setFilter({})}>
              <Icon name="layers" size={15} />全部會議
            </button>
            <div className="nav-group">
              <div className="label">Spaces</div>
              {spaces.map((s) => (
                <div key={s.id}>
                  <button className={`nav-item${is({ space_id: s.id }) ? " on" : ""}`} onClick={() => setFilter({ space_id: s.id })}>
                    <Icon name="folder" size={15} />{s.name}<span className="n">{s.meeting_count}</span>
                  </button>
                  {s.series.map((sr) => (
                    <button key={sr.id} className={`nav-item sub${is({ series_id: sr.id }) ? " on" : ""}`} onClick={() => setFilter({ series_id: sr.id })}>
                      <Icon name="repeat" size={13} />{sr.name}<span className="n">{sr.meeting_count}</span>
                    </button>
                  ))}
                  {addSeries === s.id
                    ? <AddInline placeholder="例行會議名稱，例如「每週站會」" onAdd={async (n) => { await api.createSeries(s.id, n); setAddSeries(null); reload(); }} />
                    : is({ space_id: s.id }) && (
                      <button className="nav-item sub" onClick={() => setAddSeries(s.id)}><Icon name="plus" size={13} />新增例行會議</button>
                    )}
                </div>
              ))}
              <AddInline placeholder="新 Space，例如客戶或專案" onAdd={async (n) => { await api.createSpace(n); reload(); }} />
            </div>
            {tags.length > 0 && (
              <div className="nav-group">
                <div className="label">Tags</div>
                <div className="tags">
                  {tags.map((t) => (
                    <button key={t.tag} className={`tag-btn${filter.tag === t.tag ? " on" : ""}`} onClick={() => setFilter(filter.tag === t.tag ? {} : { tag: t.tag })}>
                      #{t.tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
        <main className="main-col">
          {error && <div className="banner"><Icon name="triangle-alert" size={16} />無法連線到 ELIVO 服務（{error}）。請確認已執行 <code>python -m elivo</code>。</div>}
          {startError && <div className="banner"><Icon name="triangle-alert" size={16} />無法開始錄音：{startError}</div>}
          {status?.capturing && (
            <div className="banner" style={{ background: "var(--info-soft)" }}>
              <Icon name="circle-dot" size={16} /><span style={{ flex: 1 }}>有一場會議正在收音。</span>
              <Button size="sm" onClick={() => go(`/m/${status.capturing}`)}>回到會議</Button>
            </div>
          )}
          {status?.interrupted.map((m) => (
            <div className="banner" key={m.id}>
              <Icon name="triangle-alert" size={16} />
              <span style={{ flex: 1 }}>「{m.title}」上次沒有正常結束。逐字稿與記錄已保存到中斷前，可以繼續收音或結束整理。</span>
              <Button size="sm" onClick={() => go(`/m/${m.id}`)}>查看</Button>
            </div>
          ))}
          <div className="list-head">
            <h1>{heading}</h1>
            {!ledger && <span className="muted">{meetings ? `${meetings.length} 場` : ""}</span>}
            {filter.space_id && (
              <Tabs value={view} onChange={setView} items={[{ id: "meetings", label: "會議" }, { id: "ledger", label: "帳本" }]} />
            )}
            {(filter.space_id || filter.series_id) && (
              <Button size="sm" variant="ghost" icon="settings-2" onClick={() => setSettings(true)} style={{ marginLeft: "auto" }}>設定</Button>
            )}
          </div>
          {ledger ? <Ledger spaceId={filter.space_id!} /> : (
          <div className="scroll">
            <div className="meetings">
              {meetings?.length === 0 && (
                <div className="empty-state">{q ? `找不到含有「${q}」的會議。` : "這裡還沒有會議。按「開始錄音」就會開始；名稱與分類可以錄完再補。"}</div>
              )}
              {meetings?.map((m) => (
                <button key={m.id} className="meeting-row" onClick={() => go(`/m/${m.id}`)}>
                  <span className="title">{m.title}</span>
                  <span className="when">{dateTime(m.started_at ?? m.created_at)}</span>
                  <span className="sub">
                    <StatusBadge status={m.status} />
                    {m.mode === "ephemeral" && <span className="badge info">Ephemeral</span>}
                    {spaceName(m.space_id) && <span>{spaceName(m.space_id)}{seriesName(m.series_id) ? ` › ${seriesName(m.series_id)}` : ""}</span>}
                    {m.tags.map((t) => <span className="chip" key={t}>#{t}</span>)}
                  </span>
                  <span className="sub right">
                    {m.duration_s > 0 && <span>{duration(m.duration_s)}</span>}
                    {m.counts && (m.counts.decision > 0 || m.counts.action > 0) && <span>決策 {m.counts.decision} · 待辦 {m.counts.action}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}
        </main>
      </div>
      {settings && filter.space_id && (() => {
        const sp = spaces.find((x) => x.id === filter.space_id);
        return sp && <GroupSettingsDialog kind="space" id={sp.id} name={sp.name} glossary={sp.glossary}
          onClose={() => { setSettings(false); reload(); }} onDeleted={() => { setSettings(false); setFilter({}); reload(); }} />;
      })()}
      {settings && filter.series_id && (() => {
        const sr = spaces.flatMap((x) => x.series).find((x) => x.id === filter.series_id);
        return sr && <GroupSettingsDialog kind="series" id={sr.id} name={sr.name}
          onClose={() => { setSettings(false); reload(); }} onDeleted={() => { setSettings(false); setFilter({ space_id: sr.space_id }); reload(); }} />;
      })()}
    </div>
  );
}
