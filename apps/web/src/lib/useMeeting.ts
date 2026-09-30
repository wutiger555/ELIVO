// 訂閱一場會議的即時事件（本機控制端 /ws/meetings/:id，第二螢幕 /ws/view?token=）。
// 斷線會自動重連；重連後伺服器會先送完整快照，所以關掉分頁再打開也接得回來。
import { useEffect, useReducer } from "react";
import { wsUrl, type Hint, type Meeting, type Minutes, type Snapshot, type Stats, type Utt } from "./api";

export interface MeetingState {
  meeting: Meeting | null;
  utts: Utt[];
  minutes: Minutes | null;
  stats: Stats | null;
  hints: Hint[];
  pauses: Snapshot["pauses"];
  clockBase: number;   // 伺服器回報的會議時間（秒）
  clockAt: number;     // 收到時的本機時間（performance.now）
  running: boolean;
  levels: Record<string, number>;
  connected: boolean;
  denied: boolean;     // 伺服器以 4403 拒絕（配對碼無效或已撤銷）
}

type Action =
  | { type: "open" }
  | { type: "close"; code: number }
  | { type: "event"; ev: any };

const initial: MeetingState = {
  meeting: null, utts: [], minutes: null, stats: null, hints: [], pauses: [], clockBase: 0, clockAt: 0, running: false,
  levels: {}, connected: false, denied: false,
};

function reduce(s: MeetingState, a: Action): MeetingState {
  if (a.type === "open") return { ...s, connected: true, denied: false };
  if (a.type === "close") return { ...s, connected: false, denied: a.code === 4403, levels: {} };
  const ev = a.ev;
  switch (ev.type) {
    case "snapshot":
      return {
        ...s, meeting: ev.meeting, utts: ev.utts, minutes: ev.minutes, stats: ev.stats, hints: ev.hints ?? [], pauses: ev.pauses,
        clockBase: ev.clock, clockAt: performance.now(), running: ev.running,
      };
    case "meeting":
      return { ...s, meeting: ev.meeting, clockBase: ev.clock, clockAt: performance.now(), running: ev.running, pauses: ev.pauses ?? s.pauses };
    case "utt": {
      const i = s.utts.findIndex((u) => u.id === ev.id);
      if (ev.final && !ev.committed) return i < 0 ? s : { ...s, utts: s.utts.filter((u) => u.id !== ev.id) };
      const utts = i < 0 ? [...s.utts, ev] : s.utts.map((u, j) => (j === i ? ev : u));
      return { ...s, utts };
    }
    case "utt_deleted":
      return { ...s, utts: s.utts.filter((u) => u.id !== ev.id), hints: s.hints.filter((h) => h.trigger !== ev.id && h.jump !== ev.id) };
    case "hint":
      return { ...s, hints: [...s.hints, ev.hint] };
    case "minutes":
      return { ...s, minutes: ev.minutes };
    case "stats":
      return { ...s, stats: ev.stats };
    case "level":
      return { ...s, levels: { ...s.levels, [ev.speaker]: ev.rms } };
    default:
      return s;
  }
}

export function useMeeting(path: string | null): MeetingState {
  const [state, dispatch] = useReducer(reduce, initial);
  useEffect(() => {
    if (!path) return;
    let ws: WebSocket | null = null;
    let stopped = false;
    let timer: number | undefined;
    const connect = () => {
      ws = new WebSocket(wsUrl(path));
      ws.onopen = () => dispatch({ type: "open" });
      ws.onmessage = (m) => dispatch({ type: "event", ev: JSON.parse(m.data) });
      ws.onclose = (e) => {
        dispatch({ type: "close", code: e.code });
        if (!stopped && e.code !== 4403) timer = window.setTimeout(connect, 1000);
      };
    };
    connect();
    return () => { stopped = true; window.clearTimeout(timer); ws?.close(); };
  }, [path]);
  return state;
}

/** 會議計時：收音中每 0.5 秒更新，暫停時停在伺服器回報的時間。 */
export function meetingClock(s: MeetingState): number {
  return s.clockBase + (s.running ? (performance.now() - s.clockAt) / 1000 : 0);
}
