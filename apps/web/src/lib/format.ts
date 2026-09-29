import { useEffect, useState } from "react";

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export const timecode = (s: number | null | undefined) => {
  const v = Math.max(0, s ?? 0);
  return `${pad(v / 3600)}:${pad((v % 3600) / 60)}:${pad(v % 60)}`;
};

export const duration = (s: number) => {
  const m = Math.round(s / 60);
  return m < 1 ? "< 1 分鐘" : m < 60 ? `${m} 分鐘` : `${Math.floor(m / 60)} 小時 ${m % 60} 分`;
};

export const dateTime = (epoch: number | null | undefined) => {
  if (!epoch) return "–";
  const d = new Date(epoch * 1000);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "尚未開始", live: "收音中", paused: "已暫停", ending: "整理中", ended: "待確認", confirmed: "已確認", interrupted: "未正常結束",
};

/** 每隔 ms 觸發重新渲染（計時器用）。 */
export function useTick(ms: number, active = true) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => set((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
}

/** 極簡 hash 路由：#/、#/new?space=…、#/m/:id、#/view/:token */
export function useRoute() {
  const [hash, setHash] = useState(location.hash || "#/");
  useEffect(() => {
    const on = () => setHash(location.hash || "#/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const [path, query = ""] = hash.slice(1).split("?");
  return { parts: path.split("/").filter(Boolean), query: new URLSearchParams(query) };
}

export const go = (to: string) => { location.hash = to; };
