import type { ReactNode } from "react";
import { go } from "../lib/format";

export function Titlebar({ children, home = true }: { children?: ReactNode; home?: boolean }) {
  return (
    <header className="titlebar">
      {home
        ? <button type="button" className="wordmark" onClick={() => go("/")}>ELIVO <span>｜意聯</span></button>
        : <div className="wordmark">ELIVO <span>｜意聯</span></div>}
      {children}
    </header>
  );
}

export function RecCapsule({ state, clock }: { state: "rec" | "paused" | "ending" | "offline" | "idle"; clock: string }) {
  const label = { rec: "REC", paused: "PAUSED", ending: "整理中", offline: "OFFLINE", idle: "READY" }[state];
  return (
    <div className={`rec${state === "rec" ? " on" : ""}`}>
      <span className="dot" /><span className="state">{label}</span><span className="clock">{clock}</span>
    </div>
  );
}

export function Levels({ levels, speakers }: { levels: Record<string, number>; speakers: string[] }) {
  return (
    <div className="levels" aria-label="收音音量">
      {speakers.map((s) => (
        <span className="level" key={s}>
          {s}
          <span className="bar"><i style={{ width: `${Math.min(100, Math.sqrt(levels[s] ?? 0) * 260)}%` }} /></span>
        </span>
      ))}
    </div>
  );
}
