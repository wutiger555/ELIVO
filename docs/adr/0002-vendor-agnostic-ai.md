# ADR-0002：ASR / LLM / Embedding 全部走供應商抽象層

- **狀態**：Accepted（2026-09-29）

## 背景
AI 供應商價格與品質每月變動（Deepgram 促銷價、Speechmatics 2026/7 降價、Gemini Flash 2027/1/1 價格加倍），且 zh-TW 中英混說品質無公開串流 benchmark，最佳供應商可能隨時間改變。企業客戶可能指定供應商或要求地端。

## 決策
- ASR Gateway、LLM Router、Embedding Provider 皆為內部介面；業務邏輯不得直接呼叫供應商 SDK。
- 每個供應商實作需通過 eval harness 的同一組測試。
- 設定檔層級可切換（per-workspace），支援本地引擎（Breeze/WhisperKit、MLX）。

## 後果
- ✅ 可依成本/品質/合規快速切換；支援地端版本。
- ⚠️ 無法深度使用單一供應商特有功能（需以 capability flag 處理）。
