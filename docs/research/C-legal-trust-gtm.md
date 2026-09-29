> **研究附錄**（2026-09-29 由研究代理以公開網路資料彙整，已譯為中文）。每項非顯而易見的主張均附來源；標示「待驗證」者尚待一手資料確認。**非法律意見。**

# ELIVO 盡職調查報告：法律、信任、市場進入、客戶探索與品牌（截至 2026-09-29）

> **本文非法律意見。** 本文為案頭研究，用於準備與台灣、美國及歐盟律師的諮詢。許多數據來自律師事務所部落格與新聞等二手來源，部分則來自搜尋引擎摘要而非一手原文。標示 **[待驗證]** 的項目，在任何人據以行事前都需要以一手來源查核。

---

## 執行摘要：最重要的五件事

1. **「無機器人（bot-free）」產品已不再能讓你免於訴訟。** Otter（以機器人加入會議）於 2026 年 8 月的駁回動議大部分遭駁回。Granola（無機器人，擷取裝置本身的音訊）於 2026 年 7 月 30 日遭到起訴。兩案的法律理論相同：廠商**將錄音用於自身目的（模型訓練）**，使其從使用者的工具轉變為第三方竊聽者。ELIVO 最強的防護，是做出一個**絕不以客戶資料訓練、其他與會者看得見、且僅代表使用者行事**的產品。
2. **台灣對錄音相對寬鬆，但個資法仍然適用。** 依通保法 §29(3)，對話參與者本人錄音只要目的並非不法即屬合法。個資法（PDPA）義務正在增加：2025 年 11 月修正案新增向新設個資會（PDPC）強制通報外洩事故的義務。而個資會本身在我最後能查證的時間點，**仍為籌備處**。
3. **EU AI Act（歐盟人工智慧法）使情緒分析功能充滿風險。** 自 2025 年 2 月 2 日起，在歐盟以語音、臉部或其他生物特徵推斷*員工*情緒即屬違法。僅以文字進行的情緒分析不在禁止範圍內。針對客戶的情緒推斷不在禁止範圍內，但受到規範。Article 50（第 50 條）透明度義務自 2026 年 8 月 2 日起適用，且**並未**因 Digital Omnibus（數位綜合修正案）而延後。
4. **把聲紋當作危險物質看待。** Illinois BIPA（伊利諾州生物辨識資訊隱私法）請求在 Otter 案中存活下來，也是兩件 Fireflies 訴訟的核心。語者辨識預設關閉，須經書面同意方可選擇啟用，並公開保存期限表。更好的做法是採用不保存持久聲紋的語者分段（diarization）。
5. **市場擁擠且資金充沛：** Otter（ARR $100M）、Fireflies（估值 $1B）、Granola（$1.5B）、Plaud（營收年化 $250M）。ELIVO 的切入點是**即時、與脈絡連結的洞察**，加上台灣／亞太的信任優勢（在地資料落地、華語與台灣口音語音、地端部署選項），而不是逐字稿。

---

## 1. 錄音同意與資料保護法規

### 1.1 台灣

**刑法與通訊監察法。**
- 刑法 §315-1 處罰「無故」錄製他人非公開之談話。
- 通訊保障及監察法 §29(3) 規定，錄音者**為通訊之一方，或已得通訊之一方事先同意，且非出於不法目的**者，不罰。台灣法院一般認為這代表參與者本人的錄音同樣不違反 §315-1。
- 來源：[亮遠法律](https://lylaw.tw/article-content.asp?ids=40)、[臺灣高等檢察署](https://www.tph.moj.gov.tw/4421/4475/632364/960875/post)、[陳哲瑋律師](https://lawyerchen.com.tw/%E5%81%B7%E5%81%B7%E9%8C%84%E9%9F%B3%E5%90%88%E6%B3%95%E5%97%8E%EF%BC%9F%E5%8F%B0%E7%81%A3%E6%B3%95%E5%BE%8B%E5%AE%8C%E6%95%B4%E8%A7%A3%E6%9E%90%EF%BC%9A%E9%8C%84%E4%B8%8B%E8%87%AA%E5%B7%B1%E8%88%87/)。

**對 ELIVO 的意涵（我的分析，並非定論）：**
- **擁有者不在場時仍持續運作的錄音裝置。** 例如未來的桌上型裝置，或會自動加入使用者本人未參加之會議的 App。此時擁有者*並非*通訊之一方，§29(3) 的免責可能不適用。在場偵測（presence-gating）是一項法律控制措施，而不只是使用者體驗功能。
- **廠商本身。** 若 ELIVO 將錄音用於自身目的，可能被視為獨立的「監察者」（實施監察的人），而非使用者的工具。這與下文美國 Otter 案的推理相呼應。目前未找到台灣的相關判決。

**個人資料保護法（個資法，PDPA）。**
- **2023 年修正：** 第 48 條對未採行適當安全維護措施之非公務機關，罰鍰提高為新台幣 2 萬至 200 萬元。情節重大者處新台幣 15 萬至 1,500 萬元，且可直接裁罰，無須先命限期改正（[iThome](https://www.ithome.com.tw/news/156904)）。
- **2025 年修正：**
  - 2025 年 10 月 17 日三讀通過；2025 年 11 月 11 日公布。施行日期由行政院定之（[PDPC 籌備處](https://www.pdpc.gov.tw/News_Content/20/1010/)、[理律](https://www.leeandli.com/TW/NewslettersDetail/7532.htm)）。
  - 對民間企業，新增超過一定門檻時**須向個資會通報事故**的強制義務，並刪除延遲通知當事人的例外事由。
  - 允許個資會就安全維護缺失逕行裁罰而無須先行命令改正，並賦予個資會限制國際傳輸的權限。
  - **並未**要求民間企業設置個資保護長（DPO）（該義務僅適用於公務機關）。
  - 各目的事業主管機關在個資會成立後 6 年內，得保留其監督職權。
- **個資會（PDPC）現況：**
  - 組織法已於 2025 年 3 月 27 日經行政院會通過，並已完成立法院委員會審查（[PDPC](https://www.pdpc.gov.tw/News_Content/20/1001/)、[行政院](https://www.ey.gov.tw/Page/9277F759E41CCD91/747cda78-926f-4205-99b3-1a735fc1b97b)）。
  - 截至 2026 年 9 月，我**無法確認**該法已三讀通過，或個資會已正式成立。pdpc.gov.tw 網站仍以籌備處自稱。**[待驗證——請直接查核]**
- **實務要點：**
  - **企業使用：** 客戶為資料控管者（controller），ELIVO 為受委託機關（處理者，processor）。
  - **個人及家庭使用：** 適用豁免（第 51 條），但顧問或業務人員在工作上使用 ELIVO 則不在此限。
  - **生物特徵資料：** 依我的解讀，聲紋屬個人資料（第 2 條列舉「特徵」及指紋），但不屬第 6 條的特種個資類別。**[我的解讀；請與律師確認]**
- **人工智慧基本法（Taiwan AI Basic Act）：** 2025 年 12 月 23 日三讀通過；主管機關為國家科學及技術委員會（國科會）。本法以原則為基礎（隱私、透明、問責），目前尚無直接的產品義務（[CNA](https://www.cna.com.tw/news/aipl/202512230036.aspx)、[moda](https://moda.gov.tw/press/press-releases/18316)）。

### 1.2 日本
- 沒有一般性法律將參與者錄下自己參與之對話的行為入罪 **[待驗證；一般實務理解]**。APPI（個人情報保護法）仍要求通知或公開利用目的、提供第三人須經同意，以及跨境傳輸須經同意（或具同等保護機制）。
- 依 APPI 施行令，聲紋屬於「個人識別符號」 **[憑記憶；請查證]**。
- **2026 年 APPI 修正：** 國會於 2026 年 7 月 10 日通過，2026 年 7 月 17 日公布。將於 2 年內以政令施行，約在 2028 年中以前。本次修正**首度引進行政罰款（課徵金）**，放寬 AI 與統計用途的同意要求，並新設「特定生物特徵個人資訊」類別，適用更嚴格的透明度規則（[Mori Hamada](https://www.morihamada.com/en/insights/newsletters/138006)、[Biometric Update](https://www.biometricupdate.com/202604/japan-introduces-new-rules-on-biometric-data-in-appi-amendment-bill)、[dig.watch](https://dig.watch/updates/japan-appi-personal-data-ai-fines)）。

### 1.3 新加坡
- 沒有法律禁止錄下自己參與的對話。然而當**組織**進行錄音時，PDPA（個人資料保護法）要求告知並取得同意，而同意可為視為同意（deemed consent）。罰則最高可達新加坡營業額的 10%（營業額超過 S$10M 者）或 S$1M（[SingaporeLegalAdvice](https://singaporelegaladvice.com/can-an-organisation-record-a-conversation-without-consent/)、[Recording Law SG](https://www.recordinglaw.com/world-laws/world-recording-laws/singapore-recording-laws/)）。

### 1.4 香港
- PDPO（個人資料（私隱）條例）要求在蒐集時告知目的（DPP1，保障資料第 1 原則）。未發現對參與者錄音的一般性刑事禁令 **[待驗證]**。
- 個人資料私隱專員公署（PCPD）已發布員工使用生成式 AI 指引（2025）及代理式 AI 指引（2026）。代理式 AI 指引警告，*新的*蒐集行為或新的處理者可能超出既有私隱聲明的範圍（[PCPD AI](https://www.pcpd.org.hk/english/artificial_intelligence/index.html)、[Bird & Bird](https://www.twobirds.com/en/insights/2025/china/gen-ai-at-work-hong-kong-privacy-commissioner)、[Lexology](https://www.lexology.com/library/detail.aspx?g=60bdd4af-8436-4f89-bf05-79859385a6e1)）。

### 1.5 中國大陸（PIPL）
- 生物特徵資料屬敏感個人資訊。須取得**單獨同意**（PIPL Arts. 28–29，個人資訊保護法第 28–29 條），跨境傳輸亦須單獨同意（Art. 39，第 39 條）。
- 跨境認證辦法自 2026 年 1 月 1 日起施行。一年內傳輸 ≤10 萬人的非敏感個人資訊，可豁免安全評估、標準合約及認證，但**不**豁免同意或影響評估義務（[China Briefing](https://www.china-briefing.com/news/china-cross-border-data-transfer-certification/)、[Arnold & Porter](https://www.arnoldporter.com/en/perspectives/advisories/2025/11/china-issues-clarifications-cross-border-data-transfer-rules)）。
- **建議：** 第一階段不要以台灣基礎設施服務中國大陸使用者。

### 1.6 美國
- **聯邦法（ECPA，電子通訊隱私法）採一方同意。** 關鍵例外是「犯罪或侵權」目的，而 Otter 案判決顯示，*廠商*自身的攔截行為與其使用者的行為是分開判斷的。
- **全體同意州：** CA、DE、FL、IL、MD、MA、MT、NV、NH、PA 及 WA。CT、MI、OR 及 VT 則為混合制（[Recording Law](https://www.recordinglaw.com/party-two-party-consent-states/)、[Layer3](https://www.layer3labs.io/guides/two-party-consent-states)）。由於視訊通話可能有位於全體同意州的與會者，應以**全體告知**為設計前提。
- **California CIPA（加州隱私侵害法）：** SB 690 於 2026 年 9 月通過州議會。其範圍已**縮減**：刪除了寬泛的「商業營運目的」豁免，現在僅將網站 pen-register 與 trap-and-trace 請求移交州檢察總長處理。對筆記工具提告所用的 §§631/632 條文未受影響。若經簽署，將於 2027 年 1 月 1 日生效（[Sidley](https://www.sidley.com/en/insights/newsupdates/2026/09/californias-sb-690-clears-the-legislature-what-it-means-for-cipa-website-tracking-claims)、[CIPAWorld](https://cipaworld.com/2026/07/03/senate-bill-690-amended-california-scales-back-its-proposed-cipa-overhaul-by-eliminating-the-commercial-business-purpose-exemption-heres-what-the-latest-means-for-cipa-lit/)）。
- **生物特徵：**
  - **Illinois BIPA：** 要求書面告知、書面授權（written release），以及公開的保存與銷毀期程表。2024 年 SB 2979 修正案將求償限制為每人每種方式一次，並允許電子簽章（[Seyfarth](https://www.seyfarth.com/news-insights/bipa-legislative-update-governor-pritzker-signs-amendment-limiting-damages-to-a-single-recovery-1.html)）。第七巡迴上訴法院認定該修正案具溯及效力（[ABA](https://www.americanbar.org/groups/business_law/resources/business-law-today/2026-may/7th-circuit-holds-bipa-damages-remedy-applies-retroactively/)）。
  - **Colorado HB24-1130：** 自 2025 年 7 月 1 日起施行，涵蓋聲紋，且不賦予私人訴權（[Colorado GA](https://leg.colorado.gov/bills/hb24-1130)）。
  - Texas CUBI 及 Washington 的生物特徵法亦適用 **[未詳細研究]**。

### 1.7 歐盟
- **GDPR：**
  - 錄音需要合法基礎（通常為同意，或搭配顯著告知的正當利益）。
  - 語音資料只有在「為唯一識別」某人之目的而處理時，才成為 Art. 9（第 9 條）**特種類別**資料。因此語者辨識需要明示同意；不涉及身分的語者分段則可主張不需要。
  - 極可能需要進行 DPIA（資料保護影響評估）（Art. 35，第 35 條）。
  - 台灣**未取得歐盟適足性認定**，因此在台灣處理歐盟資料需要 SCCs（標準契約條款）**[請查證]**。使用歐盟託管區域即可避免此問題。
- **各國刑法：** 德國 §201 StGB（刑法典）將未經同意錄製非公開言論的行為入罪（[gesetze-im-internet.de](https://www.gesetze-im-internet.de/stgb/__201.html)）。實務上等同全體同意。
- **EU AI Act：**
  - **Art. 5(1)(f)：** 自 2025 年 2 月 2 日起，禁止在*職場或教育場域*推斷自然人情緒的 AI，醫療或安全理由除外。罰款最高達 €35M 或營業額的 7%（[Bird & Bird](https://www.twobirds.com/en/insights/2025/global/ai-and-the-workplace-navigating-prohibited-ai-practices-in-the-eu)）。
  - **執委會 2025 年 2 月 4 日指引所釐清的事項**（[FPF](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/)、[Lewis Silkin](https://www.lewissilkin.com/insights/2025/02/17/understanding-the-eu-ai-acts-prohibited-practices-key-workplace-and-advertising-102k011)）：
    - 從**文字**推斷情緒不在禁止範圍內。
    - 疲勞等生理狀態不在禁止範圍內。
    - 推斷**客戶**（而非員工）的情緒不在禁止範圍內，但仍屬 Annex III（附件三）高風險用途，並觸發 Art. 50(3) 揭露義務。
  - **對 ELIVO 的意涵：**
    - **在歐盟禁止：** 從內部會議中同事的語音韻律或影像得出「你的團隊聽起來很沮喪」。
    - **允許：** 以文字為基礎的「關於定價的討論轉為負面」。
    - **高風險且須揭露：** 在銷售通話中對潛在客戶進行語音情緒評分。
  - **Digital Omnibus 之後的時程：**
    - Omnibus 於 2026 年 5 月 6 日達成協議，並於 2026 年 7 月生效；我找到的規則編號 2026/1744 **[待驗證]**。
    - Annex III 高風險義務延至 **2027 年 12 月 2 日**，Annex I（附件一）義務延至 2028 年 8 月 2 日。
    - **Art. 50 透明度義務依原定計畫自 2026 年 8 月 2 日起適用**，既有系統的 Art. 50(2) 標示義務寬限期至 2026 年 12 月 2 日。
    - AI 素養義務放寬為「支持發展」員工的 AI 素養。
    - 來源：[Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)、[CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/)。
  - 將語音比對至已知身分的**語者辨識**可能構成「遠端生物特徵辨識」，自 2027 年 12 月起屬 Annex III 高風險。不涉及身分的語者分段較為安全。**[分析；請與歐盟律師確認]**

---

## 2. 訴訟與爭議，以及設計教訓

| 案件／事件 | 事實 | 現況（2026 年 9 月） |
|---|---|---|
| **In re Otter.AI Privacy Litigation**，No. 5:25-cv-06911-EKL (N.D. Cal.)，合併 Brewer（2025 年 8 月 15 日）、Walker、Theus 及 Winston 等案 | 一名非使用者的銷售通話遭自動加入的 OtterPilot 錄音；錄音據稱被用於訓練 | **2026 年 8 月 13 日：** ECPA、CIPA §631、兩項 BIPA 聲紋請求、UCL（不公平競爭法）及不當得利請求**均存活**。CFAA、CDAFA、Washington 州法請求及大部分普通法隱私請求遭駁回，但允許修正後再提。法院認定 Otter「獨立蒐集、保存並使用」資料，因此不只是其使用者的錄音機（[Recording Law](https://www.recordinglaw.com/news/otter-ai-wiretap-lawsuit-explained/)、[UC Today](https://www.uctoday.com/productivity-automation/otter-ai-fails-to-dismiss-core-privacy-claims-in-u-s-court/)、[起訴狀](https://www.fisherphillips.com/a/web/x27EBgcvus2uFdfXMJiyCk/aAQ5CP/brewer-v-otterai.pdf)） |
| **Cruz v. Fireflies.AI**，3:25-cv-03399 (C.D. Ill.，2025 年 12 月 18 日)；**Fricker v. Fireflies.AI**，1:26-cv-02675 (N.D. Ill.，2026 年 3 月) | 「Speaker Recognition（語者辨識）」據稱在未依 BIPA 告知、取得授權或訂定保存政策的情況下，建立非使用者的聲紋 | 審理中（[NatLawReview](https://natlawreview.com/article/ai-meeting-assistants-and-biometric-privacy-governance-lessons-firefliesai-lawsuit)、[tl;dv 摘要](https://tldv.io/blog/ai-meeting-recorder-lawsuits/)） |
| **Chamberlain v. Granola**，3:26-cv-07926 (N.D. Cal.，2026 年 7 月 30 日) | 無機器人方式擷取麥克風與系統音訊。訓練據稱**預設開啟**，僅提供個別使用者選擇退出。對與會者的告知為選用且預設關閉。行銷文案稱「其他人……不會知道它的存在」。 | 新近提起（[PPC Land](https://ppc.land/granola-sued-for-recording-meetings-without-consent-to-train-ai-models/)、[PacerMonitor](https://www.pacermonitor.com/public/case/65990958/Chamberlain_v_Granola,_Inc_et_al)） |
| **Zoom ToS，2023 年 8 月** | ToS §10.4 看似允許以客戶資料訓練 AI。遭強烈反彈後，於 8 月 7 日修訂，8 月 11 日再修訂為*不*以任何客戶音訊、影像、聊天或內容訓練 Zoom 或第三方模型 | 已成定規：「不以客戶內容訓練」（[TechCrunch](https://techcrunch.com/2023/08/08/zoom-data-mining-for-ai-terms-gdpr-eprivacy/)、[Business Standard](https://www.business-standard.com/companies/news/zoom-walks-back-on-new-terms-of-service-after-backlash-over-user-data-123081600464_1.html)） |
| **機構禁用** | UMass 禁用 Otter 與 MeetGeek（2024）。Harvard 禁止 AI 會議助理（2025 年 2 月）。UW 封鎖 Read AI（2025 年 1 月），Chapman 亦然（2025 年 8 月）。UC Riverside 限制非原生機器人（2025 年 10 月）。Oxford 移除機器人存取權並封鎖 SSO 註冊（2025 年 8 月）。公開理由：Read AI **自動加入使用者未出席的會議**，並跨平台追蹤使用者 | （[Crimson](https://www.thecrimson.com/article/2025/2/12/updated-ai-guidelines/)、[Chapman](https://blogs.chapman.edu/information-systems/2025/08/13/security-notice-regarding-read-ai/)、[Oxford](https://www.infosec.ox.ac.uk/article/are-your-online-meetings-safe-from-third-party-ai-bots)、[UMass](https://dailycollegian.com/2024/04/umass-information-technology-places-ban-on-transcription-platforms-otter-ai-and-meetgeek/)） |
| **平台反制措施** | Microsoft Teams 在大廳將外部機器人標示為「Unverified（未驗證）」，且預設須由主辦人明確准許入會。管理員可封鎖偵測到的機器人。2026 年 5 月開始推出，預計 2026 年 10 月全面上線（GA） | （[BleepingComputer](https://www.bleepingcomputer.com/news/microsoft/microsoft-teams-will-tag-third-party-bots-in-meeting-lobbies/)、[Topedia](https://blog-en.topedia.com/2026/05/meeting-bot-detection-in-microsoft-teams/)） |
| **Cluely**（a16z 投資的即時會議副駕駛） | 上市行銷口號為「Cheat on everything（什麼都能作弊）」，刻意設計成無法被察覺。執行長於 2026 年 3 月承認曾捏造 $7M ARR 的說法 | 「隱形即時 AI」的聲譽警示案例（[Inc.](https://www.inc.com/leila-sheridan/an-a16z-backed-startup-that-helps-people-cheat-on-job-interviews-just-got-caught-in-a-7-million-lie-the-ceo-was-sweating/91313070)、[Wikipedia](https://en.wikipedia.org/wiki/Cluely)） |

**設計教訓：**
1. **預設絕不以客戶內容訓練。** 將其寫入合約（DPA，資料處理協議），並以**全管理範圍**的開關強制執行。預設選擇加入訓練，是 Otter 與 Granola 起訴狀的共同主線。
2. **可見的揭露，預設開啟。** 使用畫面指示標記、自動聊天訊息，以及實體場合的語音或視覺告知。在全體同意法域，使用者不得完全隱藏該揭露。絕不以隱形作為行銷訴求。
3. **絕不加入或錄製使用者未出席的會議。** 預設不依行事曆自動加入。
4. **預設不保存持久聲紋。** 語者辨識應依每位登錄者個別選擇啟用，並取得 BIPA 式書面授權，公開保存與銷毀期程表。
5. **預設短期保存、由客戶控制刪除，且刪除須連帶傳遞**至衍生的向量嵌入與索引。
6. **無機器人架構如今在策略上更有利**，因為各平台正在把機器人擋在門外。不過同意的負擔會轉移到使用者身上，因此 ELIVO 必須*協助*使用者進行告知。

---

## 3. 企業信任要求

- **SOC 2 Type II：**
  - 小型公司的稽核費用約 $8–20k；第一年總成本（平台、稽核、滲透測試）約 $30–80k 以上。
  - Vanta 與 Drata 的合作稽核機構宣傳新創價格約 $2.5k 起。Drata 入門方案約每年 $7.5–15k。
  - Type II 需要 3–12 個月的觀察期。新創常見路徑：約 2–3 個月取得 Type I，再經 3 個月的 Type II 觀察期，約 6–9 個月取得報告（[Vanta](https://www.vanta.com/collection/soc-2/soc-2-audit-cost)、[Comp AI](https://www.trycomp.ai/soc-2-cost)、[Workstreet](https://www.workstreet.com/blog/soc-2-audit-cost)）。
- 台灣與日本企業對 **ISO 27001** 的期待高於 SOC 2 **[實務界共識；待驗證]**。
- **ISO/IEC 27701:2025** 於 2025 年 10 月 14 日發布，成為**獨立**的隱私管理系統，不再以 27001 為前提（[ISO](https://www.iso.org/standard/27701)、[BSI](https://www.bsigroup.com/en-IE/products-and-services/standards-services/iso-iec-27701-key-changes-and-guidance/)）。
- **ISO/IEC 42001**（AI 管理系統）：新創估計約 $15–40k、4–6 個月（[Workstreet](https://www.workstreet.com/blog/iso-42001-for-startups)、[Elevate](https://elevateconsult.com/insights/iso-42001-certification-timeline-budget-for-founders/)）。對歐盟與金融業買家有用，但屬較後期的工作。
- **標準企業檢核清單：**
  - SSO（SAML/OIDC）與 SCIM 帳號佈建。
  - 角色型存取控制、稽核日誌，以及管理員保存政策。
  - 附再委託處理者清單（包含 LLM 與 ASR 供應商）及「不訓練」條款的 DPA。
  - 區域資料落地（台灣、日本、歐盟、美國）、BYOK/KMS，以及滲透測試報告。
  - 信任中心（trust center）與事故通知 SLA。
- **台灣特有要求：**
  - **資通安全管理法（Cyber Security Management Act），2025 年 9 月 24 日修正公布：** 首次全面翻修。公務機關不得使用危害國家資通安全的產品（實務上指中國大陸品牌產品），且限制可延伸至指定的非公務機關。同時擴大稽核範圍（[理律](https://www.leeandli.com/TW/NewslettersDetail/7505.htm)、[CNA](https://www.cna.com.tw/news/aipl/202508290240.aspx)）。ELIVO 在任何銷售給政府、關鍵基礎設施或金融業的產品中，都應避免使用源自中國大陸的模型、SDK 與雲端供應商，並能以 SBOM（軟體物料清單）與模型來源證明加以佐證。
  - **行政院生成式 AI 參考指引：** 公務人員不得將機密文件或個人資料輸入生成式 AI（[行政院](https://www.ey.gov.tw/Page/448DE008087A1971/40c1a925-121d-4b6b-8f40-7e9e1a5401f2)）。除非 ELIVO 能地端部署，否則政府並不適合作為早期市場。
  - **金融業（金管會，FSC）：** 依作業委外規範（金融機構作業委託他人處理內部作業制度及程序辦法，2023 年修正，採風險基礎），重大消費金融系統的客戶資料原則上應**存放於台灣**。若未經核准存放於境外，則須在台灣保留備份（[FSC 法規資料庫](https://law.fsc.gov.tw/LawContent.aspx?id=FL040528)、[FSC 新聞稿](https://www.fsc.gov.tw/ch/home.jsp?id=96&parentpath=0%2C2&mcustomize=news_view.jsp&dataserno=202308040001&toolsflag=Y&dtable=News)）。金管會的金融業運用人工智慧(AI)指引（2024 年 6 月）另增加治理、隱私及可解釋性的期待（[FSC](https://www.fsc.gov.tw/ch/home.jsp?id=96&parentpath=0%2C2&mcustomize=news_view.jsp&dataserno=202406200001&dtable=News)）。
  - **地端部署需求：** 受監理的台灣買家對資料出境相當謹慎。台灣大哥大（與 NVIDIA 合作）及中華電信（CHT AI Factory）等電信業者銷售在地與私有 AI 部署方案（[台灣產業報導的搜尋摘要](https://www.bnext.com.tw/article/83490/ai-on-premises-qa)）。PwC 報告指出僅 5% 的台灣企業高度信任生成式 AI **[二手引用；待驗證]**。規劃上應**優先建置台灣託管區域**（例如台灣雲端區域或在地 IDC 機房），再推出私有雲或設備型（appliance）SKU。未來的桌上型裝置也可兼作地端邊緣節點。

---

## 4. 市場進入策略

**競爭者成長模式：**

| 公司 | 成長路徑 | 數據 |
|---|---|---|
| **Otter** | 免費增值消費者 → 團隊 → 企業 | ARR $100M（2025）、3,500 萬使用者、員工不到 200 人（[BusinessWire](https://www.businesswire.com/news/home/20251222704206/en/Otter.ai-Caps-Transformational-2025-with-$100M-ARR-Milestone-Industry-first-AI-Meeting-Agents-and-Global-Enterprise-Expansion)） |
| **Fireflies** | 機器人病毒式擴散：每場會議都讓非使用者接觸到產品 | 自 2023 年起獲利，透過次級市場交易取得 $1B 估值（2025 年 6 月）、2,000 萬使用者，印度為前三大市場（[Fireflies](https://fireflies.ai/blog/fireflies-1-billion-valuation)）。同樣的病毒式擴散也造成了其法律風險。 |
| **Fathom** | 慷慨的個人免費方案，付費團隊方案 | ARR $1M → $10M → $30M（2023–2025）**[getlatka／二手資料；待驗證]**；2024 年完成 $17M A 輪（[TechCrunch](https://techcrunch.com/2024/09/19/ai-notetaker-fathom-raises-17m/)） |
| **Read AI** | 機器人病毒式擴散，加上跨應用程式的「copilot everywhere（無所不在的副駕駛）」 | $50M B 輪，當時每週新增 10 萬個帳號（[GeekWire](https://www.geekwire.com/2024/seattle-startup-read-ai-raises-50m-to-fuel-copilot-everywhere-vision-for-enterprise-software/)）；後遭多所大學禁用 |
| **Granola** | 無機器人 Mac App，設計導向，在創投與創辦人圈口耳相傳 | $125M C 輪，估值 $1.5B（2026 年 3 月），約 15k 家企業客戶，ARR 成長超過 400%（[TechCrunch](https://techcrunch.com/2026/03/25/granola-raises-125m-hits-1-5b-valuation-as-it-expands-from-meeting-notetaker-to-enterprise-ai-app/)）；目前遭起訴（見 §2） |
| **Plaud** | 硬體加訂閱 | 出貨超過 200 萬台裝置，軟體 ARR 逾 $100M（2026 年 6 月）（[TechCrunch](https://techcrunch.com/2026/06/16/plaud-says-its-software-business-topped-100m-in-arr-after-shipping-over-2m-ai-notetakers/)）。這驗證了 ELIVO 的裝置路線圖。 |
| **Limitless** | 穿戴式裝置 | 2025 年 12 月被 Meta 收購；硬體停產（[CNBC](https://www.cnbc.com/2025/12/05/meta-limitless-ai-wearable.html)） |
| **台灣在地業者** | 逐字稿 | 雅婷逐字稿（Yating，支援台灣口音與台語，無即時字幕）、Plaud TW、秒聽錄音（Tinrec）（[Tinrec 評測](https://tinrec.com/blog/8229)） |

**建議的成長路徑：**
- 針對**個人採用 PLG（產品驅動成長）**（顧問、產品經理、研究人員），搭配**無機器人 Mac App 與可見的與會者告知**。之後再為業務與顧問公司加入**業務協助的團隊方案**。
- 台灣的**企業與受監理產業交易**重視關係，須透過系統整合商、電信業者（中華電信、台灣大哥大）及 Microsoft 合作夥伴通路 **[實務觀點；待驗證]**。
- **切入點：** 逐字稿已商品化，因此應以*從使用者自身文件、電子郵件與過往會議中即時檢索*作為差異化。另外也以**華語／英語語碼轉換及台灣口音辨識準確度**作為差異化。
- **亞太地區推進順序：** 先台灣，再日本（隱私文化強、付費意願高；應考慮在地化及日本資料區域），接著以新加坡作為區域總部及東南亞企業市場樞紐。

**台灣資金與支援（2025–2026）：**
- **國發基金創業天使投資方案（National Development Fund angel program）：** 每家公司最高新台幣 2,000 萬元，與資產管理規模 ≥US$1B 的機構共同投資時最高新台幣 3,000 萬元，含後續投資累計最高新台幣 1 億元。資格：公司成立未滿 8 年且募資 ≤ 新台幣 1 億元。開放至 2030 年（[國發基金](https://www.df.gov.tw/cp.aspx?n=D96B18C3BC73D5B5&s=B97E7588060C2084)、[angelinvestment.org.tw](https://www.angelinvestment.org.tw/introduction)）。
- **SBIR（自 2026 年 1 月 1 日起）：** Phase 1 為期 6 個月、最高新台幣 150 萬元，以簡報取代書面計畫書。Phase 2 每年最高新台幣 600 萬元（2 年新台幣 1,200 萬元）。Phase 2+ 最高新台幣 600 萬元，並新增專利費用補助（[旺得富/工商](https://wantrich.chinatimes.com/news/20251230900432-420501)、[SBIR](https://sbir.org.tw/sbir/info)）。
- **臺北市產業發展獎勵補助（Taipei SITI）：** 研發補助最高新台幣 500 萬元；成立未滿 1 年的臺北市公司可獲新台幣 100 萬元創業補助；隨到隨審（[SITI](https://industry-incentive.taipei/)）。
- **桃園：** A8 智慧產業加速器（[桃園青年局](https://youth.tycg.gov.tw/cp.aspx?n=22446)）及 Plug and Play Taoyuan 計畫（[工商時報](https://www.ctee.com.tw/news/20250625702153-431204)）。
- **加速器：**
  - **AppWorks：** 不取得股權；AW#33 截止日為 2026 年 7 月 19 日；聚焦 AI（[AppWorks FAQ](https://appworks.tw/accelerator-faq/)）。
  - **Garage+（時代基金會，Epoch Foundation）：** F26 梯次，申請期間 2026 年 6 月 16 日至 8 月 31 日，計畫期間 12 月 5–12 日；獎金 US$25–50k（[Garage+](https://garageplus.asia/en/startupglobalprogram)）。
  - **Taiwan Tech Arena（國科會，NSTC）：** CES 與 VivaTech 參展代表團（[TTA](https://www.taiwanarena.tech/)）。
  - **Startup Island TAIWAN：** 國家發展委員會的國家新創品牌，設有矽谷及東京據點（[NDC](https://www.ndc.gov.tw/en/Content_List.aspx?n=7D09AF77A1259036)）。
  - **NTU Garage（臺大車庫）：** 需有臺大相關背景的創辦人；2027 梯次約於 2026 年 12 月開放（[NTUTEC](https://tec.ntu.edu.tw/garage)）。
- **種子輪規模：**
  - 台灣 2024 年各階段交易中位數約 US$1.96M（平均 US$5.83M）。國內投資人 2015 年至 2025 年第一季的中位數約 US$1.08M（[FINDIT 年度報告](https://findit.org.tw/en/Res/2573)；擷取時該頁面回傳 503，數據取自搜尋摘要）。
  - 因此台灣典型種子輪約為 **US$0.5–2M** **[推論]**。美式 AI 應用種子輪約 $2M 以上。
- **YC：**
  - 未發現 YC 對會議工具的明確立場。YC 曾投資 Circleback（W24）等會議筆記工具（[TechCrunch](https://techcrunch.com/2024/11/26/yc-backed-circleback-is-out-to-become-the-best-meeting-notetaker)）。
  - 其目前的 Requests for Startups（徵求新創主題）偏好*實際完成工作*的 AI，而非副駕駛（[YC RFS](https://www.ycombinator.com/rfs)）。
  - 應將 ELIVO 定位為會*採取行動*的會議代理（草擬後續信件、調出合約條款、更新 CRM），而非又一個筆記工具。

---

## 5. 客戶探索與「有幫助的洞察」之衡量

**訪談問題（Mom Test 風格：問過去的行為，而非假設情境）：**
1. 請談談最近一次你缺少某個你知道存在於某處的事實的會議。那是什麼、在哪裡，結果發生了什麼事？
2. 重要會議前的 10 分鐘你會做什麼？你會打開什麼？
3. 會議中你會搜尋任何東西嗎？用哪個裝置？多常是偷偷進行的？
4. 上次有筆記機器人出現在你的會議中時發生了什麼事？有客戶反對嗎？
5. 你們公司由誰決定是否允許使用錄音工具？是否曾有東西被封鎖？
6. 業務人員：你目前如何得知競爭者被提及或出現價格異議，速度多快？
7. 如果對方知道你有 AI 助理，會議會有所不同嗎？請以真實例子說明。
8. 什麼情況會讓你永久關閉助理？（探詢打斷的容忍門檻。）
9. 你今天付費使用哪些工具（Otter、Copilot、Plaud、雅婷），由誰核准，用途為何？
10. 哪些文件或電子郵件你*絕不*讓工具讀取？

**驗證實驗：**
- **Wizard-of-Oz（綠野仙蹤測試）：** 由真人分析師（經同意）旁聽，並在 20–30 場真實會議中將洞察卡片推送至側邊螢幕。在建置即時機器學習之前，先衡量使用情形與付費意願。
- **回溯重播：** 會後提供使用者「我們原本會顯示的洞察」。使用者將每張卡片評為有幫助、中性或干擾。這能以低成本取得精確度標註。
- **假門／預售：** 以華語、英語及日語為三個客群製作登陸頁。向 3–5 個顧問或業務團隊收集付費意向書（LOI）。
- **同意摩擦測試：** 衡量在可見告知開啟時與會者提出反對的頻率，以及使用者放棄使用的會議比例。
- **準確度基準測試：** 以真實台灣會議音訊，比較華語、英語及台語語碼轉換 ASR 的字詞錯誤率（WER），對照雅婷、Whisper 等級模型及平台原生字幕。

**指標：**
- 所呈現洞察的**精確度（Precision）**：被評為有用或被採取行動（展開、釘選、複製、說出）的比例。
- **誤打斷率：** 每會議小時中無幫助或造成干擾的卡片數。設定預算，例如在打斷模式下每小時 ≤1 張。
- **召回率代理指標：** 會後問卷中系統未能捕捉到的「我當時希望有 X 的時刻」。
- **延遲：** 從觸發需求的發言到卡片出現的時間。
- **對話流暢度成本：** 說話停頓與視線移開時間，加上 NASA-TLX 工作負荷分數。
- **留存率：** 開啟即時模式的使用者第 4 週留存率，與僅使用逐字稿的使用者比較。

**研究依據：**
- **Horvitz（CHI 1999），混合主動原則：** 在對使用者目標存在不確定性的情況下，只有當行動的*期望效用*高於不行動時才採取行動。採用分級行動：不做任何事、安靜地提供、詢問，或直接行動。並考量時機不佳的成本（[PDF](https://erichorvitz.com/chi99horvitz.pdf)）。
- **Amershi et al.（CHI 2019），18 項人機互動 AI 指引：** 特別是 G3「依脈絡安排服務時機」及 G4「顯示與脈絡相關的資訊」（[ACM](https://dl.acm.org/doi/10.1145/3290605.3300233)）。
- **打斷成本相關文獻：**
  - Mark、Gudith 與 Klocke（CHI 2008），〈The cost of interrupted work〉（[ACM](https://dl.acm.org/doi/10.1145/1357054.1357072)）。
  - Adamczyk 與 Bailey（CHI 2004）：在任務邊界打斷的成本較低（[ACM](https://dl.acm.org/doi/10.1145/985692.985715)）。
  - 以上兩項引用皆憑記憶；請查證。
- **近期研究：**
  - CHI 2025〈Are We On Track?〉：會議中主動的 AI 提示若頻繁或時機不佳會讓人感到侵擾；被動顯示的效果較佳（[arXiv](https://arxiv.org/abs/2504.01082)）。
  - CHI 2025 主動式程式設計助理：持續出現的建議被評為「分心／惱人」，而存在指示標記可減少干擾（[ACM](https://dl.acm.org/doi/10.1145/3706598.3714002)、[ACM](https://dl.acm.org/doi/10.1145/3706598.3713357)）。
  - CHI 2025，在設計團隊中調解衝突的主動式語音代理（[ACM](https://dl.acm.org/doi/10.1145/3706598.3713457)）。
  - **InsightToast**（arXiv，2026 年 8 月）：以周邊、一瞥即懂的「toast（浮動通知）」呈現主動檢索結果，能維持自然的對話流暢度（N=16）（[arXiv](https://arxiv.org/abs/2608.31115)）。這與 ELIVO 的概念非常接近。
- **設計意涵：** 預設採用**周邊、一瞥即懂的側邊通道**。只有在信心度乘以重要性超過高門檻時才升級為打斷式提醒，並讓使用者可自行調整該門檻。

---

## 6. 「ELIVO」品牌與商標檢查（非正式檢索結論）

**商標：**
- **USPTO：** 申請號 **99496372**，「ELIVO」（風格化房屋標誌），權利人 **Majestyhub LLC**，指定於排水塞、馬克杯及便當盒等家用品（[uspto.report](https://uspto.report/TM/99496372)）。類別看似為第 21 類及類似類別，**並非**第 9 或 42 類，因此衝突風險看似較低。我無法開啟 TSDR 確認類別或狀態 **[待驗證]**。
- **TIPO、EUIPO 及 WIPO：** 我無法直接查詢這些資料庫。應針對第 **9、42、35 及 38** 類執行 TIPO（智慧局商標檢索）、WIPO Global Brand Database 及 EUIPO TMview 檢索，並包含近似商標（ELIO、ELEVO、ELYVO、ELAI）。

**使用此名稱的企業：**

| 名稱 | 性質 | 可能涉及的類別 |
|---|---|---|
| Elivo (elivo.co) | AI「生活管家」及生活教練 App | 重疊程度最高：AI 助理軟體，第 9/42 類 |
| Elivo (elivo.io) | 飯店管理與分析軟體 | 第 9/42 類 |
| ELIVO (elivo.org) | 立陶宛設計與開發工作室 | — |
| Elivo AB | 瑞典公司，見於 LinkedIn | — |
| Elivo Media | 數位行銷代理商 | — |

- elivo.app 架設的是中國 A 股股票研究網站。
- 來源：[elivo.co](https://elivo.co/)、[elivo.io](https://www.elivo.io/en/)、[elivo.org](https://elivo.org/)、[LinkedIn](https://www.linkedin.com/company/elivo-ab)。

**網域（我於 2026-09-29 執行的 RDAP 查詢）：**

| 網域 | 狀態 |
|---|---|
| elivo.com | 自 2002-04-02 註冊，2027-04-02 到期；網站無回應 |
| elivo.ai | 2024-10-10 註冊，**2026-10-10 到期**，已設定所有 client 鎖定；網站無回應。值得持續關注或透過仲介洽詢。 |
| elivo.io | 已註冊，2026-10-16 到期（即飯店軟體） |
| elivo.org | 2025-05-25 註冊 |
| elivo.app | 2026-01-27 註冊 |
| elivo.co | 運作中（生活管家 App）；註冊局查詢失敗 |
| getelivo.com、tryelivo.com、useelivo.com | **看似未註冊**（Verisign 404） |
| elivo.tw、elivo.com.tw | **看似未註冊**（TWNIC 404；以 google.tw 作為對照組回傳 200） |

- **意聯：** 網路搜尋未發現名為意聯的台灣公司或商標。最接近的是意騰科技（Intelligo，TWSE 7749-KY），一家語音／音訊晶片公司。名稱不同，但屬相鄰領域（語音）。
- **建議：** 直接查詢經濟部公司登記資料（商工登記）及 TIPO，並及早就第 9/42 類提出 TIPO 及馬德里（Madrid）申請。
- **整體評估：**「ELIVO」已被多家小型軟體公司使用，其中包括一家 AI 助理。在軟體領域中，它並非強勢、明確可獨占的商標。在投入品牌建設之前，應委託專業檢索。

---

## 合規即設計（Compliance-by-design）檢核清單

1. **不以客戶內容訓練。** 預設關閉，由管理員在整個工作區強制執行，並寫入 DPA 與 ToS。再委託處理的 LLM 必須零保存、不訓練。
2. **預設可見的揭露。** 畫面上的「ELIVO 正在轉錄」標章、自動聊天訊息或開場告知，以及裝置上的燈號、聲音或語音提示。在全體同意法域更加嚴格（美國 11 個全體同意州、德國及歐盟）。
3. **與會者權利。** 會議中任何人都可透過告知中的連結要求暫停或刪除。提供「敏感段落暫停」控制項。
4. **在場偵測。** 僅在擁有者為現場參與者時錄音。不自動加入無人出席的會議。擁有者離開時裝置即停止。
5. **生物特徵。** 預設採用不保存持久聲紋的語者分段。語者辨識須經每人個別書面選擇啟用，並公開保存與銷毀期程表（BIPA、GDPR Art. 9、Colorado）。
6. **EU AI Act。**
   - 在任何市場版本中，都不對員工或同事進行語音、臉部或影像情緒推斷（最簡單的做法）。
   - 僅以文字判斷的「討論語氣」須如實標示。
   - 客戶情緒功能關閉，若日後建置則視為高風險。
   - 依 Art. 50 揭露使用者正在與 AI 互動，以及內容為 AI 生成。
7. **資料最小化與保存。** 可設定的保存期限（例如 30/90/365 天）。預設在轉錄後刪除音訊。刪除連帶套用至向量嵌入、索引及備份。
8. **資料落地。** 優先台灣區域；接著日本、歐盟及美國區域。為金融業客戶提供台灣備份選項。路線圖中納入地端或設備型 SKU。
9. **供應鏈來源。** 政府、金融或關鍵基礎設施 SKU 中不使用源自中國大陸的模型、SDK 或雲端（資安法）。維護 SBOM 與模型登錄簿。
10. **資安計畫。** 先 SOC 2 Type I，再 Type II（Vanta 或 Drata），以及 ISO 27001。隱私方面採 ISO 27701:2025。當企業開始要求 AI 治理時再導入 ISO 42001。
11. **外洩事故準備。** 事故應變計畫須符合 2025 年個資法修正案下向個資會通報的義務、GDPR 的 72 小時規定，以及美國各州通知法。
12. **企業控制。** SSO/SCIM、RBAC、稽核日誌、法律保全（legal hold）、各工作區保存政策、可針對特定會議類型或網域停用錄音，以及針對已連結電子郵件與文件的 DLP 選項。
13. **連接器範圍限定。** 文件與電子郵件採最小權限 OAuth 範圍。向使用者顯示每項洞察的來源。檢索時遵循來源系統的權限。
14. **文件。** 提供客戶 DPIA 範本、處理活動紀錄（Record of Processing）及透明度說明（模型限制、幻覺風險）。以繁體中文、英文及日文撰寫並經律師審閱的告知範本。
15. **行銷衛生。** 絕不宣傳隱形或無法被察覺。Granola 起訴狀引用了「其他人……不會知道它的存在」，而 Cluely 的「作弊」品牌定位則適得其反。
