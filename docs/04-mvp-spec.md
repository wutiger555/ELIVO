# ELIVO MVP 產品規格（v1）

> 狀態：Draft v1（2026-09-29）｜範圍：Phase 1（MVP1–MVP3）
> 相關：[`02-project-plan.md`](02-project-plan.md)｜[`03-technical-architecture.md`](03-technical-architecture.md)

---

## 1. 產品原則（每個設計決策都要通過）

1. **安靜**：預設不打擾，永遠不發聲；只在 turn boundary（說話告一段落時）出現。
2. **有來源**：每張卡片都能一鍵看到「依據哪一句話、哪場會議、哪份文件」。
3. **可解釋**：「為什麼現在出現？」可以點開看。
4. **看得到的誠實**：其他與會者知道 ELIVO 在運作；絕不宣傳「隱形」。
5. **零歷史也有用**：第一場會議就要讓使用者覺得值得。
6. **使用者擁有資料**：不訓練、可刪除、可選擇不保留（Ephemeral）。

---

## 2. 核心使用流程

```text
[會前] 行事曆事件 → 選擇 Space（客戶/專案）→ 自動會前簡報（上次決策、待辦、數字）
   ↓
[開始] 一鍵開始 / 偵測到 Zoom·Teams·Meet 音訊時提示 → 告知（自動貼上告知文字/顯示徽章）
   ↓
[會中] 左：即時逐字稿 ｜ 右：Ambient tray（安靜累積）+ Promoted card（高價值才高亮）
   ↓
[結束] 30 秒確認：「這 3 個決策 / 5 個待辦對嗎？」→ 寫入 Decision Ledger
   ↓
[會後] 摘要、決策、待辦（owner/due）、未決問題、參考資料 → 一鍵起草追蹤信
```

---

## 3. UI 架構（Mac App／第二螢幕）

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ● REC  Acme｜API Migration Weekly      00:23:41   [Focus] [Ephemeral] ⏸ │
├───────────────────────────────────────┬─────────────────────────────────┤
│ LIVE CONVERSATION                     │ CONTEXT                         │
│                                       │                                 │
│ 我   我們上次討論的 API migration……   │ ┌─ PREVIOUS DECISION ─────────┐ │
│ 對方 對，當時最大的問題其實是          │ │ 8/12 決定採用方案 B          │ │
│      latency，p95 大概八百多……         │ │ （Gateway 分階段切換）        │ │
│ 對方 所以這次我們想直接全部切過去      │ │ 來源：8/12 週會 00:31:05 ↗   │ │
│                                       │ └──────────────────────────────┘ │
│                                       │ ┌─ ⚠ DECISION CONFLICT ───────┐ │
│                                       │ │ 「全部切過去」與 8/12 決定的  │ │
│                                       │ │  分階段方案 B 不同           │ │
│                                       │ │ [看依據] [Pin] [略過]         │ │
│                                       │ └──────────────────────────────┘ │
│                                       │ ── Ambient ──────────────────── │
│                                       │ 📄 API Migration Proposal v2    │
│                                       │ #  Benchmark p95 820ms (7/30)   │
│                                       │ ? 未回答：rollback 誰負責？     │
└───────────────────────────────────────┴─────────────────────────────────┘
```

- **Focus 模式**：只保留逐字稿；卡片進 tray，但不高亮。
- **Presenting 偵測**：分享螢幕時，ELIVO 視窗自動隱藏或移到第二螢幕，卡片暫停 promote。
- **第二螢幕模式**：同一個 UI 用 Web 投到 iPad 或舊手機（區網 QR code 配對）。這也是 ELIVO Display 的前身。

---

## 4. 功能範圍

### MVP1「Live」（M2–M4）

| ID | User story | 驗收標準 |
|---|---|---|
| L1 | 作為顧問，我想一鍵開始擷取 Zoom、Meet、Teams 與麥克風音訊，不需要 bot | macOS 14.4+；首次引導權限設定 ≤ 2 分鐘；三大平台實測可用 |
| L2 | 我想看到低延遲、繁中正體的中英混說逐字稿 | Partial 延遲 P50 < 1 秒；簡轉繁（台灣用語）；區分「我」與「他人」 |
| L3 | 我想加入客戶名、產品名等術語，提高辨識率 | Space 層級術語表；同時用於 ASR keyterms 與校正 |
| L4 | 會中若有人提問卻沒人回答、話題已經轉走，我希望被安靜地提醒 | Open Question 卡片；precision ≥ 60%（對照 WoZ 標註） |
| L5 | 出現待辦但沒有 owner 或期限時，我希望在會議結束前被提醒 | Unowned Action 卡片；會議最後 10% 或話題轉換時出現 |
| L6 | 我想追蹤本場提到的重要數字 | Numbers ambient 列表（數值、單位、說話者、時間點） |
| L7 | 會議結束時，我想用 30 秒確認決策與待辦 | 確認 UI；可編輯 owner 和 due；寫入 ledger |
| L8 | 我想要會後摘要與追蹤信草稿 | 結構化摘要（決策、待辦、問題、參考）；繁中與英文可切換 |
| L9 | 我要讓其他與會者知道我在使用 ELIVO | 告知文字一鍵貼到會議聊天室；錄製徽章；可設為強制 |
| L10 | 我可以隨時暫停，或刪除某一段 | 暫停鍵；刪除會連帶刪除對應的 embedding |

### MVP2「Memory」（M4–M6）

| ID | User story | 驗收標準 |
|---|---|---|
| M1 | 我想把會議歸到客戶或專案 Space | 依行事曆標題、參與者網域自動建議 Space |
| M2 | 我想匯入過去的文件與逐字稿（PDF、DOCX、MD、Otter／Zoom／Teams 匯出檔） | 匯入後 5 分鐘內可檢索；中英 hybrid 檢索 |
| M3 | 會中提到某專案或主題時，相關文件和先前決策會安靜地出現在 tray | Related Document、Previous Decision 卡片；precision ≥ 60% |
| M4 | 會前 10 分鐘我想收到一頁簡報 | 上次決策、未完成待辦、上次提到的數字、未決問題 |
| M5 | 我想搜尋「我們什麼時候決定 X？」 | Ledger 搜尋；結果附會議與時間點 |
| M6 | 我可以查看並修正 ledger | 決策可編輯；可標記「已被取代」 |

### MVP3「Surface」（M6–M8）

| ID | User story | 驗收標準 |
|---|---|---|
| S1 | 當下說法與過去決策衝突時，我希望在說話告一段落時被提醒 | Decision Conflict 卡片；precision ≥ 70%（高打擾類別的門檻更高） |
| S2 | 數字與先前不一致時提醒我 | Number Drift 卡片（差異 > 門檻，例如 10%） |
| S3 | 有人說「上次那個方案」時，我想知道指的是哪個 | 指代消解卡片；不確定時顯示「A／B？」 |
| S4 | 我可以調整 ELIVO 的「話量」 | 三段：安靜／標準／積極；個人化門檻學習 |
| S5 | 我想在 iPad 上看到 ELIVO 的畫面，筆電留給簡報 | 第二螢幕模式；延遲 < 500ms（相對 Mac 端） |
| S6 | 敏感會議不想留下逐字稿 | Ephemeral mode：會中可見；會後只保留確認過的決策與待辦；音訊與逐字稿不落地 |
| S7 | 我想在 Claude、ChatGPT 裡問我的會議記憶 | ELIVO MCP server（唯讀；權限範圍限該使用者） |
| S8 | 我想知道卡片為什麼出現 | 「為什麼？」面板：觸發語句、查詢、來源、分數 |

---

## 5. 明確不做（Non-goals for Phase 1）

- ❌ 會議 bot（加入會議的虛擬與會者）
- ❌ 情緒或語氣分析（來自語音或臉部）
- ❌ 聲紋辨識與自動姓名標註（改由使用者手動命名 speaker）
- ❌ Windows 版與行動錄音 app（Phase 2 依需求再做）
- ❌ 自動加入使用者沒有參加的會議
- ❌ 使用客戶資料訓練或微調共用模型
- ❌ CRM 寫回（Phase 2）
- ❌ 即時翻譯（有需求再評估；市場上已有很多）

---

## 6. 卡片規格

```json
{
  "id": "card_01H…",
  "type": "decision_conflict | number_drift | previous_decision | related_document | open_question | unowned_action | anaphora",
  "level": "ambient | promoted",
  "title": "與 8/12 決策不同",
  "body": "「全部切過去」與 8/12 決定的分階段方案 B 不同。",
  "evidence": [
    {"kind": "utterance", "meeting_id": "m_now", "t": "00:23:12", "quote": "所以這次我們想直接全部切過去"},
    {"kind": "decision", "decision_id": "d_812", "meeting_id": "m_0812", "t": "00:31:05", "quote": "先用方案 B 分階段切"}
  ],
  "why_now": {"trigger": "decision_candidate", "score": 0.82, "threshold": 0.7},
  "actions": ["open_source", "pin", "dismiss", "add_to_followup"],
  "created_at": "…",
  "shown_at": "…"
}
```

**文案規則**：

- 標題 ≤ 12 個中文字；內文 ≤ 2 行。
- 陳述事實，不下判斷。例如寫「與 8/12 決策不同」，而不寫「你們錯了」。
- 一定附日期與來源。
- 不確定時用問句（「是指方案 B 嗎？」）。

---

## 7. 埋點（產品分析）

| 事件 | 用途 |
|---|---|
| `card_shown{type, level, score}` | precision 分母 |
| `card_action{pin, expand_source, copy, add_followup}` | 「採用」＝North Star |
| `card_dismissed{reason?}` | false interruption |
| `card_ignored`（顯示後 N 秒無互動） | 弱負向訊號 |
| `post_meeting_confirm{edited_count}` | 抽取品質 |
| `mode_changed{focus, ephemeral, verbosity}` | 打擾容忍度 |
| `consent_notice{sent, objection}` | 告知摩擦 |
| `retro_rating{card_id, useful, neutral, distracting}` | 會後回顧評分（每週抽樣） |

---

## 8. 品質門檻（Beta 出貨前）

- 逐字稿 MER：遠端 ≤ 12%，會議室 ≤ 18%（自建測試集）。
- 卡片延遲：P50 < 4 秒，P95 < 8 秒。
- Insight precision ≥ 60%；False interruption ≤ 1 次／小時。
- 1 小時會議 CPU 平均 < 25%（M1／M2，16GB 機型）；不會因記憶體或溫度造成降頻。
- 崩潰率 < 0.5% session；網路中斷時逐字稿本地緩衝，恢復後補傳。
