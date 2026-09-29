# ELIVO 技術架構與可行性（v1）

> 狀態：Draft v1（2026-09-29）｜依據：[`research/B-technical-feasibility.md`](research/B-technical-feasibility.md)
> 本文件把原計劃書的五層架構落實為可實作的元件、資料流、延遲預算與成本模型。

---

## 1. 結論先講

| 問題 | 結論 | 信心 |
|---|---|---|
| 技術上做得出來嗎？ | **做得出來。** 所有基礎元件（串流 ASR、系統音訊擷取、LLM、embedding、向量檢索）都已商品化，不需要訓練自有模型。 | 高 |
| 最大技術風險？ | **zh-TW 中英混說的串流 ASR 品質**——市面上沒有公開、獨立的串流 benchmark，必須自建測試集驗證。 | 高 |
| 真正的技術難點（也是護城河）？ | **「何時該說話」的 surfacing policy + 跨會議的決策/承諾帳本（Decision Ledger）+ 指代消解（「上次那個方案」）。** | 高 |
| 能否不用會議 bot？ | **可以。** macOS 14.4+ Core Audio process taps 可無 bot 擷取系統音訊（Granola 模式）。Teams/Meet 正在封鎖第三方 bot，bot-free 是必要條件而非選項。 | 高 |
| 單位成本？ | 雲端精簡管線約 **US$0.34／會議小時**；高品質管線約 **US$0.8–1.1**；混合本地管線約 **US$0.18**。以每月 30 會議小時計，毛利可支撐 US$20–25 的 Pro 定價。 | 中 |
| 硬體可行嗎？ | 可行，但應延後。第一版硬體應是「**桌上型伴隨顯示器 + 麥克風陣列**」（thin client），而非獨立 AI 裝置。 | 中 |

---

## 2. 設計原則

1. **Bot-free first**：本機擷取音訊，不派 bot 進會議。降低社交摩擦與平台封鎖風險。
2. **Vendor-agnostic**：ASR、LLM、Embedding 全部走抽象層；價格每月在變（Deepgram 促銷價、Gemini 2027/1/1 漲價、Speechmatics 7 月降價）。
3. **Quiet by default**：預設 ambient（安靜累積），只有超過門檻才 promote。寧可漏報，不可亂報。
4. **Grounded or silent**：每張 insight card 必須附來源（哪場會議、哪份文件、哪一句）。沒有來源就不顯示。
5. **Privacy by architecture**：預設不存音訊；可選「Ephemeral mode」（會中顯示、會後不留逐字稿）；供應商一律簽 zero-retention；不以客戶資料訓練模型。
6. **Local-capable**：架構允許 ASR / 抽取 / 檢索在本機跑，為企業 on-prem 與隱私模式鋪路。

---

## 3. 系統總覽

```mermaid
flowchart LR
  subgraph Client["Mac App (Tauri + Swift helper)"]
    MIC[Mic + AEC] --> MIX
    SYS[System audio<br/>Core Audio tap] --> MIX
    MIX[Channel tagging<br/>me / others] --> UP[Audio uplink<br/>WebSocket]
    UI[Live UI<br/>Transcript | Context tray | Cards]
  end

  subgraph RT["Realtime Session Worker (Python)"]
    UP --> ASRGW[ASR Gateway<br/>vendor abstraction]
    ASRGW --> NORM[Normalizer<br/>OpenCC s2twp + glossary]
    NORM --> T1[Tier-1 Extractor<br/>rolling state, every final segment]
    T1 --> RET[Retrieval<br/>hybrid + rerank]
    RET --> POL[Surfacing Policy<br/>score + gating + rate limit]
    POL --> T2[Tier-2 Card Writer<br/>grounded, cited]
    T2 --> PUSH[Push to client]
    NORM --> PUSH
  end

  subgraph Mem["Memory"]
    PG[(Postgres + pgvector<br/>meetings, chunks,<br/>entities, decisions, actions)]
    CONN[Connectors<br/>Drive / Notion / M365]
  end

  RET <--> PG
  CONN --> PG
  PUSH --> UI
  RT -- post-meeting --> POST[Post-meeting pipeline<br/>summary, ledger update,<br/>offline re-diarization]
  POST --> PG
```

對應原計劃書五層：

| 原計劃 Layer | 實作元件 |
|---|---|
| ① Audio | Swift capture helper（mic + system audio taps + AEC + channel tagging） |
| ② Speech | ASR Gateway + Normalizer（簡轉繁、術語校正） |
| ③ Context | Tier-1 Extractor + Rolling Meeting State + Entity Registry |
| ④ Intelligence | Retrieval（hybrid）+ Decision Ledger（KG-lite）+ Surfacing Policy + Tier-2 Card Writer |
| ⑤ Experience | Mac App（左逐字稿／右 Context）→ 第二螢幕 Web 模式 → ELIVO Display |

---

## 4. 元件設計

### 4.1 Audio Capture（Swift helper）

- **系統音訊**：`AudioHardwareCreateProcessTap` + `CATapDescription` + aggregate device（macOS 14.4+），權限為較輕的「System Audio Recording Only」，不需要螢幕錄影權限。
- **麥克風**：`AVAudioEngine` voice processing（AEC），避免喇叭聲被重複收音。
- **Channel tagging**：遠端會議時 mic = 「我」、system audio = 「其他人」——免費獲得一半的 speaker 分離。
- **注意事項**：沒有公開 API 事先檢查 tap 權限（需設計 onboarding 引導）；AirPods 切換等裝置變更；兩路時鐘漂移與取樣率轉換。
- **瀏覽器版**：`getDisplayMedia` 分頁音訊可用於 Web demo（Chrome），但每次要手動勾選分享音訊，不適合作為主要產品。

### 4.2 ASR Gateway

統一介面：`start_stream(lang_hint, keyterms[]) → partial/final segments {text, t0, t1, speaker?, confidence, words[]}`。

**候選供應商（需自建 benchmark 決定）**：

| 供應商 | 串流價格 / hr | 中英混說 | 備註 |
|---|---|---|---|
| Soniox stt-rt | ~$0.12（含 diarization） | 自動切換 | 最便宜；繁中輸出待驗證 |
| ElevenLabs Scribe v2 RT | ~$0.39 | 自動切換 | CoSE-E 中英混說 batch 成績最佳之一 |
| Speechmatics `cmn_en` | ~$0.43 | 專用雙語包 | 即時 diarization |
| Deepgram Nova-3 zh-TW | ~$0.29–0.46 | **中文不在 multi 列表** | 延遲低、keyterm |
| AssemblyAI U3.6 Pro RT | ~$0.45 (+$0.12 diar.) | 有 Chinese | keyterms |
| **本地**：Breeze-ASR-25（MediaTek） | $0 | CSZS 中英混說 WER 13.0 vs Whisper 29.5 | WhisperKit CoreML / whisper.cpp 移植已有；需 chunked streaming |

**決策規則**：Sprint 0 建立 5–10 小時台灣真實商務會議測試集，量測 MER、code-switch 切換點錯誤率、術語召回率、首字延遲、final 延遲後選定主/備供應商（見 §9）。

### 4.3 Normalizer

- **OpenCC `s2twp`**：任何輸出簡體的引擎一律轉台灣正體 + 台灣用語。
- **Glossary 校正**：使用者/團隊術語表（客戶名、產品名、英文縮寫、人名）同時用於 ASR keyterm、LLM 校正、entity 種子——一份詞庫三種用途。
- **數字/日期正規化**：「八百二十毫秒」→ `820ms`、「下禮拜三」→ 絕對日期（依會議時間）。

### 4.4 Context Engine（Tier-1 Extractor）

- 觸發：每個 ASR final segment 或每 15–20 秒視窗。
- 輸入：**Rolling Meeting State**（精簡的 entity 表、進行中主題、候選決策、未答問題）+ 新文字。靜態 system prompt + glossary 放 cached prefix。
- 輸出（structured JSON）：

```json
{
  "entities": [{"type": "project|person|company|product|number|date", "surface": "API migration", "canonical_id": "proj_123?"}],
  "topic_shift": false,
  "decision_candidate": {"text": "改用方案 B", "confidence": 0.72},
  "action_item": {"text": "整理 benchmark", "owner": null, "due": null},
  "open_question": null,
  "references": [{"kind": "anaphora", "surface": "上次那個方案", "type_hint": "proposal"}],
  "retrieval_queries": ["API migration 方案 決策"],
  "salience": 0.64
}
```

- 模型：便宜快速模型（GPT-5-nano / Gemini Flash-Lite / Claude Haiku 4.5 等候選），隱私模式用本地 Qwen3-4B（MLX）。

### 4.5 Memory：Decision Ledger（KG-lite）

不一開始就上 GraphRAG。先用 Postgres 關聯表 + 時間有效區間：

```text
meetings(id, title, started_at, participants[], series_id, source)
utterances(id, meeting_id, t0, t1, speaker_label, text, tokens_jieba)
chunks(id, source_type[meeting|doc|note], source_id, text, tokens_jieba, embedding vector)
entities(id, type, canonical_name, aliases[], workspace_id)
entity_mentions(entity_id, utterance_id|chunk_id)
decisions(id, meeting_id, entity_id?, statement, rationale, valid_from, valid_to, superseded_by, evidence_utterance_ids[])
action_items(id, meeting_id, text, owner_entity_id?, due_date?, status, evidence_utterance_ids[])
facts(id, entity_id, key, value, unit, as_of, source_ref)      -- 例：報價、benchmark 數字
cards(id, meeting_id, type, payload, score, shown_at, user_feedback[pin|dismiss|expand|none])
```

- `decisions.valid_to / superseded_by` 讓「這與 8/12 的決策不同」成為一個 SQL 問題，而不是 LLM 幻想。
- `facts` 支援數字比對（「今天說的成本與上次提案差 18%」）。
- 只有當多跳查詢被證明必要時，才導入 Graphiti/Zep 類 temporal KG。

### 4.6 Retrieval

- **Hybrid**：pgvector（dense）+ 詞彙檢索（**app 端 jieba 斷詞後存 `to_tsvector('simple', …)`**，避開 CJK 2 字詞在 trigram 下搜不到的陷阱）→ RRF 融合 → reranker。
- **Embedding 候選**：Qwen3-Embedding（本地/自架）、Voyage-4、BGE-M3；以自有中英混合文件做小型評測後決定。
- **Reranker**：Voyage rerank-2.5（便宜）或 Qwen3-Reranker（自架）。
- **指代消解「上次那個方案」**：
  1. 時間錨點：同 series 的上一場，或參與者重疊最高的最近會議（fallback 14 天）。
  2. 類型錨點：「方案」→ {proposal, option, quote, plan}。
  3. 從錨定會議的 decisions/facts 取候選 + hybrid search。
  4. LLM 依當下語境排序。
  5. Top-1 領先幅度夠大才顯示，否則在 tray 顯示安靜的「你是指 A / B？」。
- **Connectors**：自建同步 + 索引（Drive `changes.list`、Graph delta、Notion API）以滿足 <3 秒預算；MCP 只用於會中「按需」查詢，並將 ELIVO 自身暴露為 MCP server（讓 Claude / ChatGPT / Copilot 查詢會議記憶＝低成本通路）。

### 4.7 Surfacing Policy（產品核心）

```text
score = relevance × novelty × confidence × actionability − interruption_cost(context)
```

| 因子 | 計算方式 |
|---|---|
| relevance | reranker 分數（當下視窗 vs 候選資訊） |
| novelty | 1 − max cos(已顯示卡片、本場已說過的內容) |
| confidence | 抽取器自評 × 使用者回饋校準 × 關鍵詞 ASR 信心 |
| actionability | 卡片類型權重（矛盾 > 數字差異 > 無 owner > 相關文件） |
| interruption_cost | 使用者正在說話時升高；只在 turn boundary（VAD 靜音 >700ms 或換人）顯示；近 N 分鐘已顯示卡數呈指數加權；投影/分享螢幕時→無限大 |

**硬性限制**：token bucket（例：≤1 張 promoted card / 2 分鐘、≤8 張 / 小時）；同一主題 10 分鐘內不重複；Focus/Presenting 模式全靜音。

**兩級顯示**：
- **Ambient tray**：低顯著度資訊安靜累積（相關文件、實體卡）。
- **Promoted card**：超過門檻才高亮（**永不發聲**）。

**學習**：以 pin / dismiss / expand / 無互動作為隱式回饋，逐使用者調整門檻。

### 4.8 Insight 類型（MVP 範圍）

| 類型 | 觸發條件 | 依賴資料 | MVP |
|---|---|---|---|
| **Previous Decision** | 提及的實體在 ledger 中有有效決策 | decisions | ✅ MVP2 |
| **Decision Conflict** | 當前 decision_candidate 與有效決策語意衝突 | decisions + LLM 判斷 | ✅ MVP3 |
| **Number Drift** | 當前數字與 facts 中同 key 的值差異 > 閾值 | facts | ✅ MVP3 |
| **Related Document** | 高 relevance 文件 chunk | chunks | ✅ MVP2 |
| **Unowned Action** | action_item 無 owner 且會議接近尾聲/話題轉換 | 本場 state | ✅ MVP1 |
| **Open Question Reminder** | 問題被提出後未回答且話題已轉換 | 本場 state | ✅ MVP1 |
| **Stale Reference** | 引用的文件在上次會議後被修改 | Drive/Notion metadata | Phase 3 |
| Sentiment / emotion | — | — | ❌ **不做**（EU AI Act 禁止職場情緒辨識；亦違反品牌「安靜」原則） |

### 4.9 Post-meeting Pipeline

- 摘要、Key Decisions、Action Items（owner/deadline）、Open Questions、References。
- **更新 Decision Ledger**：新決策寫入並將被取代的決策 `valid_to` 關閉——這是讓下一場會議變聰明的關鍵步驟。
- 離線 re-diarization（pyannote）修正會中暫定的 speaker 標籤。
- 使用者確認/修正決策（human-in-the-loop，提升 ledger 品質）。

---

## 5. 延遲預算（目標：觸發語句後 3–5 秒內出卡）

| 階段 | 預算 |
|---|---|
| 音訊 → ASR partial | 0.1–0.3 s |
| ASR final（停頓後） | 0.3–1.0 s |
| Tier-1 抽取（~150 output tokens） | 0.5–1.5 s |
| Retrieval（embed + hybrid + rerank） | 0.1–0.4 s |
| Tier-2 卡片生成（串流） | 1–2 s |
| 等待 turn boundary（刻意） | 0–3 s |

> 逐字稿顯示延遲目標 <1 s（partial）；卡片延遲 P50 <4 s、P95 <8 s。卡片「晚一點但正確」優於「快但錯」。

---

## 6. 單位經濟（每會議小時）

| 管線 | 組成 | US$/會議小時 | US$/使用者·月（30 會議小時） |
|---|---|---|---|
| A. 雲端精簡 | Soniox + nano 級抽取 + Haiku 級卡片 + Sonnet 級摘要 + rerank + infra | ≈ 0.34 | ≈ 10 |
| B. 雲端高品質 | Speechmatics/Scribe + Haiku 抽取 + Sonnet 卡片/摘要 + Cohere rerank | ≈ 0.80–1.10 | ≈ 24–33 |
| C. Hyperscaler | Azure（含 diarization + LID）+ mini + Sonnet | ≈ 2.10 | ≈ 63 |
| D. 混合本地 | 本機 ASR（Breeze/WhisperKit）+ 本機 MLX 抽取 + 雲端卡片/摘要 | ≈ 0.18 | ≈ 5 |

**含意**：
- Pro 定價 US$20–25 在管線 A/D 下有 55–80% 毛利；管線 B 需要用量上限或 credit 制。
- **避免管線 C**（除非企業指定雲）。
- 重度使用者（>60 hr/月）需 fair-use 或 credit 計量——Zoom、Gong、Fireflies、Supernormal 皆已轉向 credit。

---

## 7. 技術選型（Phase 1，1–3 人團隊）

| 層 | 選擇 | 理由 |
|---|---|---|
| Desktop shell | **Tauri 2 + React/TypeScript** | 小（3–10MB）、UI 可與 Web / 第二螢幕 / 未來 Windows 共用 |
| Native helper | **Swift**（sidecar 或 `swift-rs` plugin） | Core Audio taps、AEC、WhisperKit、MLX 都必須是 Swift |
| Realtime backend | **Python 3.12 + FastAPI/asyncio WebSocket** | AI/NLP 生態系（jieba、OpenCC、pyannote、評測工具、各家 SDK） |
| 佇列（擴展時） | Redis Streams / NATS | session worker 解耦 |
| DB | **Postgres + pgvector**（Neon/Supabase/Cloud SQL） | 一個資料庫涵蓋 app data、權限、向量、全文 |
| 本地儲存 | SQLite + sqlite-vec + FTS5 | 隱私模式 / 離線 |
| 雲區域 | **GCP asia-east1（彰化）** | 台灣資料落地需求 |
| 可觀測性 | OpenTelemetry + 每張卡片的完整 trace（觸發語句→查詢→候選→分數→結果） | surfacing policy 除錯必備 |

替代方案：若團隊純 JS 背景，Electron 亦可（Granola 據報採 Electron + Swift helper）；純 SwiftUI 體驗最好但 UI 無法與 Web 共用。

---

## 8. 評測框架（Eval Harness）——從第一週就建立

「有多少 insight 真正被認為有幫助」必須可離線重現，否則 surfacing policy 無法迭代。

1. **會議語料庫**：取得同意的真實會議錄音（內部會議、友好顧問/業務的會議），加上相關文件。
2. **Gold 標註**：
   - ASR：人工校對逐字稿（含中英切換點、術語）。
   - Context：每場標註 decisions、action items、numbers、指代（「上次那個」→ 真正指涉）。
   - Insight：標註員在時間軸上標出「此刻若有卡片會有幫助」的時點與內容（**理想卡片集**）。
3. **Replay 模擬器**：把錄音以實時速度（或加速）送入管線，記錄每張卡片與時間戳。
4. **指標**：

| 指標 | 定義 | Phase 1 目標 |
|---|---|---|
| MER（mixed error rate） | 中文算字、英文算詞 | ≤ 12%（遠端）、≤ 18%（會議室） |
| Term recall | 術語表中詞被正確辨識比例 | ≥ 90% |
| Partial latency P50 | 語音→逐字稿顯示 | < 1 s |
| Card latency P50 / P95 | 觸發語句→卡片 | < 4 s / < 8 s |
| **Insight precision** | 顯示卡片中被標註/使用者認定有用的比例 | **≥ 60%**（MVP）→ 75% |
| Insight recall | 理想卡片中被系統產出的比例 | ≥ 30%（刻意偏保守） |
| **False interruption rate** | 每小時被 dismiss 或評為干擾的 promoted card 數 | **≤ 1 / hr** |
| Decision extraction F1 | 會後決策 vs gold | ≥ 0.7 |
| Anaphora resolution acc. | 「上次那個方案」解析正確率 | ≥ 70% |

---

## 9. 技術 Spike 清單（Sprint 0–1，先降風險）

| # | Spike | 產出 | 時間 |
|---|---|---|---|
| S1 | zh-TW 中英混說 ASR bake-off（5 家雲端 + Breeze 本地） | 評測報告 + 主/備供應商決策（ADR） | 2–3 週 |
| S2 | macOS Core Audio tap + mic AEC + channel tagging 原型 | 可錄 Zoom/Meet/Teams 的 CLI | 1 週 |
| S3 | Tier-1 抽取 prompt + JSON schema，在 10 場會議上測 decision/action F1 | 抽取器 v0 + 分數 | 1–2 週 |
| S4 | 「上次那個方案」指代消解 on 小型 ledger | 準確率報告 | 1 週 |
| S5 | Replay 模擬器 + 卡片 trace | eval harness v0 | 1–2 週 |
| S6 | 本地管線可行性（M 系列 16GB：Breeze + Qwen3-4B 同時跑的溫度/電量） | 效能報告 | 1 週 |

---

## 10. Phase 2 硬體技術路線（延後，僅預先規劃）

| 路線 | 內容 | 預估 BOM | 評估 |
|---|---|---|---|
| **0. 先用現成裝置** | iPad / 舊手機 / 小螢幕當「ELIVO 第二螢幕」（Web 模式） | $0 | **最先做**：用來驗證「實體 presence」假設 |
| 1. Thin client | ESP32-S3 + XVF3800 4-mic 陣列 + 7.5" 彩色電子紙或 LCD，推論在 Mac/雲端 | ~$45–90 | **第一款硬體首選**；預認證模組降低 FCC/NCC 成本 |
| 2. Edge 推論 | RK3588（6 TOPS NPU）跑 SenseVoice/Paraformer + 小 LLM | ~$150–250 | 企業地端/離線版 |
| 3. Android 面板 | ODM 現成 RK3566 面板裝 App | ~$60–150 | 最快上市但差異化弱 |

- 電子紙契合「安靜、不打擾」品牌；E Ink 元太為台灣廠商，具在地供應鏈優勢。
- XVF3800 的 DoA（聲源方向）可大幅改善會議室 diarization。
- 認證：FCC（預認證模組）約 $3k–8k、NCC 數萬至 NT$10 萬+；v1 不放電池（避開 UN38.3）。
- 教訓：Humane/Rabbit 失敗於「取代手機」；Plaud 成功於「只做一件事＋訂閱」。**ELIVO Display 是軟體的配件，不是獨立 AI。**
