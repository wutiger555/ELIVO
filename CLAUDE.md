# CLAUDE.md

ELIVO（意聯）是一個即時對談智慧產品：不用 bot 的 Mac app，之後搭配桌上型伴隨顯示器。它在會議中把當下說的話，與過去的決策、數字、文件連結起來；只在重要時才顯示簡短卡片，每張都附上來源。

專案目前在 Phase 0（驗證期）：repo 裡只有規劃文件，還沒有程式碼。

**目前的下一步**：見 `docs/08-handoff-local-dev.md`，在本地 Mac 上實測即時中英混說 ASR（Breeze-ASR-25 / Whisper），spike 放在 `spikes/asr-realtime/`。

## 文件位置
- `docs/01-research-report.md`：全盤調查與最終判斷。要改變產品方向前先讀這份。
- `docs/02-project-plan.md`：修訂版計劃、路線圖與關卡。
- `docs/03-technical-architecture.md`：架構、資料模型、surfacing policy。
- `docs/04-mvp-spec.md`：MVP 的 user stories 與驗收標準。
- `docs/adr/`：決策紀錄。有重大決策時新增一份 ADR。
- `docs/research/`：研究附錄，附來源連結。

## 慣例
- 所有文件使用繁體中文（台灣用語），技術名詞可保留英文。
- 產品硬性限制（見 ADR-0003）：
  - 不用客戶資料訓練模型。
  - 不做情緒辨識。
  - 預設不建立持久聲紋。
  - Phase 1 不做會議 bot。
  - 不以「隱形」、「不被發現」作為行銷訴求。
- AI 供應商一律放在抽象層後面（ADR-0002）。
