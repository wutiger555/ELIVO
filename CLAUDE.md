# CLAUDE.md

ELIVO（意聯）是一個即時對談智慧產品：不用 bot 的 Mac app，之後搭配桌上型伴隨顯示器。它在會議中把當下說的話，與過去的決策、數字、文件連結起來；只在重要時才顯示簡短卡片，每張都附上來源。

專案目前在 Phase 0（驗證期）：repo 裡只有規劃文件，還沒有程式碼。

**目前進度**：ASR spike 已完成（`spikes/asr-realtime/RESULTS.md`、ADR-0006 草案）。產品原型在 `services/realtime/`（Python）與 `apps/web/`（React），啟動方式見 README。
**下一步**：④「前面說過」提示與出卡頻率控制 → ⑤ 跨會議 Decision Ledger；另待研究說話者分辨（diarization，須符合 ADR-0003），以及產品發佈與商業模式（模型下載、LLM 金鑰、訂閱）。

## 文件位置
- `docs/01-research-report.md`：全盤調查與最終判斷。要改變產品方向前先讀這份。
- `docs/02-project-plan.md`：修訂版計劃、路線圖與關卡。
- `docs/03-technical-architecture.md`：架構、資料模型、surfacing policy。
- `docs/04-mvp-spec.md`：MVP 的 user stories 與驗收標準。
- `docs/adr/`：決策紀錄。有重大決策時新增一份 ADR。
- `docs/research/`：研究附錄，附來源連結。
- `services/realtime/`：即時服務（擷取、ASR、會議記錄、SQLite、API），測試用 `pytest`。
- `apps/web/`：網頁介面（React＋TypeScript＋Vite，使用 `design/` 元件）。
- `apps/capture-mac/systap/`：系統音訊擷取（Swift）。
- 資料與模型都在 repo 外：`~/ELIVO-data/`、`~/.cache/whisper.cpp/`。
- `design/`：設計系統（從 Claude Design 專案「ELIVO Design System」同步）。做任何 UI 前先讀 `design/readme.md`（品牌、文案、視覺規則）；tokens 在 `design/tokens/`，React 元件在 `design/components/`，Mac app 點擊原型在 `design/ui_kits/mac-app/`。

## 慣例
- 所有文件使用繁體中文（台灣用語），技術名詞可保留英文。
- 產品硬性限制（見 ADR-0003）：
  - 不用客戶資料訓練模型。
  - 不做情緒辨識。
  - 預設不建立持久聲紋。
  - Phase 1 不做會議 bot。
  - 不以「隱形」、「不被發現」作為行銷訴求。
- AI 供應商一律放在抽象層後面（ADR-0002）。
