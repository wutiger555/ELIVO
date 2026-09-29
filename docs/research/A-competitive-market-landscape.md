> **研究附錄**（2026-09-29 由研究代理以公開網路資料彙整，已譯為中文）。每項非顯而易見的主張均附來源；標示「待驗證」者尚待一手資料確認。**非法律意見。**

# ELIVO 盡職調查：即時對話智慧的競爭與市場概況（截至 2026-09-29）

## 0. 執行摘要

- **會後筆記如今已是大眾化商品，市場正在整併。** Otter 的 ARR 已突破 $100M。Granola 估值達 $1.5B。Superhuman（前身為 Grammarly）於 2026-09-14 收購 Fathom。各大平台（Microsoft、Zoom、Google）將筆記功能綁進自家套裝，且正積極封鎖第三方 bot。新的獨立筆記工具已無生存空間。
- **會議中的即時協助正在出現，但多半是被動式的。** 使用者必須主動提問：Otter Meeting Agent（語音啟動）、Zoom In-Meeting Questions、Meet 中的 Ask Gemini、Teams Facilitator、Fireflies Live Assist。主動式工具則範圍狹窄：它們要不是以關鍵字比對 battlecard（Outreach Kaia、Clari Copilot、Balto、Cresta），就是以通用型「耳語（whisper）」浮層運作（Cluely）。我找不到任何產品能把會議中所說的內容與過去的決策、文件和數字進行比對，並以高精準度跳出「這與 8 月 12 日的決議矛盾」或「成本偏離 18%」之類的卡片。這正是 ELIVO 的核心構想，而且目前仍是空白市場。不過各大平台都已具備所有要素（即時逐字稿、組織文件、LLM），因此機會窗口大概只有 12–24 個月。
- **華語、繁體中文及華英夾雜（code-switching）是美國工具真實且可驗證的缺口。** Otter 僅支援簡體中文（測試版），且每場會議只能用一種語言。Google「Take notes for me」完全不支援中文，每場會議也只能用一種語言。Teams AI 筆記每場會議只支援一種語言。聯發科 Breeze-ASR-25 等開放模型如今讓 zh-TW 夾雜語 ASR 的建置成本變得很低，所以 ASR 本身並非護城河。護城河可能來自工作流程、知識圖譜與信任（地端部署或資料落地）。
- **硬體風險高，但聚焦時已獲驗證。** Plaud 出貨超過 2M 台裝置，軟體 ARR 超過 $100M。Humane 的裝置已被停用變磚。Limitless 被 Meta 併入。Bee 被 Amazon 併入。中國競爭者（釘釘 DingTalk A1，售價 RMB 499）迅速讓錄音筆型硬體商品化。

---

## 1. 競爭概況

### (a) 會後筆記工具（逐步加入即時功能）

| 業者 | 定位 | 即時？ | 外部知識？ | 規模／募資 | 近期動態 |
|---|---|---|---|---|---|
| **Otter.ai** | 現為「AI Meeting Agent」套件（Meeting、Sales、SDR agent） | **是。** 語音啟動的 agent 可從全公司會議資料庫即時回答問題；提供即時銷售教練功能（[UC Today](https://www.uctoday.com/unified-communications/otter-revolutionises-meetings-with-ai-agent-that-speaks-up-during-calls/)） | 會議資料庫、MCP server、公開 API；HIPAA（2025 年 7 月） | $100M ARR（2025 年 3 月）、35M+ 使用者、員工 <200 人（[Otter blog, Dec 2025](https://otter.ai/blog/otter-ai-caps-transformational-2025-with-100m-arr-milestone-industry-first-ai-meeting-agents-and-global-enterprise-expansion)） | 集體訴訟合併為 *In re Otter.AI Privacy Litigation*。法院於 2026-08-13 准許 Wiretap Act、CIPA 與 BIPA 之請求繼續進行（[NatLawReview](https://natlawreview.com/article/invited-participant-or-third-party-eavesdropper-court-holds-otterai-third-party)、[RecordingLaw](https://www.recordinglaw.com/news/otter-ai-wiretap-lawsuit-explained/)） |
| **Fireflies.ai** | 會議、email、CRM 的「AI 隊友」；AI Sales Suite（2026 年 7 月） | **是。** 「Live Assist」提供即時筆記、建議與回答，但需要 bot 進入會議（[Fireflies KB](https://guide.fireflies.ai/articles/6032274417-learn-about-fireflies-live-assist-get-real-time-suggestions-answers-and-notes-live-during-the-meeting)） | CRM（HubSpot/Salesforce）、「AskFred」 | 透過 2025 年 6 月的股份收購要約（tender offer）達 $1B 估值（[Fireflies](https://fireflies.ai/blog/fireflies-1-billion-valuation)）；宣稱有 20M 使用者／500k 個組織；營收待驗證（Latka 估計 2024 年為 $10.9M，數據似已過時） | BIPA 聲紋集體訴訟 *Cruz v. Fireflies.AI*（C.D. Ill.，2025-12-18 提起）（[Data Privacy Insider](https://www.dataprivacyandsecurityinsider.com/2025/12/lawsuit-alleges-fireflies-ai-corp-illegally-collects-biometric-data-from-virtual-meetings/)） |
| **Granola** | 無 bot 的 Mac/Windows「AI 筆記本」，正轉型為「企業 AI 應用」 | 部分。可在會議中對話，但不會主動推送卡片 | Spaces、API、MCP server | 2026 年 3 月由 Index 領投 $125M C 輪，估值 $1.5B；累計募資 $192M；客戶包括 Vanta、Asana、Cursor、Mistral（[TechCrunch](https://techcrunch.com/2026/03/25/granola-raises-125m-hits-1-5b-valuation-as-it-expands-from-meeting-notetaker-to-enterprise-ai-app/)） | Granola 限制存取其本機資料庫，導致使用者的 agent 工作流程失效，引發使用者反彈。目前宣稱支援 32 種語言，包括華語與粵語（[Granola](https://www.granola.ai/updates/granola-now-supports-32-languages)）；能否處理夾雜語仍待驗證 |
| **Fathom** | 以免費方案為主的筆記工具，在 HubSpot 使用者中很強勢 | 極少 | CRM 同步 | 400k+ MAU；2024 年估值 $94M（[TechCrunch](https://techcrunch.com/2026/09/14/superhuman-acquires-yc-backed-notetaker-fathom-as-productivity-platforms-push-for-agentic-work/)）；2025 年 ARR 約 $30M（Latka，待驗證） | **2026-09-14 被 Superhuman 收購**，明確顯示「筆記工具正淪為一項功能」（[Superhuman](https://blog.superhuman.com/superhuman-acquires-fathom/)） |
| **tl;dv** | 中小企業／業務用筆記工具，總部在歐盟 | 有限 | CRM | 不適用 | Business 方案新增銷售教練功能 |
| **Read AI** | 筆記、參與度／情緒評分，以及橫跨會議、email 與聊天的「Search Copilot」 | **是。** 即時參與度與演說教練提示（[Read AI](https://www.read.ai/meeting-tools)） | Email、Slack、CRM | $50M B 輪（2024 年 10 月），累計 $81M（[Read AI](https://www.read.ai/post/read-ai-announces-50-million-series-b-launch-of-read-ai-for-gmail)） | 未發現 2026 年有新一輪募資 |
| **Notion AI Meeting Notes** | 在 Notion 頁面內無 bot 擷取 | 否 | Notion 工作區（強大的 RAG 基礎） | 綁在 Business 方案，每位使用者每月 $20（[Engadget](https://www.engadget.com/ai/notion-ai-can-transcribe-conversations-and-write-reports-but-itll-cost-you-130018464.html)） | 16 種語言 |
| **Krisp** | 降噪，加上無 bot 筆記與口音轉換 | 音訊層級的即時處理 | CRM 推送 | 不適用 | 為客服中心推出客戶端口音轉換（2026 年 3 月） |
| **Jamie / Bluedot / Supernormal** | 無 bot（Jamie、Bluedot）或點數制（Supernormal 2.0）筆記工具 | 否 | 有限 | 小 | Supernormal 於 2026 年改為點數制計價（[Supernormal](https://www.supernormal.com/pricing)） |
| **Avoma** | 筆記工具加上 CI 與營收智慧，鎖定中小企業業務 | 「即時回答助理」包含在 CI 加購方案中販售 | CRM | 不適用 | 加購後價格可達每席約 $77（[Docket](https://docket.io/resources/research/avoma-pricing)） |
| **Wispr Flow Notetaker** | 新進的無 bot 業者（Mac 版 2026 年 8 月、Windows 版 2026 年 9 月） | 否 | 不適用 | 不適用 | 21 種語言（[TechCrunch](https://techcrunch.com/2026/08/05/wispr-flow-is-preparing-to-launch-a-meeting-notetaker-updated-terms-suggest/)） |

### (b) 平台原生（最大威脅）

- **Microsoft Teams / M365 Copilot。**
  - **Facilitator** 產出即時共同編寫的筆記，彙整決策與未決問題，在聊天中回答關於對話內容與共享文件的問題，追蹤議程，並可建立 Word 文件。
  - 限制：僅適用於排定的會議（不支援頻道會議或即時會議，也不支援通話），外部與會者看不到它的更新，且需要 Copilot 授權（[Microsoft Support](https://support.microsoft.com/en-us/teams/copilot/facilitator-in-microsoft-teams-meetings)）。
  - Copilot 企業版每位使用者每月 $30，Business 版 $21（≤300 位使用者）（[Microsoft](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing)）。
  - 付費席次在 **FY26 年底突破 30M**（[MSFT FY26 Q4](https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast)），相較之下 M365 商用席次約 450M（[Office365ITPros](https://office365itpros.com/2026/01/30/microsoft-fy26-q2-results/)）。
  - AI 筆記僅支援單一語言的會議（[Microsoft multilingual](https://support.microsoft.com/en-us/office/multilingual-speech-recognition-in-microsoft-teams-650cb6d2-8a33-40e7-840d-36bb90216aa4)）。Interpreter agent 近期新增了繁體中文（[M365 Admin](https://m365admin.handsontek.net/microsoft-teams-ai-interpreter-simultaneous-quality-improvements-new-traditional-chinese-support/)）。
  - 台灣訊號：**KPMG 台灣自 10 月起為全體員工導入付費 Copilot**（[BigGo](https://finance.biggo.com/news/5847817c-8ea3-41c7-bf29-6c4cba725f23)）。顧問是 ELIVO 的核心客群，而他們正免費獲得 Copilot。
- **Zoom。**
  - AI Companion 3.0 於 2025-12-15 正式上線（GA）。它新增橫跨會議、Google Drive 與 OneDrive 的 agent 式檢索；獨立方案每月 $10（[Zoom](https://news.zoom.com/zoom-launches-ai-companion-3-0/)）。
  - In-Meeting Questions 讓與會者詢問截至目前討論了什麼。Custom AI Companion 每位使用者每月 $12。
  - **ZoomMate**（2026-06-01 推出，每位使用者每月 $20 起，以點數計量；EMEA 與 APAC 將於 2026 年稍晚推出）（[Reworked](https://www.reworked.co/collaboration-productivity/zoom-launches-ai-companion-30-with-10-standalone-option/)、[Laxis](https://www.laxis.com/blog/zoom-ai-companion/)）。
  - 會議摘要涵蓋 36 種語言並可自動偵測（[Zoom](https://news.zoom.com/breaking-down-boundaries-zoom-ai-companion-expands-language-support-across-its-platform-to-enable-better-global-collaboration-and-productivity/)）。
- **Google Meet / Gemini。**
  - 「Take notes for me」自 Business Standard（每位使用者每月 $14）起內含。僅支援 **英、法、德、義、日、韓、葡、西語，不支援中文，且每場會議只能用一種語言**（[9to5Google](https://9to5google.com/2026/06/29/google-meet-take-notes-ai-pro-ultra/)、[Google Help](https://support.google.com/meet/answer/14754931?hl=en&co=GENIE.Platform%3DDesktop)）。
  - 實體會議筆記於 2026 年 8 月推出，但僅支援英語，且每次僅限 15 分鐘（[Workspace Updates](https://workspaceupdates.googleblog.com/2026/08/take-notes-with-me-for-in-person-meetings-is-now-available.html)）。
  - **Meet 中的 Ask Gemini** 是被動式即時問答，資料來源涵蓋字幕、Workspace 文件、Gmail 與網路。推出時僅支援英語（[Workspace Updates](https://workspaceupdates.googleblog.com/2025/09/ask-gemini-in-google-meet.html)）。這是最接近「即時 RAG」的主流產品，但仍需使用者主動提問。
- **Apple。** macOS Tahoe 可錄製並轉錄電話與 FaceTime 語音通話，並由 Apple Intelligence 在備忘錄中產生摘要（[Apple](https://support.apple.com/guide/mac-help/mchld69597ca/mac)）。它目前並非會議產品，但可能成為 Mac 上無 bot 擷取的作業系統層級威脅。

### (c) 會議中即時助理

- **Cluely。**
  - 一種隱形浮層，可讀取螢幕與音訊並提供即時建議。它最初以「什麼都能作弊（cheat on everything）」起家，後來重新定位為「無法偵測的 AI 會議助理」。
  - 募資：2025 年 $5.3M 種子輪與 a16z 領投的 $15M A 輪（[Wikipedia](https://en.wikipedia.org/wiki/Cluely)）。
  - 定價：Pro 每月 $11.99 起（年繳）；「無法偵測」模式每月 $149.99（[Cluely](https://cluely.com/pricing)）。
  - 2026 年 3 月執行長撤回 $7M ARR 的說法；實際數字為 $5.2M。
  - 記者實測回應延遲為 5–90 秒。
  - 據報一起資料外洩事件曝露了 83k 位使用者（部分待驗證：HIBP 上查無此事件）（[GhostPilot](https://ghostpilotai.com/blog/cluely-data-breach-investigation/)）。
- **Otter Meeting Agent、Fireflies Live Assist、Read AI** 已於 (a) 說明。
- **面試 copilot。**
  - Final Round AI 募得 $6.88M 種子輪（2025 年 1 月），宣稱有 500k+ 使用者，收費每月 $25–90。
  - 此類別具倫理爭議。在 interviewing.io 的調查中，81% 的面試官懷疑候選人使用 AI 作弊（[Four-Leaf](https://four-leaf.ai/blog/ai-interview-copilots)）。
- **Sybill。** 通話後的銷售助理；2024 年 $11M A 輪（[TechCrunch](https://techcrunch.com/2024/07/31/sybill-raises-11m-for-its-ai-assistant-that-helps-salespeople-reduce-administrative-burden/)）。未發現即時產品。

### (d) 銷售對話智慧與客服輔助（agent assist）

- **Gong。** $500M ARR（2026 年 5 月），年增逾 55%（[Gong](https://www.gong.io/press/gong-growth-accelerates-past-55-yoy-arr-tops-500m)）。2025 年 11 月次級市場估值 $4.5B，低於 2021 年的 $7.25B（Sacra/Latka）。2026 年 6 月推出以點數計量的 AI。即時指引並非其強項。
- **Salesloft + Clari。** 合併於 2025-12-03 完成，合計 ARR 約 $450M，客戶 5,000+（[Salesloft](https://www.salesloft.com/company/newsroom/clari-salesloft-merger)）。Clari Copilot 提供 **即時 battlecard**。
- **Outreach Kaia。** 即時「內容卡片」，例如在提到競爭對手或價格時跳出（[Outreach](https://support.outreach.io/hc/en-us/articles/1260805179870-Best-Practices-for-Creating-Outreach-Kaia-Content-Cards)）。這是目前最接近「洞察卡片」的產品，但它是從人工整理的內容庫中以關鍵字或主題觸發，而非根據組織記憶進行推理。
- **Chorus（ZoomInfo）。** 2021 年以 $575M 被收購。有一家彙整網站將日期列為 2026 年，我認為是錯誤的。客戶回報 2026 年曾發生服務中斷。
- **Attention。** $30M B 輪（2026 年 6 月）。ARR 成長 4 倍；正從即時教練轉向自主執行動作（[PR Newswire](https://www.prnewswire.com/news-releases/attention-raises-30m-series-b-to-build-the-ai-system-that-runs-revenue-teams--not-just-records-them-302808821.html)）。
- **客服中心 agent assist**，最成熟的即時類別：
  - **Cresta：** 低於 200ms 的耳語式指引；$125M D 輪（2024 年 11 月）；2026 年 4 月 ARR 約 $100M（Sacra 估計）（[Cresta](https://cresta.com/blog/cresta-raises-125m-to-create-the-unified-platform-for-human-and-virtual-agents)、[Sacra](https://sacra.com/c/cresta/)）。
  - **Observe.AI：** 已募資 $214M。
  - **Balto：** 已募資約 $52M（[Balto](https://www.balto.ai/blog/balto-raises-37-5m-pushes-to-close-execution-gap-for-contact-centers/)）。
  - 給 ELIVO 的啟示：即時輔助在每場對話 ROI 可衡量的場景（業務、客服）才賺得到錢。

### (e) 穿戴裝置與硬體

- **Plaud（NotePin、NotePin S、Note Pro）。**
  - 出貨超過 2M 台，軟體 ARR 超過 $100M（2026 年 6 月）。約 50% 的裝置持有者付費訂閱。Plaud Teams 於 2026 年推出（[TechCrunch](https://techcrunch.com/2026/06/16/plaud-says-its-software-business-topped-100m-in-arr-after-shipping-over-2m-ai-notetakers/)）。
  - 2025 年年化營收約 $250M 且已獲利（[Forbes](https://www.forbes.com/sites/iainmartin/2025/09/02/how-an-ai-notetaker-became-one-of-the-few-profitable-ai-startups/)）。目標 2026 年銷售額 $500M（[Bloomberg](https://www.bloomberg.com/news/articles/2026-06-16/plaud-plans-new-wearable-as-ai-note-taking-startup-eyes-500-million-in-sales)）。
  - 據報估值約 $2B，並傳出騰訊入股，但雙方均否認（[36Kr](https://eu.36kr.com/en/p/3799129165863937)）。
  - 裝置售價約 $159–179；Unlimited 方案每年 $239.99。
- **Limitless。** 2025 年 12 月被 Meta 收購。吊墜裝置停產，Rewind 於 2025-12-19 關閉，並撤出歐盟與英國市場（[TechCrunch](https://www.techcrunch.com/2025/12/05/meta-acquires-ai-device-startup-limitless/)）。
- **Bee。** 2025 年 7 月被 Amazon 收購。售價 $49.99 的手環，目前仍在販售（[CNBC](https://www.cnbc.com/2025/07/22/amazon-ai-bee-wearable.html)）。
- **Omi。** 開源吊墜，售價約 $129，已售出 25k+ 台，完成小規模種子輪（[Omi](https://www.omi.me/)）。數據待驗證。
- **Humane AI Pin。** 資產以 $116M 出售給 HP。裝置於 2025-02-28 停用變磚，當時出貨僅約 10k 台，遠低於 100k 的目標（[TechCrunch](https://techcrunch.com/2025/02/18/humanes-ai-pin-is-dead-as-hp-buys-startups-assets-for-116m)）。
- **Rabbit R1。** 員工於 2025 年底反映已數月未領到薪資（[Tom's Guide](https://www.tomsguide.com/ai/whats-next-for-rabbit-employees-say-they-havent-been-paid-for-months-while-company-teases-new-ai-hardware)）。
- **中國仿製品。** 釘釘 DingTalk A1（RMB 499/799，2025 年 9 月）在雙 11 登上天貓錄音筆榜首（[Sina](https://finance.sina.com.cn/tech/discovery/2025-10-30/doc-infvrtfr7300817.shtml)）。Anker／字節跳動、追覓（Dreame）與出門問問（Mobvoi）都已推出類似產品。
- **會議室裝置。**
  - Meeting Owl 5 Pro 已通過 Teams 認證（[BusinessWire](https://www.businesswire.com/news/home/20260203989764/en/Owl-Labs-Unveils-Next-Generation-Meeting-Owl-5-Pro-Expanding-Enterprise-Hybrid-Collaboration)）。
  - Logitech Sight 具備 AI 取景功能。
  - HP Poly Studio Room Compute（採用 NPU，2026 年 7 月）與 VideoOS 5.1（[HP](https://www.hp.com/us-en/newsroom/press-releases/2026/HP-debuts-ai-powered-unified-collaboration-ecosystem-at-infocomm-2026.html)）。
  - 台灣的 **AVer（圓展）** 推出 CORE500 MTR 套件（[ChannelTimes](https://channeltimes.com/aver-showcases-ai-ready-conferencing-and-pro-av-innovations-at-infocomm-asia-2026/)）。
  - 目前會議室 AI 僅止於音訊／影像取景加上平台筆記。**市場上沒有桌上型「洞察顯示器」產品**，這是空白市場，但需求也尚未獲得驗證。

### (f) 台灣與中文市場業者

- **雅婷逐字稿（Yating，台灣人工智慧實驗室 Taiwan AI Labs／雅婷智慧）。**
  - 自 2017 年起經營，擅長台灣口音華語與台語。依用量計費約每小時 NT$100，購買 100 小時方案可降至每小時 NT$8（[數位時代](https://fc.bnext.com.tw/solutions/view/yating)）。
  - 其企業方案為 **FedGPT** 地端「主權 AI」平台，內含會議助理（Meeting Assistant）。
  - 其 2026 年 6 月的調查（n=562）：**72% 的台灣組織希望採用地端 AI，51% 擔心資料外洩**（[Taiwan AI Labs](https://ailabs.tw/news-room/more-than-half-of-taiwanese-enterprises-concerned-about-confidential-data-leakage-from-cloud-ai-over-70-want-ai-back-on-premises-yating-fedgpt-sovereign-ai-platform-enables-enterprises-to-build-secur/)）。
  - 這是企業與政府標案中最直接的本地競爭者。
- **Vocol.ai（台灣）。** 支援中／英／日文，宣稱繁體中文準確率 97%+，整合 Teams 與 Meet（[Vocol](https://www.vocol.ai/tw/home)）。募資狀況不明。
- **Meeting Ink（迪威智能 DeepWave，台灣）。** 即時字幕與翻譯；支援台語與客語（[Meeting Ink](https://ink.dwave.cc/zh-TW/news/85)）。
- 其他本地業者：CyberLink MyEdit 與 Tinrec 秒聽錄音。我無法確認「口袋逐字稿」是否為獨立公司。
- **飛書妙記 Feishu/Lark Minutes。** 協作式逐字稿，每月 300 分鐘免費，綁在 Lark Pro 中，每位使用者約 $12（[Feishu](https://www.feishu.cn/product/minutes)）。
- **通義聽悟 Tongyi Tingwu（阿里巴巴）。** 即時轉錄與翻譯，每月 20 小時免費，使用者達「數百萬」（[Tingwu](https://tingwu.aliyun.com/)）。
- **訊飛聽見 iFlytek。** 即時與離線轉錄，宣稱準確率 98%，並販售 iFlybuds Pro 3 等硬體（[iflyrec](https://www.iflyrec.com/)）。目前定價待驗證。
- **騰訊會議 AI小助手（Tencent Meeting）。** 以混元為基礎的即時會議紀要、遲到者進度補上，以及即時更新的結論與待辦事項（[Tencent](https://meeting.tencent.com/ai/)）。定價待驗證。
- **策略觀察。** 中國的工具在華語上表現強勁，但許多台灣企業、政府機關與受監管產業基於資安考量避免使用中國雲端服務。這為台灣自製產品提供了切入點。

---

## 2. 市場規模（差異極大；僅供方向參考）

| 區隔 | 估計值 | 成長率 | 來源 |
|---|---|---|---|
| AI 會議助理 | $3.14B（2025）→ $9.33B（2030） | 24.3% CAGR | [TBRC](https://www.thebusinessresearchcompany.com/report/artificial-intelligence-ai-powered-meeting-assistants-global-market-report) |
| AI 會議助理 | $3.5B（2025）→ $21.5B（2033） | 25.8% | [Grand View](https://www.grandviewresearch.com/industry-analysis/ai-meeting-assistant-market-report) |
| AI 會議助理 | $3.67B（2024）→ $72B（2034） | 34.7%（偏激進） | [Market.us](https://market.us/report/ai-meeting-assistant-market/) |
| AI 筆記（狹義） | $623.5M（2025）→ $740M（2026）→ $3.48B（2035） | 18.75%；APAC 為成長最快的區域 | [Precedence](https://www.precedenceresearch.com/ai-note-taking-market) |
| 對話智慧軟體 | $21.9–28.5B（2025） | 8–15% | [Research&Markets](https://www.researchandmarkets.com/reports/6226068/conversation-intelligence-software-global-market)、[SNS Insider](https://www.snsinsider.com/reports/conversation-intelligence-software-market-7165)（定義寬鬆，包含客服中心分析） |
| 語音轉文字 API | $2.4–4.7B（2025） | ~18–21% | [Fortune BI](https://www.fortunebusinessinsights.com/speech-to-text-api-market-102781)、[Mordor](https://www.giiresearch.com/report/moi2073020-speech-text-api-market-share-analysis-industry.html) |
| 會議室硬體 | $11.25B（2025） | 不適用 | [Mordor](https://www.mordorintelligence.com/industry-reports/conference-room-hardware-market) |
| 視訊會議硬體 | $7.0–8.7B（2025） | 不適用 | [Mordor](https://www.mordorintelligence.com/industry-reports/video-conferencing-hardware-market) |

**由下而上的合理性檢查。** 已知廠商的 ARR 已超過「AI 筆記」的市場估計：Otter $100M、Plaud 軟體 $100M+、Gong $500M、Salesloft+Clari 約 $450M、Cresta 約 $100M（估計）、Fathom 約 $30M（估計）。再加上約 30M 個單價 $21–30 的付費 Copilot 席次，其中部分由會議需求帶動。會議智慧實際可觸及的市場規模達數十億美元。簡報時建議採用 AI 會議助理約 $3–3.5B（2025）、約 25% CAGR 的數字，並引用 Grand View 或 TBRC，而非 $72B 那個數字。

---

## 3. 空白市場分析

### 真正未被滿足的需求

1. **會議中主動、有依據、跨來源的洞察。** 現有的即時功能分為三類：
   - 被動式問答：Ask Gemini、Zoom In-Meeting Questions、Otter 的語音 agent、Facilitator 聊天。
   - 關鍵字 battlecard：Kaia、Clari Copilot。
   - 通用型 LLM 耳語：Cluely，速度慢且內容籠統。

   沒有任何一款能在未經提示的情況下，對照組織的決策紀錄、過往提案或數字進行檢查，並附上引用來源、控制誤報率。搜尋「矛盾偵測（contradiction detection）」只找到論壇上的需求貼文與行銷文案（[Microsoft Q&A](https://learn.microsoft.com/en-nz/answers/questions/2336737/ai-meeting-agent-for-transcript-summarization-cont)）。困難之處在於精準度與克制：何時該保持沉默，以及如何引用來源。而這些也正是可建立防禦力的部分。
2. **跨會議的結構化「決策與承諾帳本」。** 摘要已經很普遍；但一份可查詢、有版本控管、能隨時間比對決策、數字與負責人的紀錄，基本上還不存在。這正是洞察卡片所需要的，而且它本身就有價值。
3. **zh-TW 與夾雜語會議。**
   - Otter：僅支援簡體中文（測試版）、單一語言、無自動偵測（[Speakapp](https://speakapp.com/blog/otter-ai-languages)）。
   - Google：完全不支援中文。
   - Teams AI 筆記：僅支援單一語言。
   - 台灣專業人士經常在華語句子中夾雜英文術語。
   - 基準測試：Whisper-large-v3 在 ASCEND 夾雜語資料集上的 MER 約 23%（[arXiv](https://arxiv.org/pdf/2311.17382)）。聯發科以 Apache-2.0 授權釋出的 **Breeze-ASR-25** 宣稱夾雜語表現比 Whisper 好 56%（[GitHub](https://github.com/mtkresearch/Breeze-ASR-25)），此外也已有 Breeze-ASR-26。

   意涵：ELIVO 可以低成本取得良好的 ASR，但所有競爭者也都可以。差異化應放在 ASR 之後的實體正規化（公司內部術語、混合語言名稱、繁體中文輸出、報價／毛利等術語）以及知識層。
4. **針對 APAC 的地端、資料落地與無 bot 企業部署。** 72% 的台灣組織希望採用地端 AI。台灣《人工智慧基本法》於 2026 年 1 月公布，強調隱私與資料治理（[Baker McKenzie](https://www.bakermckenzie.com/en/insight/publications/2026/01/taiwan-ai-basic-act)）。美國的筆記工具只提供位於美國的雲端服務。雅婷 FedGPT 是這個領域的本地既有業者。
5. **實體會議。** Google 的實體會議筆記僅支援英語，且上限 15 分鐘。台灣的會議室文化（與客戶面對面開會、工廠與供應商審查會議）需要會議室或桌上型裝置，這正是 ELIVO 硬體可以切入之處。Plaud Note Pro 最接近，但沒有即時洞察。

### 綁售威脅有多大？

對筆記而言威脅高，對主動式洞察而言威脅中等。
- Microsoft（30M+ 付費 Copilot 席次）、Zoom（AI Companion 綁在付費方案中）與 Google（Business Standard 內含 Gemini，每月 $14）都把摘要功能當成套裝的一部分免費提供。
- **Microsoft 與 Google 正在封鎖第三方 bot。**
  - Teams 先是要求偵測到的外部 bot 需另行核准（MC1251206），接著又新增全租用戶範圍的 `ExternalBotAccessMode` 自動封鎖，自 2026 年 8 月起陸續推出（[UC Today](https://www.uctoday.com/unified-communications/microsoft-teams-to-block-external-bots-automatically-as-ai-notetaker-crackdown-hardens/)）。
  - Google Meet 自 2026 年 3 月起將第三方 bot 標示為「潛在風險」（[UC Today](https://www.uctoday.com/security-compliance-risk/google-meet-launches-update-to-better-screen-suspicious-bots/)）。
- 因此 ELIVO 必須做到 **無 bot**：在 Mac 上擷取本機系統音訊、在會議室放置裝置，或使用官方平台 app。

各平台的限制正是 ELIVO 的機會：
- 它們只能在自家套裝內運作（Facilitator 無法在通話或即時會議中運作，且排除外部與會者）。
- 每場會議只支援一種語言。
- 基於責任考量，它們的主動性相當保守。
- 它們對自家套裝以外的知識（Notion、Confluence、本機檔案分享、ERP 數字）支援薄弱。
- 對於在客戶平台上開會的顧問與業務團隊而言，混合平台的會議很常見。

### 台灣新創可以在哪裡勝出

- **灘頭堡：** 台灣與 APAC 的顧問、PM 與 B2B 業務（包括半導體供應鏈團隊），他們經常進行夾雜語、跨平台或實體會議，且涉及機密數字。一個狹窄切入點的例子是「供應商與客戶會議中的承諾與價格一致性檢查」，其中一張「成本偏離 18%」的卡片具有顯而易見的 ROI。
- **企業：** 混合或地端部署（本地 ASR 模型加上私有 LLM），具備 SOC 2 或 ISO 27001 並符合台灣《個人資料保護法》（PDPA），定位為中國工具與美國雲端工具的替代方案。
- **通路：** 台灣系統整合商（SI）與 Microsoft 合作夥伴，以及影音（AV）整合商。台灣會議室硬體廠商 AVer 是潛在的合作夥伴，而非競爭者。
- **風險：** 雅婷或台灣人工智慧實驗室在 FedGPT 中加入主動式卡片，或 Microsoft 推出支援繁體中文與主動式洞察的 Facilitator。

---

## 4. 定價基準（美元，每位使用者每月；除另有註明外皆為年繳）

| 產品 | 免費 | 入門 | 團隊／商務 | 企業 | 來源 |
|---|---|---|---|---|---|
| Otter | 300 分鐘 | Pro $8.33（月繳 $16.99） | Business $19.99（月繳 $30） | 客製 | [Otter](https://otter.ai/pricing) |
| Fireflies | 有 | Pro $10（月繳 $18） | Business $19（月繳 $29） | $39 | [Sonix](https://sonix.ai/resources/fireflies-ai-pricing/) |
| Granola | 30 天歷史紀錄 | — | Business $14 | $35 | [Granola](https://www.granola.ai/pricing) |
| Fathom | 無限制 | Premium $16 | Team $15；Business $25 | 客製 | [Fathom](https://www.fathom.ai/pricing) |
| tl;dv | 有 | Pro $18 | Business $59 | 客製 | [Claap](https://www.claap.io/blog/tl-dv-pricing) |
| Read AI | 有 | Pro $15 | Enterprise $22.50 | Ent+ $29.75 | [eesel](https://www.eesel.ai/blog/read-ai-pricing) |
| Notion AI Notes | — | — | Business $20（綁售） | 客製 | [Engadget](https://www.engadget.com/ai/notion-ai-can-transcribe-conversations-and-write-reports-but-itll-cost-you-130018464.html) |
| Krisp | 有 | Pro $8 | Business $10 | 客製 | [Krisp](https://krisp.ai/pricing/) |
| Jamie | 10 場會議 | Plus €25 | Team €39 | 客製 | [Sally](https://www.sally.io/blog/jamie-ai-the-best-alternatives) |
| Bluedot | 有 | Pro ~$20 | — | — | [Bluedot](https://www.bluedothq.com/pricing)（待驗證） |
| Avoma | 有 | 基本 $19 | +$29 CI、+$29 RI（最高約 $77） | 客製 | [Docket](https://docket.io/resources/research/avoma-pricing) |
| Cluely | 有 | $11.99–19.99 | 「無法偵測」$149.99 | 客製 | [Cluely](https://cluely.com/pricing) |
| Final Round AI | — | $25（年繳）至 $90（月繳） | — | — | [LoopCV](https://www.loopcv.pro/directory/finalround/) |
| M365 Copilot（Facilitator） | — | Business $21 | Enterprise $30（加購） | — | [Microsoft](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing) |
| Zoom AI Companion / ZoomMate | 內含於付費方案 | 獨立方案 $10 | Custom AI $12；ZoomMate $20 起 | — | [Reworked](https://www.reworked.co/collaboration-productivity/zoom-launches-ai-companion-30-with-10-standalone-option/) |
| Google Gemini in Meet | — | 自 Business Standard $14 起內含 | — | — | [eesel](https://www.eesel.ai/blog/gemini-workspace-pricing) |
| Gong | — | 每席約 $113–133（每年 $1,360–1,600）另加平台費 | — | — | [Oliv](https://www.oliv.ai/blog/gong-io-pricing) |
| Lark（含 Minutes） | 有 | Pro ~$12 | — | 客製 | [Toolradar](https://toolradar.com/tools/lark/pricing) |
| 雅婷逐字稿 | 300 分鐘試用 | 每小時約 NT$100，大量購買可降至每小時 NT$8 | 企業地端（FedGPT）依報價 | — | [數位時代](https://fc.bnext.com.tw/solutions/view/yating) |
| Plaud（硬體加方案） | 每月 300 分鐘 | Pro 每年 $99.99 | Unlimited 每年 $239.99；Team 每位使用者 $20 | — | [Plaud](https://www.plaud.ai/pages/plaud-ai-plan-pricing) |
| Omi / Bee | 免費方案 | Omi $19 Plus／$29 Unlimited；Bee ~$12（待驗證） | — | — | [UMEVO](https://www.umevo.ai/blogs/ume-all-posts/omi-ai-wearable-deep-dive-subscription-cost-and-developer-kit-review) |

**對 ELIVO 定價的意涵。** 純筆記工具集中在 $8–20。ELIVO 的 Pro 方案定價 $15–30，與 Otter 和 Fireflies Business 相當或更高，因此洞察卡片必須撐得起這個溢價；約 $20–25 較為合理。Team 方案 $30–60 與 Copilot（$30）及 tl;dv Business（$59）重疊，唯有具備可衡量的 ROI（業務、顧問）或地端部署才站得住腳。企業方案採客製及地端定價，以 Gong 每席約 $110–130 為基準，對受監管的 APAC 買家而言是務實的。對於吃重的 RAG 與推論工作，可考慮以用量或點數計價，Zoom、Gong、Fireflies 與 Supernormal 目前都已這麼做。

---

## 5. 教訓：失敗、爭議與疲乏

1. **同意與資料使用訴訟。**
   - Otter 案法院認定（2026-08-13），**以錄音內容訓練模型** 的廠商可能構成 CIPA 下的「第三方竊聽者」（[Lawsuit Intelligencer](https://lawsuitintelligencer.com/otter-ai-cipa-ruling)）。
   - Fireflies 因說話者聲紋面臨 BIPA 責任。
   - 紐約市律師公會正式意見 2025-6（NYC Bar Formal Opinion 2025-6，2025 年 12 月）提醒律師注意 AI 筆記工具與保密義務（[PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/the-meeting-bot-nobody-invited-is-now-exhibit-a)）。
   - 對 ELIVO 的設計意涵：
     - 預設不使用任何客戶資料進行訓練。
     - 向所有與會者顯示清楚可見的同意指示。
     - 說話者辨識設為選用且有時間限制，以降低聲紋與生物特徵風險。
     - 提供資料保存控制。
   - 在台灣，依通保法 §29，會議參與者錄音一般屬合法，但非參與者的秘密錄音則觸及刑法 §315-1（[亮遠法律](https://lylaw.tw/article-content.asp?ids=40)）。若 AI 廠商為自身用途保留資料，也會引發相同的「第三方」疑義。向企業與政府銷售前，應先取得本地法律意見。
2. **Bot 疲乏與平台封鎖。** Teams 與 Meet 現在會封鎖或標示 bot，企業法務也會把筆記工具踢出會議，因為逐字稿可能成為可被調閱的證據。市場正轉向無 bot 擷取（Granola、Wispr、Fathom 自 2026 年 4 月起的無 bot 模式）。ELIVO 也應提供「短暫模式（ephemeral mode）」：即時顯示洞察，不保留逐字稿。
3. **「無法偵測」是品牌負債。** Cluely 爆紅後，接連遭遇 ARR 數字撤回、延遲抱怨與據報的資料外洩。ELIVO 的「低干擾」定位應該透明，而非隱匿，對企業買家尤其如此。
4. **硬體。**
   - Humane（募資約 $230M，10 個月內停用變磚）與 Rabbit 顯示，裝置必須在某項特定任務上勝過手機或筆電。
   - Plaud 顯示這項任務可以是「可靠地擷取實體會議」，並透過約 50% 的軟體附加率變現。
   - Limitless 與 Bee 顯示，大型科技公司會收購這個類別，而不是讓它獨立擴大規模。
   - 中國供應鏈能在數個月內抄襲設計（釘釘 DingTalk A1）。
   - 建議：在軟體留存率獲得驗證前，延後推出顯示裝置。考慮與台灣 ODM 或 AV 廠商（例如 AVer）合作，而非一開始就自行打造客製硬體。
5. **整併。** Fathom 歸入 Superhuman，Limitless 歸入 Meta，Bee 歸入 Amazon，Salesloft 與 Clari 合併。獨立筆記工具正淪為一項功能。ELIVO 的出場與防禦力取決於掌握 **決策／知識圖譜加上即時推理層**，而非擷取。

---

### 無法驗證的項目

- Fireflies 的真實 ARR。
- Granola 的 ARR 與使用者數。
- Fathom 的 ARR（Latka 估計）。
- Cresta 的 $100M ARR（Sacra 估計）。
- Plaud 的 $2B 估值與騰訊入股（雙方均否認）。
- Cluely 資料外洩事件（有爭議）。
- Bluedot 與 Supernormal 目前的定價（2026 年定價已變動）。
- 騰訊會議與 iFlytek 目前的定價。
- 「口袋逐字稿」是否為獨立公司。
- AVer 的營收。
- Facilitator 對繁體中文的支援。
- Granola 在單一會議中處理夾雜語的能力。
- Chorus 的收購日期：彙整網站顯示為 2026 年，但我認為是 2021 年 7 月，本次未能確認。
