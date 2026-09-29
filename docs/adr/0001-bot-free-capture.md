# ADR-0001：以 bot-free 本機音訊擷取為主要路徑

- **狀態**：Accepted（2026-09-29）

## 背景
- Microsoft Teams 自 2026/8 起可由租戶全域自動封鎖外部 bot；Google Meet 將第三方 bot 標記為潛在風險。
- 多所大學與企業禁用 AI 筆記 bot，主因是 bot 會自動加入使用者未參加的會議。
- macOS 14.4+ 的 Core Audio process taps 可在不需螢幕錄影權限的情況下擷取系統音訊（Granola 模式）。

## 決策
Phase 1 以 macOS 本機擷取（mic + system audio tap）為唯一擷取方式；不開發會議 bot。Phase 3 視企業需求再加入官方整合（Zoom RTMS、Teams app）或 Recall.ai。

## 後果
- ✅ 無社交摩擦、不受平台封鎖、跨平台（Zoom/Teams/Meet/任何 app）。
- ✅ 聲道分離（我 vs 他人）免費獲得部分 diarization。
- ⚠️ 無法取得與會者真實身分（需使用者命名 speaker）。
- ⚠️ 告知責任落在使用者身上 → 產品必須提供告知工具（見 ADR-0003、`06-compliance-and-trust.md`）。
- ⚠️ 初期僅支援 macOS；Windows 需另行開發（WASAPI loopback）。
