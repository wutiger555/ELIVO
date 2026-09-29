# ADR-0004：Phase 1 技術棧

- **狀態**：Proposed（2026-09-29；待團隊組成後確認）

## 決策（提案）
| 層 | 選擇 |
|---|---|
| Desktop shell | Tauri 2 + React / TypeScript |
| Native helper | Swift（Core Audio taps、AEC、WhisperKit、MLX） |
| Realtime backend | Python 3.12 + FastAPI / asyncio WebSocket |
| DB | Postgres + pgvector（雲）／ SQLite + sqlite-vec + FTS5（本地） |
| 中文詞彙檢索 | app 端 jieba 斷詞 → `to_tsvector('simple', …)` |
| 繁簡轉換 | OpenCC `s2twp` |
| Cloud region | GCP asia-east1（台灣） |
| Observability | OpenTelemetry + 每張卡片完整 trace |

## 理由
- 擷取與本地 ML 無論如何必須是 Swift；UI 以 React 撰寫可與 Web / 第二螢幕 / Windows 共用。
- Tauri 安裝包 3–10MB、閒置記憶體低（會議中長時間常駐很重要）。
- Python 擁有最完整的語音 / NLP / 評測生態。

## 替代方案
- Electron + Swift helper（團隊純 JS 背景時）。
- 純 SwiftUI（最佳 macOS 體驗，但 UI 無法與 Web 共用）。
