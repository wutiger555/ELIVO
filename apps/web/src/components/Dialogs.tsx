import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@design/components/core/Button.jsx";
import { Checkbox } from "@design/components/forms/Checkbox.jsx";
import { Input } from "@design/components/forms/Input.jsx";
import { Select } from "@design/components/forms/Select.jsx";
import { Dialog } from "@design/components/feedback/Dialog.jsx";
import { api, type Item, type Minutes } from "../lib/api";
import { ACTIVE } from "./Minutes";

/** 第二螢幕：產生帶一次性配對碼的網址與 QR code；同一個 Wi-Fi 的手機／iPad 掃描後唯讀檢視這場會議。 */
export function PairDialog({ meetingId, onClose }: { meetingId: string; onClose: () => void }) {
  const [pair, setPair] = useState<{ url: string; qr: string; expires: number } | null>(null);
  const [error, setError] = useState("");
  const [revoked, setRevoked] = useState(false);
  useEffect(() => {
    api.pair(meetingId)
      .then(async (p) => setPair({ url: p.url, qr: await QRCode.toDataURL(p.url, { margin: 1, width: 480 }), expires: p.expires_at }))
      .catch((e) => setError(e.message));
  }, [meetingId]);
  const revoke = async () => { await api.unpair(meetingId); setRevoked(true); };
  const localOnly = pair?.url.includes("//127.0.0.1");
  return (
    <Dialog
      title="在手機或 iPad 上看這場會議"
      description="用同一個 Wi-Fi 的裝置掃描。只能唯讀檢視這一場，12 小時後失效，也可以隨時撤銷。"
      onClose={onClose}
      width={440}
      footer={<>
        <Button variant="ghost" onClick={revoke} disabled={revoked}>{revoked ? "已撤銷" : "撤銷所有配對"}</Button>
        <Button variant="primary" onClick={onClose}>完成</Button>
      </>}
    >
      {error && <div className="error-text">{error}</div>}
      {pair && !revoked && (
        <div className="qr">
          <img src={pair.qr} alt="第二螢幕配對 QR code" />
          <code>{pair.url}</code>
          {localOnly && <div className="hint">這台 Mac 目前沒有連上區網，手機可能無法連線。</div>}
          <div className="hint">第一次連線時，Mac 可能會詢問是否允許傳入連線，請按允許。</div>
        </div>
      )}
      {revoked && <div className="placeholder">已撤銷，已連線的裝置會被斷開。需要時再重新產生。</div>}
    </Dialog>
  );
}

/** 會後 30 秒確認：勾選要保留的決策與待辦，可改負責人與期限。 */
export function ConfirmDialog({ meetingId, minutes, onDone, onLater }: {
  meetingId: string; minutes: Minutes | null; onDone: () => void; onLater: () => void;
}) {
  const items = (minutes?.items ?? []).filter((it) => (it.kind === "decision" || it.kind === "action") && it.status === ACTIVE[it.kind]);
  const [keep, setKeep] = useState(() => new Set(items.map((it) => it.id)));
  const [edits, setEdits] = useState<Record<string, Partial<Item>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const decisions = items.filter((it) => it.kind === "decision");
  const actions = items.filter((it) => it.kind === "action");
  const toggle = (id: string, on: boolean) => setKeep((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
  const edit = (it: Item, k: "owner" | "due", v: string) => setEdits((e) => ({ ...e, [it.id]: { ...e[it.id], [k]: v || null } }));
  const save = async () => {
    setSaving(true);
    try {
      // 只送真的改過的欄位，避免把沒動的欄位標成「手動修改」
      const changed = Object.fromEntries(Object.entries(edits).map(([id, e]) => {
        const it = items.find((x) => x.id === id)!;
        return [id, Object.fromEntries(Object.entries(e).filter(([k, v]) => v !== (it as any)[k]))];
      }).filter(([, e]) => Object.keys(e as object).length));
      await api.confirm(meetingId, [...keep], changed);
      onDone();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };
  return (
    <Dialog
      title={`這 ${decisions.length} 個決策、${actions.length} 個待辦對嗎？`}
      description="取消勾選的項目不會保留；可以直接修改負責人與期限。之後也能在會議頁面修改。"
      onClose={onLater}
      width={560}
      footer={<>
        <Button variant="ghost" onClick={onLater}>稍後再確認</Button>
        <Button variant="primary" icon="check" onClick={save} disabled={saving}>{saving ? "儲存中…" : "確認並儲存"}</Button>
      </>}
    >
      {!items.length && <div className="placeholder">這場會議沒有抽出決策或待辦，直接確認即可。</div>}
      <div className="confirm-list">
        {[...decisions, ...actions].map((it) => (
          <div className="confirm-row" key={it.id}>
            <Checkbox
              checked={keep.has(it.id)}
              onChange={(v: boolean) => toggle(it.id, v)}
              label={it.text}
              description={`${it.kind === "decision" ? "決策" : "待辦"} · ${it.id}`}
            />
            {it.kind === "action" && keep.has(it.id) && (
              <div className="edit">
                <Input size="sm" placeholder="負責人" value={edits[it.id]?.owner ?? it.owner ?? ""} onChange={(e) => edit(it, "owner", e.target.value)} />
                <Input size="sm" placeholder="期限" value={edits[it.id]?.due ?? it.due ?? ""} onChange={(e) => edit(it, "due", e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <div className="error-text">{error}</div>}
    </Dialog>
  );
}

/** 需要再確認一次的操作（結束會議、刪除）。 */
export function AskDialog({ title, description, confirm, danger, onConfirm, onClose }: {
  title: string; description?: string; confirm: string; danger?: boolean; onConfirm: () => void | Promise<void>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title={title} description={description} onClose={onClose} width={420} footer={<>
      <Button variant="ghost" onClick={onClose}>取消</Button>
      <Button variant={danger ? "danger" : "primary"} disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>{confirm}</Button>
    </>} />
  );
}

/** 會議資料：改名、移到別的 Space／例行會議、改標籤（會議開始後也能改）。 */
export function MeetingEditDialog({ meeting, onClose }: { meeting: import("../lib/api").Meeting; onClose: () => void }) {
  const [spaces, setSpaces] = useState<import("../lib/api").Space[]>([]);
  const [title, setTitle] = useState(meeting.title);
  const [spaceId, setSpaceId] = useState(meeting.space_id ?? "");
  const [seriesId, setSeriesId] = useState(meeting.series_id ?? "");
  const [tags, setTags] = useState(meeting.tags.join(" "));
  const [error, setError] = useState("");
  useEffect(() => { api.spaces().then(setSpaces).catch((e) => setError(e.message)); }, []);
  const series = spaces.find((s) => s.id === spaceId)?.series ?? [];
  const save = async () => {
    if (!title.trim()) { setError("請輸入會議名稱"); return; }
    try {
      await api.updateMeeting(meeting.id, {
        title: title.trim(), space_id: spaceId || null, series_id: seriesId || null, tags: tags.split(/[,，\s]+/).filter(Boolean),
      });
      onClose();
    } catch (e: any) { setError(e.message); }
  };
  return (
    <Dialog title="會議資料" onClose={onClose} width={480} footer={<>
      <Button variant="ghost" onClick={onClose}>取消</Button>
      <Button variant="primary" onClick={save}>儲存</Button>
    </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input label="會議名稱" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select label="Space（客戶／專案）" value={spaceId} onChange={(e) => { setSpaceId(e.target.value); setSeriesId(""); }}
          options={[{ value: "", label: "未分類" }, ...spaces.map((s) => ({ value: s.id, label: s.name }))]} />
        <Select label="例行會議" value={seriesId} onChange={(e) => setSeriesId(e.target.value)} disabled={!spaceId}
          options={[{ value: "", label: "單次會議" }, ...series.map((s) => ({ value: s.id, label: s.name }))]} />
        <Input label="標籤" placeholder="用逗號或空白分隔" value={tags} onChange={(e) => setTags(e.target.value)} />
        {error && <div className="error-text">{error}</div>}
      </div>
    </Dialog>
  );
}

/** Space 或例行會議的設定：改名、術語表（Space）、刪除（會議保留，變成未分類）。 */
export function GroupSettingsDialog({ kind, id, name, glossary, onClose, onDeleted }: {
  kind: "space" | "series"; id: string; name: string; glossary?: string; onClose: () => void; onDeleted: () => void;
}) {
  const [n, setN] = useState(name);
  const [g, setG] = useState(glossary ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const label = kind === "space" ? "Space " : "例行會議";   // 中英之間留空白：「Space 設定」
  const save = async () => {
    if (!n.trim()) { setError("請輸入名稱"); return; }
    try {
      if (kind === "space") await api.updateSpace(id, { name: n.trim(), glossary: g });
      else await api.updateSeries(id, n.trim());
      onClose();
    } catch (e: any) { setError(e.message); }
  };
  const remove = async () => {
    try {
      if (kind === "space") await api.deleteSpace(id); else await api.deleteSeries(id);
      onDeleted();
    } catch (e: any) { setError(e.message); }
  };
  return (
    <Dialog title={`${label}設定`} onClose={onClose} width={480} footer={confirmDelete ? <>
      <Button variant="ghost" onClick={() => setConfirmDelete(false)}>取消</Button>
      <Button variant="danger" onClick={remove}>確定刪除</Button>
    </> : <>
      <Button variant="ghost" icon="trash-2" onClick={() => setConfirmDelete(true)} style={{ marginRight: "auto" }}>刪除{label}</Button>
      <Button variant="ghost" onClick={onClose}>取消</Button>
      <Button variant="primary" onClick={save}>儲存</Button>
    </>}>
      {confirmDelete ? (
        <div className="placeholder" style={{ color: "var(--text-2)" }}>
          刪除「{name}」{kind === "space" ? "與底下的例行會議" : ""}？裡面的會議都會保留，只是變成{kind === "space" ? "未分類" : "單次會議"}。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="名稱" value={n} onChange={(e) => setN(e.target.value)} />
          {kind === "space" && (
            <div>
              <span className="field-label">術語表</span>
              <textarea className="field" value={g} onChange={(e) => setG(e.target.value)} placeholder="客戶名、產品名、英文縮寫，一行一個" />
              <div className="hint">在這個 Space 建立新會議時會自動帶入，用於辨識與會議記錄校正。</div>
            </div>
          )}
        </div>
      )}
      {error && <div className="error-text">{error}</div>}
    </Dialog>
  );
}
