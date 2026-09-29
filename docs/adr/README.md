# Architecture / Product Decision Records（ADR）

記錄重要決策與其理由。格式：背景 → 決策 → 後果 → 狀態。

| # | 決策 | 狀態 |
|---|---|---|
| [0001](0001-bot-free-capture.md) | 以 bot-free 本機音訊擷取為主要路徑 | Accepted |
| [0002](0002-vendor-agnostic-ai.md) | ASR / LLM / Embedding 全部走供應商抽象層 | Accepted |
| [0003](0003-no-emotion-no-voiceprint.md) | 不做情緒辨識；預設不建立聲紋；不以客戶資料訓練 | Accepted |
| [0004](0004-phase1-stack.md) | Phase 1 技術棧：Tauri + React / Swift helper / Python realtime / Postgres | Proposed |
| [0005](0005-kg-lite-ledger.md) | Decision Ledger 先用 Postgres 關聯表（KG-lite），不先上 GraphRAG | Accepted |
| [0006](0006-asr-selection.md) | 主 / 備 ASR 選擇：本地 Breeze-ASR-25 q8（whisper.cpp）為主，large-v3-turbo／Soniox 為備 | Proposed（待真實錄音 MER） |
