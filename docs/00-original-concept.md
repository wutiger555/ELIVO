# ELIVO 原始計劃書（v0，創辦人版本）

> 本文件為創辦人最初的構想原稿，保留作為基準（baseline）。
> 經調查後修訂的版本請見 [`01-research-report.md`](01-research-report.md) 與 [`02-project-plan.md`](02-project-plan.md)。

**ELIVO — AI 即時對談智慧平台**
*From Conversation to Understanding.*

---

## 一、創業構想

現代工作高度依賴會議、討論、簡報、訪談與各種即時對談。
然而，目前的數位工具大多只能在「會議之前」或「會議之後」提供協助：

- 會前：準備文件、Agenda、背景資料
- 會中：錄音、錄影、逐字稿
- 會後：摘要、Meeting Minutes、Action Items

真正缺少的，是會議正在發生的當下，AI 能不能理解正在發生什麼，並適時提供協助。

因此，ELIVO 希望打造一個新的 Real-time Conversation Intelligence 平台。
ELIVO 不只是將語音轉成文字，而是即時理解一段對談的脈絡，將正在發生的 conversation 與過去的資訊、文件、知識與 AI 分析連結，並在適當的時間將真正有價值的資訊呈現在使用者面前。

> 傳統工具記錄人說了什麼；ELIVO 理解這段對談正在發生什麼。

## 二、品牌名稱與核心價值

**ELIVO** 是一個以英文品牌為主體、同時保留中文語意層次的 coined name。中文品牌概念暫定為：**意聯**。

- **意**：Meaning、Intent、Understanding。對話的價值不只存在於字面文字，而在於其中真正的意思、脈絡、意圖與決策。
- **聯**：Connection、Context、Knowledge。ELIVO 將當下的對談與相關文件、歷史紀錄、知識及資訊連結起來。

**意聯 = Connecting Meaning** —— 將人所說的話，連結到真正有價值的資訊與意義。

「VO」可自然聯想到 Voice，對應產品最重要的資料來源。品牌代表：**Voice → Context → Meaning**。

**品牌精神**：ELIVO 不取代人與人的對話，而是讓對話產生更多價值。AI 不應該成為會議中另一個需要被操作的工具，也不應該不斷打斷使用者。ELIVO 希望成為一個安靜存在於對談旁邊的 intelligence layer：

> Listen less like a recorder. Understand more like a participant.

## 三、產品定位

1. **一句話**：ELIVO 是一個能即時理解人類對談，並在適當時機提供相關資訊與 AI 洞察的 Conversation Intelligence Platform。
2. **與傳統 AI Meeting Recorder 的差異**：市場多聚焦 `Record → Transcribe → Summarize`；ELIVO 建立 `Listen → Understand → Connect → Surface`。
   - Listen：即時捕捉對談內容
   - Understand：理解目前討論的主題、人物、事件、問題與決策
   - Connect：將當下對話與既有文件、知識、歷史會議與相關資訊連結
   - Surface：只在真正有價值的時候，把資訊、提醒、摘要或 AI insight 呈現給使用者

價值不只是「幫你記住會議」，而是「在會議進行的時候，讓你知道現在真正重要的是什麼」。

## 四、核心產品體驗

第一個產品形態是一個放置於桌面的智慧顯示裝置，不需要頻繁操作，也不需要一直與 AI 對話。

- **左側｜即時轉錄**
  A：我們上次討論的 API migration……
  B：對，當時最大的問題其實是 latency……
- **右側｜AI Context**
  - Previous Decision：上次會議決定採用方案 B
  - Related Document：API Migration Proposal v2
  - Relevant Data：Previous benchmark：p95 820ms
  - AI Insight：目前討論的方案與 7 月提出的架構存在差異

使用者不需要離開會議、切換視窗或重新搜尋，資訊會在正確的時間出現在眼前。

## 五、核心功能

1. **Real-time Transcription**：低延遲語音轉文字；支援中文、英文、中英混合、Speaker identification、關鍵字辨識、專有名詞辨識。第一階段以「準確、即時」為最核心基礎能力。
2. **Conversation Understanding**：即時辨識 Topic、Person、Company、Project、Product、Decision、Question、Issue、Action Item、Important number、Date / deadline，逐步建立會議中的 dynamic context graph。
3. **Context Linking**：當對談提到「上次那個方案」，從 Previous meeting、Documents、Email、Notes、Project records、Knowledge base 中尋找並連結。
4. **Real-time AI Insight**：只有在偵測到高價值資訊時才出現，例如：
   - 決策提醒：This differs from the decision made on Aug. 12.
   - 資訊補充：The referenced document was updated yesterday.
   - 疑點：The cost mentioned today differs from the previous proposal by 18%.
   - 待確認事項：No owner has been assigned to this action item.
5. **Automatic Meeting Intelligence**：會後自動形成 Summary、Key Decisions、Action Items、Owners、Deadlines、Open Questions、Important References、Follow-up Topics。
   `Meeting → Real-time assistance → Post-meeting knowledge`

## 六、產品形態

- **Phase 1｜Software Prototype**：先以 Mac / Web Application 建立 MVP，驗證 STT latency、轉錄準確度、context extraction、相關資訊檢索、即時 AI 回應、UI 互動。目標：驗證 AI 是否真的能在會議中提供比單純逐字稿更高的價值。
- **Phase 2｜Dedicated Display**：獨立小型桌面裝置。*Always there, never in the way.*
- **Phase 3｜ELIVO Platform**：整合 Teams、Zoom、Google Meet、Slack、Notion、Google Drive、Microsoft 365、CRM、Enterprise knowledge base，成為企業的 Conversation Intelligence Layer。

## 七、目標市場（Early adopters）

1. Consultants / PM / Business Professionals：client / project / steering meetings、workshops、interviews；會議密度高、資訊分散。
2. Sales：customer needs、competitor、pricing、requirements、follow-up；可轉為 CRM intelligence。
3. Research / Interview：user interviews、market research、expert interviews、academic research。
4. Enterprise Teams：*Knowledge exists, but is difficult to access at the moment it is needed.*

## 八、商業模式（SaaS + Hardware）

| 方案 | 價格 | 內容 |
|---|---|---|
| Individual | Free / Pro | 個人專業人士、學生、研究者 |
| Professional | 約 US$15–30 / user / month | Unlimited transcription、AI meeting intelligence、Knowledge linking、Personal memory、Advanced summaries |
| Team | 約 US$30–60 / user / month | Shared knowledge、Team workspace、Meeting history、Collaboration、Integrations |
| Enterprise | 客製化報價 | Enterprise knowledge integration、SSO、Security controls、Data governance、On-prem / private deployment、API、Admin console |
| Hardware | Hardware margin + subscription | 建立 AI presence、降低操作成本、提高使用頻率與產品辨識度 |

## 九、競爭差異

不以「我們也有 AI transcript」競爭，而是：

1. **Real-time**：在事情發生的當下提供協助。
2. **Context**：理解這場 meeting 與其他資訊的關係。
3. **Presence**：Physical AI Presence，而不是藏在 browser tab 裡的工具。
4. **Low-interruption**：*The best AI intervention is the one that appears exactly when needed.*

## 十、技術架構

```
① Audio Layer         Microphone / Meeting audio
② Speech Layer        Streaming ASR
③ Context Layer       Topic / Entity / Speaker / Decision / Action extraction
④ Intelligence Layer  LLM + Retrieval + Knowledge Graph
⑤ Experience Layer    Real-time display / Web / Desktop / Mobile
```

核心資料流：`Voice → Transcript → Context → Retrieval → Reasoning → Surface`

## 十一、AI 技術策略

早期不自行訓練 foundation model，使用現有 STT、LLM API、Embedding、Vector DB、RAG、Knowledge graph、Local inference。
資源集中在 **Real-time context orchestration**：什麼時候理解？理解什麼？搜尋什麼？什麼資訊值得顯示？什麼時候不應該打擾使用者？這是 ELIVO 真正的 product intelligence。

## 十二、MVP 驗證計畫

- **MVP 1**（Mac App）：Microphone input、Streaming transcription、Live transcript、Topic detection、AI summary
- **MVP 2**（Context Engine）：Entity recognition、Meeting memory、Document retrieval、Relevant information panel
- **MVP 3**（模擬 ELIVO Display）：左 Live Conversation / 右 AI Context

**Success Metrics**：Transcription latency、accuracy、Relevant insight precision、False interruption rate、Context retrieval accuracy、User engagement、Meeting preparation / follow-up time saved。
最重要的是：**有多少 AI insight 真正被使用者認為「有幫助」。**

## 十三、品牌定位

不是 *Another AI Meeting Recorder*，而是 *A new interface between people, conversations and knowledge.*
關鍵字：Intelligent、Quiet、Human、Contextual、Precise、Connected。
視覺上不採用機器人、大腦、麥克風、AI circuit、聊天泡泡等直白 AI icon，而是建立簡潔、精準、具 spatial / information layer 感的品牌語言。

## 十四、品牌價值

- **Meaning**：把「言」背後的「意」與世界連結起來。真正有價值的是資訊之間的關係。
- **Human-centered AI**：讓人更專注於對話本身。AI 負責記憶、搜尋、整理與關聯；人把注意力留給思考、判斷、傾聽、溝通、創造。
- **From Information to Understanding**：*Information tells you what happened. Understanding tells you what it means.*

## 十五、長期願景

Meeting 只是起點 → Conversation OS、Sales Intelligence、Research Intelligence、Personal Conversation Memory、Enterprise Intelligence（連結 Meeting / Email / Document / CRM / Chat / Knowledge Base）。
最終：*The intelligence layer for human conversations.*

## 十六、創業故事

現代工作者每天花大量時間開會，但會議中的資訊仍高度依賴人腦記憶、手動搜尋與會後整理。AI 已能準確轉錄，但——**AI 聽到了，它真的理解嗎？**

當有人說「我們就沿用上次那個方案」，真正重要的是：哪一個方案？上次什麼時候？當時為什麼這樣決定？現在情況有沒有改變？這次討論是否與過去決策矛盾？這就是 ELIVO 想解決的問題。

## 十七、一句話願景

*ELIVO helps people understand not only what is being said, but what it means, what it connects to, and what matters next.*
ELIVO 不只理解人們正在說什麼，更理解其中的意義、脈絡，以及下一步真正重要的事情。

## 十八、最終品牌定位

- Brand：ELIVO／意聯
- Tagline：From Conversation to Understanding.
- Category：Real-time Conversation Intelligence
- Vision：The Intelligence Layer for Human Conversations
- Philosophy：讓 AI 理解對談，讓人專注於對談。

## 十九、第一階段創業目標

1. 建立 ELIVO Software Prototype
2. 驗證 Real-time Conversation Intelligence
3. 建立第一批實際使用者
4. 驗證高價值場景
5. 開發 ELIVO Display
6. 建立 SaaS + Hardware business model
7. 由 Meeting 延伸至 Sales、Research 與 Enterprise Knowledge

*ELIVO — an intelligence layer that makes human conversations more useful.*
