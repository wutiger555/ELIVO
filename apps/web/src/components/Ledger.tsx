// 決策帳本：一個 Space 裡所有確認過的決策、待辦、問題、數字。可搜尋（「什麼時候決定 X？」）、改狀態、跳回原句。
import { useEffect, useState } from "react";
import { Input } from "@design/components/forms/Input.jsx";
import { Select } from "@design/components/forms/Select.jsx";
import { SegmentedControl } from "@design/components/forms/SegmentedControl.jsx";
import { Switch } from "@design/components/forms/Switch.jsx";
import { api, type Kind, type LedgerItem } from "../lib/api";
import { dateTime, go } from "../lib/format";
import { KIND_ZH, STATUS, STATUS_OPTIONS, STRUCK } from "./Minutes";

export function Ledger({ spaceId }: { spaceId: string }) {
  const [items, setItems] = useState<LedgerItem[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [active, setActive] = useState(true);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => api.ledger(spaceId, { q, kind, active }).then((r) => { setItems(r); setError(""); })
      .catch((e) => setError(e.message)), q ? 250 : 0);
    return () => window.clearTimeout(id);
  }, [spaceId, q, kind, active, version]);

  const setStatus = async (it: LedgerItem, status: string) => {
    try { await api.editItem(it.meeting.id, it.id, { status }); setVersion((v) => v + 1); } catch (e: any) { setError(e.message); }
  };

  return (
    <>
      <div className="ledger-bar">
        <Input size="sm" icon="search" placeholder="搜尋，例如「CMS」「預算」" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <SegmentedControl size="sm" value={kind} onChange={setKind}
          options={[{ value: "", label: "全部" }, ...(Object.keys(KIND_ZH) as Kind[]).map((k) => ({ value: k, label: KIND_ZH[k] }))]} />
        <Switch checked={active} onChange={setActive} label="只看有效" />
      </div>
      {error && <div className="error-text" style={{ padding: "0 8px" }}>{error}</div>}
      <div className="scroll">
        <div className="meetings">
          {items?.length === 0 && (
            <div className="empty-state">
              {q ? `帳本裡找不到「${q}」。` : "還沒有內容。會議結束後按「確認」，確認過的決策、待辦、問題與數字會出現在這裡，之後的會議也會用來提醒。"}
            </div>
          )}
          {items?.map((it) => (
            <div key={it.key} className="ledger-row">
              <div className="ledger-main">
                <span className="ledger-head">
                  <span className="badge">{KIND_ZH[it.kind]}</span>
                  {STATUS[it.status] && <span className={`badge ${STATUS[it.status][1]}`}>{STATUS[it.status][0]}</span>}
                </span>
                <span className={`ledger-text${STRUCK.includes(it.status) ? " struck" : ""}`}>
                  {it.kind === "number" && it.value ? `${it.value}　${it.text}` : it.text}
                </span>
                <span className="sub">
                  {it.owner && <span>負責 {it.owner}</span>}
                  {it.due && <span>期限 {it.due}</span>}
                  {it.answer && <span>答案：{it.answer}</span>}
                </span>
                <button type="button" className="ledger-src" onClick={() => go(`/m/${it.meeting.id}${it.jump ? `?at=${encodeURIComponent(it.jump)}` : ""}`)}>
                  {dateTime(it.meeting.started_at)} · {it.meeting.title}
                  {it.quote && <span className="quote">「{it.quote}」</span>}
                </button>
              </div>
              <Select size="sm" value={it.status} onChange={(e) => setStatus(it, e.target.value)} style={{ width: 112 }}
                options={STATUS_OPTIONS[it.kind].map(([value, label]) => ({ value, label }))} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
