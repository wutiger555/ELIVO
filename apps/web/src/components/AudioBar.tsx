// 會後回放：這場保存的錄音（「我」與「他人」各一軌）。點逐字稿的時間碼會切到那位說話者的音軌，從那一句開始播。
import { useEffect, useRef, useState } from "react";
import { Icon } from "@design/components/core/Icon.jsx";
import { IconButton } from "@design/components/core/IconButton.jsx";
import { SegmentedControl } from "@design/components/forms/SegmentedControl.jsx";
import { api, type AudioFile } from "../lib/api";
import { bytes } from "../lib/format";
import { AskDialog } from "./Dialogs";

export type Seek = { t: number; speaker: string; n: number };
const LEAD = 1.5;   // 一句的時間是第一次出現字的時間，約比開口晚 1–2 秒

export function AudioBar({ meetingId, seek }: { meetingId: string; seek: Seek | null }) {
  const [files, setFiles] = useState<AudioFile[] | null>(null);
  const [slug, setSlug] = useState("");
  const [asking, setAsking] = useState(false);
  const el = useRef<HTMLAudioElement>(null);
  const pending = useRef<number | null>(null);

  useEffect(() => {
    api.audio(meetingId).then((f) => { setFiles(f); setSlug(f[0]?.slug ?? ""); }).catch(() => setFiles([]));
  }, [meetingId]);

  const play = (t: number) => {
    const a = el.current;
    if (!a) return;
    a.currentTime = Math.max(0, t - LEAD);
    a.play().catch(() => { /* 瀏覽器擋自動播放時，使用者再按一次播放即可 */ });
  };
  useEffect(() => {
    if (!seek || !files?.length) return;
    const f = files.find((x) => x.speaker === seek.speaker) ?? files[0];
    if (f.slug === slug && el.current && el.current.readyState >= 1) play(seek.t);
    else { pending.current = seek.t; setSlug(f.slug); }
  }, [seek]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!files?.length) return null;
  const file = files.find((f) => f.slug === slug) ?? files[0];
  return (
    <div className="audio-bar panel">
      <Icon name="audio-lines" size={16} />
      {files.length > 1 && (
        <SegmentedControl size="sm" value={file.slug} onChange={setSlug} options={files.map((f) => ({ value: f.slug, label: f.speaker }))} />
      )}
      <audio ref={el} src={file.url} controls preload="metadata"
        onLoadedMetadata={() => { if (pending.current != null) { play(pending.current); pending.current = null; } }} />
      <span className="muted">{bytes(files.reduce((n, f) => n + f.bytes, 0))}</span>
      <IconButton icon="trash-2" label="刪除這場的錄音" size="sm" variant="ghost" onClick={() => setAsking(true)} />
      {asking && (
        <AskDialog title="刪除這場的錄音？" description="逐字稿與會議記錄會保留。刪除後無法復原。" confirm="刪除錄音" danger
          onConfirm={async () => { await api.deleteAudio(meetingId); setFiles([]); setAsking(false); }} onClose={() => setAsking(false)} />
      )}
    </div>
  );
}
