# ELIVO｜意聯

**From Conversation to Understanding.**

ELIVO 在會議進行中，安靜地把「現在說的話」和「過去的決策、數字、文件」連起來——只在真正重要時提醒你，而且每一則都附來源。

*Listen less like a recorder. Understand more like a participant.*

---

## 專案狀態

**Phase 0：驗證期**（2026/10–11）。目前 repo 只有計劃文件，還沒有程式碼。

| 階段 | 期間 | 目標 | 狀態 |
|---|---|---|---|
| Phase 0 驗證 | 2026/10–11 | 客戶訪談、Wizard-of-Oz、ASR bake-off、品牌風險 | 🟡 進行中 |
| Phase 1 軟體 MVP | 2026/12–2027/5 | MVP1 Live → MVP2 Memory → MVP3 Surface | ⚪ |
| Phase 2 團隊與硬體 | 2027/6–11 | Team workspace、Connectors、SOC 2、Display EVT、Seed | ⚪ |
| Phase 3 平台與企業 | 2027/12– | 地端部署、平台整合、日本市場 | ⚪ |

## 文件導覽

| 文件 | 內容 |
|---|---|
| [`docs/00-original-concept.md`](docs/00-original-concept.md) | 創辦人原始計劃書（基準版） |
| [`docs/01-research-report.md`](docs/01-research-report.md) | **全盤調查報告**：市場、競品、技術、法規、硬體、商業模式、品牌；逐條檢驗原計劃的假設；最終判斷 |
| [`docs/02-project-plan.md`](docs/02-project-plan.md) | **修訂版專案計劃**：定位、灘頭市場、路線圖與關卡、團隊、預算、資金、定價、指標、近期行動 |
| [`docs/03-technical-architecture.md`](docs/03-technical-architecture.md) | 技術架構：元件、資料模型、surfacing policy、延遲預算、單位成本、eval harness、技術 spike |
| [`docs/04-mvp-spec.md`](docs/04-mvp-spec.md) | MVP1–3 產品規格：user stories、驗收標準、UI、卡片規格、埋點、非目標 |
| [`docs/05-validation-plan.md`](docs/05-validation-plan.md) | Phase 0 八週驗證計畫：訪談腳本、Wizard-of-Oz、ASR bake-off、Gate 0 決策表 |
| [`docs/06-compliance-and-trust.md`](docs/06-compliance-and-trust.md) | 合規與信任設計清單（台灣、美國、EU、日本） |
| [`docs/07-risk-register.md`](docs/07-risk-register.md) | 風險登記表 |
| [`docs/08-handoff-local-dev.md`](docs/08-handoff-local-dev.md) | **目前的下一步**：本地 Mac 即時 ASR spike（硬體判斷、任務、產出） |
| [`docs/adr/`](docs/adr/) | 架構與產品決策紀錄 |
| [`docs/research/`](docs/research/) | 研究附錄（競品與市場、技術可行性、法規與 GTM，含來源連結） |

## 核心判斷（摘自調查報告）

1. **會議筆記是紅海，而且正在被平台免費化**，所以 ELIVO 不做「更好的 AI 筆記」。
2. **空白地帶**：使用者不必開口，系統就主動把當下的話與過去的決策、數字、文件對照，並附上來源。
3. **護城河**：跨會議的 **Decision Ledger**，加上判斷「何時該說話」的 surfacing policy。
4. **灘頭市場**：台灣 B2B 顧問、客戶經理與 PM（多客戶、中英混說、遠端加面對面）。
5. **信任從第一天做起**：不用客戶資料訓練、讓與會者看得到告知、Ephemeral mode、不建聲紋、不做情緒辨識。
6. **硬體延後**：先用 iPad 當第二螢幕，驗證「實體存在感」的價值。

## 本機執行（產品原型）

```bash
apps/capture-mac/systap/build.sh                      # 系統音訊擷取（Core Audio process tap）
cd apps/web && npm install && npm run build && cd -   # 網頁
cd services/realtime && ~/.venvs/elivo-asr/bin/python -m elivo   # http://localhost:8765
```

環境準備（模型、Python venv、LLM 金鑰）見 [`services/realtime/README.md`](services/realtime/README.md) 與 [`spikes/asr-realtime/README.md`](spikes/asr-realtime/README.md)。資料都存在 `~/ELIVO-data/`，不在 repo 裡。

## 程式碼結構（部分已建立）

```text
apps/
  desktop/        # （未建立）Tauri 2 + React UI
  capture-mac/    # ✅ systap：Core Audio process tap；之後加 AEC、本地 ASR/LLM
  web/            # ✅ React 網頁：會議庫、新會議、即時會議、會後確認、第二螢幕
services/
  realtime/       # ✅ Python：擷取、ASR、會中持續修正的會議記錄、SQLite、API；之後加 retrieval、surfacing policy
  ingest/         # 文件 / 逐字稿匯入、connectors
packages/
  schema/         # 卡片、事件、ledger 共用型別
eval/
  harness/        # replay 模擬器、指標計算
  datasets/       # （不入版控）gold 標註與測試音檔
docs/
```
