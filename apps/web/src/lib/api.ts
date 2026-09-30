// services/realtime 的 API 型別與呼叫。管理 API 只接受本機連線（第二螢幕走 /ws/view）。

export type Status = "draft" | "live" | "paused" | "ending" | "ended" | "confirmed" | "interrupted";
export type Kind = "decision" | "action" | "question" | "number";

export interface Series { id: string; space_id: string; name: string; meeting_count: number }
export interface Space { id: string; name: string; glossary: string; meeting_count: number; series: Series[] }
export interface SourceConf { speaker: string; device: number | string | null }

export interface Meeting {
  id: string;
  title: string;
  space_id: string | null;
  series_id: string | null;
  status: Status;
  mode: "standard" | "ephemeral";
  keep_audio: boolean;
  glossary: string;
  sources: SourceConf[];
  tags: string[];
  created_at: number;
  started_at: number | null;
  ended_at: number | null;
  duration_s: number;
  counts?: Record<Kind, number>;
  minutes_error?: string | null;
}

export interface Utt { type: "utt"; id: string; speaker: string; committed: string; tentative: string; final: boolean; t: number; edited?: boolean }
export interface Revision { t: number; by: "fast" | "reflect" | "user"; change: string; utt_ids: string[] }
export interface Item {
  id: string; kind: Kind; text: string; status: string;
  owner: string | null; due: string | null; value: string | null; answer: string | null; superseded_by: string | null;
  utt_ids: string[]; history: Revision[];
}
export interface Minutes { version: number; reflected_at: number | null; summary: { topic: string; points: string[] }[]; items: Item[]; utt_t: Record<string, number> }
export interface Stats { utterances: number; first_p50: number | null; final_p50: number | null; infer_p50: number | null; llm_calls?: number }
export interface Snapshot {
  type: "snapshot"; meeting: Meeting; utts: Utt[]; minutes: Minutes | null; stats: Stats;
  pauses: { start_t: number; end_t: number | null }[]; clock: number; running: boolean;
}
export interface Devices { inputs: { id: number; name: string; channels: number; default: boolean }[]; systap: boolean }
export interface AppStatus {
  asr_model: string; capturing: string | null; interrupted: Meeting[]; lan_url: string;
  llm: { provider: string; fast_model: string; reflect_model: string };
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { msg = (await r.json()).detail ?? msg; } catch { /* 非 JSON 錯誤 */ }
    throw new Error(msg);
  }
  const type = r.headers.get("content-type") ?? "";
  return (type.includes("json") ? r.json() : r.text()) as Promise<T>;
}

export const api = {
  status: () => call<AppStatus>("GET", "/api/status"),
  devices: () => call<Devices>("GET", "/api/devices"),
  spaces: () => call<Space[]>("GET", "/api/spaces"),
  createSpace: (name: string) => call<Space>("POST", "/api/spaces", { name }),
  updateSpace: (id: string, f: { name?: string; glossary?: string }) => call<Space>("PATCH", `/api/spaces/${id}`, f),
  deleteSpace: (id: string) => call("DELETE", `/api/spaces/${id}`),
  createSeries: (spaceId: string, name: string) => call<Series>("POST", `/api/spaces/${spaceId}/series`, { name }),
  updateSeries: (id: string, name: string) => call<Series>("PATCH", `/api/series/${id}`, { name }),
  deleteSeries: (id: string) => call("DELETE", `/api/series/${id}`),
  brief: (seriesId: string) => call<{ meeting: { id: string; title: string; started_at: number } | null; items: Item[] }>("GET", `/api/series/${seriesId}/brief`),
  tags: () => call<{ tag: string; n: number }[]>("GET", "/api/tags"),
  meetings: (q: { space_id?: string; series_id?: string; tag?: string; q?: string }) => {
    const params = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
    return call<Meeting[]>("GET", `/api/meetings?${params}`);
  },
  createMeeting: (m: Partial<Meeting>) => call<Meeting>("POST", "/api/meetings", m),
  meeting: (id: string) => call<Snapshot>("GET", `/api/meetings/${id}`),
  updateMeeting: (id: string, f: Partial<Pick<Meeting, "title" | "space_id" | "series_id" | "tags">>) => call<Meeting>("PATCH", `/api/meetings/${id}`, f),
  deleteMeeting: (id: string) => call("DELETE", `/api/meetings/${id}`),
  addItem: (id: string, it: Partial<Item>) => call<Item>("POST", `/api/meetings/${id}/items`, it),
  editItem: (id: string, itemId: string, f: Partial<Item>) => call<Item>("PATCH", `/api/meetings/${id}/items/${itemId}`, f),
  deleteItem: (id: string, itemId: string) => call("DELETE", `/api/meetings/${id}/items/${itemId}`),
  editUtt: (id: string, uid: string, text: string) => call("PATCH", `/api/meetings/${id}/utterances/${encodeURIComponent(uid)}`, { text }),
  deleteUtt: (id: string, uid: string) => call("DELETE", `/api/meetings/${id}/utterances/${encodeURIComponent(uid)}`),
  action: (id: string, action: "start" | "pause" | "resume" | "stop") => call<Meeting>("POST", `/api/meetings/${id}/${action}`),
  confirm: (id: string, keep: string[], edits: Record<string, Partial<Item>>) => call<Snapshot>("POST", `/api/meetings/${id}/confirm`, { keep, edits }),
  exportMd: (id: string) => call<string>("GET", `/api/meetings/${id}/export.md`),
  pair: (id: string) => call<{ token: string; url: string; expires_at: number }>("POST", `/api/meetings/${id}/pair`),
  unpair: (id: string) => call("DELETE", `/api/meetings/${id}/pair`),
};

export const wsUrl = (path: string) => `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${path}`;
