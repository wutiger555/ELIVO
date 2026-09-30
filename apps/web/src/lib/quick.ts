// 快速錄音（像語音備忘錄）：按一下就開始，名稱、分類、標籤錄完再補。
// 音源沿用上次在「新會議」設定的（存在這台瀏覽器）；沒有設定過就用預設麥克風。
import { api, type Space } from "./api";

type Source = { speaker: string; device: number | string | null };
const KEY = "elivo.sources";

// 內容要和實際做法一致：錄音與逐字稿在本機，會議記錄會把逐字稿送到 AI 服務整理
export const NOTICE = "本場會議使用 ELIVO 錄音並在本機產生逐字稿，錄音與逐字稿保存在我的電腦；會議記錄由 AI 服務整理逐字稿產生，僅供整理會議內容。不做情緒分析、不建立聲紋。如果不希望被記錄，請隨時告訴我，我會暫停或刪除。";

export function saveSources(sources: Source[]) {
  try { localStorage.setItem(KEY, JSON.stringify(sources)); } catch { /* 無痕模式等情況：下次用預設 */ }
}

function lastSources(): Source[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(v) && v.length) return v;
  } catch { /* 用預設 */ }
  return [{ speaker: "我", device: null }];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 建立並開始一場會議，回傳會議 id。space／series：在會議庫正在看的分類。 */
export async function quickRecord(space?: Space, seriesId?: string): Promise<string> {
  const d = new Date();
  const m = await api.createMeeting({
    title: `錄音 ${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    space_id: space?.id ?? null, series_id: seriesId ?? null, mode: "standard", ai_policy: "economy",
    keep_audio: true, glossary: space?.glossary ?? "", sources: lastSources(), tags: [],
  });
  await api.action(m.id, "start");
  return m.id;
}

/** 預設名稱（還沒補上正式名稱）。 */
export const untitled = (title: string) => /^錄音 \d+\/\d+ \d\d:\d\d$/.test(title);
