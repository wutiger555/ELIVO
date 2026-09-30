// 新會議：名稱、分類、音源（含音量測試）、模式、術語表、告知文字。按「開始會議」才開始收音。
import { useEffect, useState } from "react";
import { Button } from "@design/components/core/Button.jsx";
import { Icon } from "@design/components/core/Icon.jsx";
import { Input } from "@design/components/forms/Input.jsx";
import { Select } from "@design/components/forms/Select.jsx";
import { Switch } from "@design/components/forms/Switch.jsx";
import { SegmentedControl } from "@design/components/forms/SegmentedControl.jsx";
import { Titlebar } from "../components/Chrome";
import { api, wsUrl, type Devices, type Item, type LedgerMeeting, type Space } from "../lib/api";
import { dateTime, go } from "../lib/format";
import { NOTICE, saveSources } from "../lib/quick";
const KIND = { decision: "上次決策", action: "未完成待辦", question: "未答問題", number: "數字" };

/** 會前音量測試：選好的裝置即時顯示音量，確認真的收得到聲音。 */
function Meter({ device }: { device: string }) {
  const [v, setV] = useState(0);
  const [err, setErr] = useState("");
  useEffect(() => {
    const ws = new WebSocket(wsUrl(`/ws/meter?device=${encodeURIComponent(device)}`));
    ws.onmessage = (m) => { const d = JSON.parse(m.data); d.error ? setErr(d.error) : setV(d.rms); };
    return () => ws.close();
  }, [device]);
  if (err) return <span className="error-text" title={err}>無法開啟</span>;
  return <div className="meter" title="音量"><i style={{ width: `${Math.min(100, Math.sqrt(v) * 260)}%` }} /></div>;
}

export function NewMeeting({ query }: { query: URLSearchParams }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [devices, setDevices] = useState<Devices | null>(null);
  const [title, setTitle] = useState("");
  const [spaceId, setSpaceId] = useState(query.get("space") ?? "");
  const [seriesId, setSeriesId] = useState(query.get("series") ?? "");
  const [tags, setTags] = useState("");
  const [mic, setMic] = useState({ on: true, device: "" });
  const [sys, setSys] = useState({ on: false });
  const [mode, setMode] = useState<"standard" | "ephemeral">("standard");
  const [keepAudio, setKeepAudio] = useState(false);
  const [aiPolicy, setAiPolicy] = useState<"economy" | "quality">("economy");
  const [glossary, setGlossary] = useState<string | null>(null);   // null＝沿用 Space 的術語表
  const [brief, setBrief] = useState<{ meeting: { title: string; started_at: number } | null; items: (Item & { from?: LedgerMeeting })[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.spaces().then((s) => {
      setSpaces(s);
      // 從例行會議進來時，自動帶入所屬 Space
      const sr = s.flatMap((x) => x.series).find((x) => x.id === query.get("series"));
      if (sr) setSpaceId(sr.space_id);
    }).catch((e) => setError(e.message));
    api.devices().then((d) => {
      setDevices(d);
      setMic((m) => ({ ...m, device: String(d.inputs.find((i) => i.default)?.id ?? d.inputs[0]?.id ?? "") }));
    }).catch((e) => setError(e.message));
  }, [query]);
  useEffect(() => {
    setBrief(null);
    if (seriesId) api.brief(seriesId).then(setBrief).catch(() => setBrief(null));
  }, [seriesId]);

  const space = spaces.find((s) => s.id === spaceId);
  const series = space?.series ?? [];
  const glossaryValue = glossary ?? space?.glossary ?? "";
  useEffect(() => {
    if (!title && seriesId) {
      const sr = series.find((s) => s.id === seriesId);
      const d = new Date();
      if (sr) setTitle(`${sr.name} ${d.getMonth() + 1}/${d.getDate()}`);
    }
  }, [seriesId, series, title]);

  const sources = [
    ...(mic.on ? [{ speaker: "我", device: mic.device === "" ? null : Number(mic.device) }] : []),
    ...(sys.on ? [{ speaker: "他人", device: "systap" }] : []),
  ];
  const submit = async (start: boolean) => {
    if (!title.trim()) { setError("請輸入會議名稱"); return; }
    if (!sources.length) { setError("至少要開啟一個音源"); return; }
    setBusy(true);
    setError("");
    saveSources(sources);   // 下次「開始錄音」沿用
    try {
      const m = await api.createMeeting({
        title: title.trim(), space_id: spaceId || null, series_id: seriesId || null, mode, ai_policy: aiPolicy,
        keep_audio: keepAudio && mode === "standard",
        glossary: glossaryValue, sources, tags: tags.split(/[,，\s]+/).filter(Boolean),
      });
      if (start) await api.action(m.id, "start");
      go(`/m/${m.id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <Titlebar><span className="crumb">新會議</span></Titlebar>
      <div className="form-page">
        <div className="form-grid">
          <div className="form-card panel">
            <h1>準備開始</h1>
            <Input label="會議名稱" placeholder="例如：APIT 專案例會 9/30" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="two">
              <Select label="Space（客戶／專案）" value={spaceId} onChange={(e) => { setSpaceId(e.target.value); setSeriesId(""); }}
                options={[{ value: "", label: "未分類" }, ...spaces.map((s) => ({ value: s.id, label: s.name }))]} />
              <Select label="例行會議" value={seriesId} onChange={(e) => setSeriesId(e.target.value)} disabled={!space}
                options={[{ value: "", label: "單次會議" }, ...series.map((s) => ({ value: s.id, label: s.name }))]} />
            </div>
            <Input label="標籤" placeholder="用逗號或空白分隔，例如：預算 上線" value={tags} onChange={(e) => setTags(e.target.value)} />

            <div>
              <span className="field-label">音源</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="source-row">
                  <span className="who me">我</span>
                  <Select size="sm" value={mic.device} onChange={(e) => setMic({ ...mic, device: e.target.value })} disabled={!mic.on}
                    options={(devices?.inputs ?? []).map((d) => ({ value: String(d.id), label: d.name }))} />
                  {mic.on && mic.device !== "" ? <Meter device={mic.device} /> : <span />}
                  <Switch checked={mic.on} onChange={(v: boolean) => setMic({ ...mic, on: v })} />
                </div>
                <div className="source-row">
                  <span className="who">他人</span>
                  <span className="muted" style={{ font: "400 13px/1.4 var(--font-sans)" }}>
                    系統音訊（Zoom、Meet、Teams 的聲音）{devices && !devices.systap && " · 尚未建置 systap"}
                  </span>
                  {sys.on && devices?.systap ? <Meter device="systap" /> : <span />}
                  <Switch checked={sys.on} onChange={(v: boolean) => setSys({ on: v })} disabled={!devices?.systap} />
                </div>
              </div>
              <div className="hint">線上會議請戴耳機：用喇叭時麥克風會收到對方的聲音，同一句會出現兩次。</div>
            </div>

            <div>
              <span className="field-label">模式</span>
              <SegmentedControl value={mode} onChange={(v: string) => setMode(v as "standard" | "ephemeral")}
                options={[{ value: "standard", label: "標準" }, { value: "ephemeral", label: "Ephemeral" }]} />
              <div className="hint">
                {mode === "standard"
                  ? "逐字稿與會議記錄即時保存在這台 Mac；意外關閉也不會遺失。"
                  : "逐字稿與音訊不保存，會後只留下你確認過的決策與待辦。意外關閉時，這場的內容無法復原。"}
              </div>
              {mode === "standard" && (
                <div style={{ marginTop: 12 }}>
                  <Switch checked={keepAudio} onChange={setKeepAudio} label="會後保存錄音（FLAC，存在這台 Mac）" />
                </div>
              )}
            </div>

            <div>
              <span className="field-label">AI 會議記錄</span>
              <SegmentedControl value={aiPolicy} onChange={(v: string) => setAiPolicy(v as "economy" | "quality")}
                options={[{ value: "economy", label: "節省" }, { value: "quality", label: "高品質" }]} />
              <div className="hint">
                {aiPolicy === "economy"
                  ? "攢一小段內容才整理一次（約 30 秒），閒聊不送 AI；成本約為高品質模式的幾分之一。"
                  : "每十幾秒更新一次、用較強的模型整理，記錄最即時，成本較高。"}
              </div>
            </div>

            <div>
              <span className="field-label">術語表</span>
              <textarea className="field" value={glossaryValue} onChange={(e) => setGlossary(e.target.value)}
                placeholder="客戶名、產品名、英文縮寫，一行一個或用逗號分隔。同時用於辨識與會議記錄校正。" />
            </div>

            <div>
              <span className="field-label">告知與會者</span>
              <div className="notice">{NOTICE}</div>
              <div style={{ marginTop: 8 }}>
                <Button size="sm" variant="ghost" icon={copied ? "check" : "copy"}
                  onClick={() => navigator.clipboard.writeText(NOTICE).then(() => setCopied(true))}>
                  {copied ? "已複製，可貼到會議聊天室" : "複製告知文字"}
                </Button>
              </div>
            </div>

            {error && <div className="error-text">{error}</div>}
            <div className="actions">
              <Button variant="ghost" onClick={() => go("/")}>取消</Button>
              <Button onClick={() => submit(false)} disabled={busy}>只建立，稍後開始</Button>
              <Button variant="primary" icon="circle-dot" onClick={() => submit(true)} disabled={busy}>開始會議</Button>
            </div>
          </div>

          <aside className="brief panel">
            <div className="label"><Icon name="history" size={13} />會前簡報</div>
            {!seriesId && <div className="placeholder">選擇例行會議後，這裡會列出上一場的決策、未完成待辦與未答問題。</div>}
            {seriesId && brief && !brief.meeting && <div className="placeholder">這個例行會議還沒有結束過的場次。</div>}
            {brief?.meeting && (
              <>
                <div className="muted" style={{ font: "400 13px/1.5 var(--font-sans)" }}>上一場：{brief.meeting.title} · {dateTime(brief.meeting.started_at)}</div>
                {brief.items.length === 0 && <div className="placeholder">上一場沒有留下決策或待辦。</div>}
                {brief.items.map((it) => (
                  <div className="brief-item" key={it.id}>
                    <span className="k">{KIND[it.kind]}</span>
                    {it.kind === "number" && it.value ? `${it.value}　${it.text}` : it.text}
                    {it.owner && <span className="muted"> · 負責 {it.owner}</span>}
                    {it.due && <span className="muted"> · {it.due}</span>}
                    {it.from && <span className="muted"> · 來自 {it.from.title}</span>}
                  </div>
                ))}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
