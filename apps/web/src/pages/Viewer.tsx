// 第二螢幕（手機／iPad 掃 QR code 進來）：唯讀，只看配對的那一場會議。
import { RecCapsule, Titlebar } from "../components/Chrome";
import { timecode, useTick } from "../lib/format";
import { meetingClock, useMeeting } from "../lib/useMeeting";
import { LiveBody } from "./MeetingPage";

export function Viewer({ token }: { token: string }) {
  const s = useMeeting(`/ws/view?token=${encodeURIComponent(token)}`);
  const m = s.meeting;
  useTick(500, m?.status === "live");
  if (s.denied) {
    return (
      <div className="app">
        <Titlebar home={false} />
        <div className="viewer-denied panel">配對碼無效、已過期或已被撤銷。請在 Mac 上的會議畫面按「第二螢幕」重新產生 QR code。</div>
      </div>
    );
  }
  const state = !s.connected ? "offline" : m?.status === "live" ? "rec" : m?.status === "ending" ? "ending" : "paused";
  return (
    <div className="app">
      <Titlebar home={false}>
        <span className="crumb"><b>{m?.title ?? "連線中…"}</b></span>
        <div className="spacer" />
        {m && <RecCapsule state={state} clock={timecode(meetingClock(s))} />}
      </Titlebar>
      <LiveBody s={s} emptyMinutes="會中出現的決策、待辦、問題與數字會整理在這裡。" />
    </div>
  );
}
