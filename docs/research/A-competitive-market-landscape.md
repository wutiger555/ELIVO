> **研究附錄**（2026-09-29 由研究代理以公開網路資料彙整；英文原文保留）。每項非顯而易見的主張均附來源；標示 *unverified* 者尚待一手資料確認。**非法律意見。**

# ELIVO Due Diligence: Real-Time Conversation Intelligence, Competitive and Market Landscape (as of 2026-09-29)

## 0. Executive summary

- **Post-meeting notetaking is a commodity now, and the market is consolidating.** Otter passed $100M ARR. Granola is valued at $1.5B. Superhuman (formerly Grammarly) bought Fathom on 2026-09-14. The platforms (Microsoft, Zoom, Google) bundle notes into their suites and are now actively blocking third-party bots. A new standalone notetaker has no room.
- **Real-time help during the meeting is arriving, but it is mostly reactive.** The user has to ask a question: Otter Meeting Agent (voice-activated), Zoom In-Meeting Questions, Ask Gemini in Meet, Teams Facilitator, Fireflies Live Assist. The proactive tools are narrow. They either match keywords to battlecards (Outreach Kaia, Clari Copilot, Balto, Cresta) or run as a generic "whisper" overlay (Cluely). I found no product that checks what is being said against past decisions, documents and numbers and raises a "this contradicts Aug-12" or "cost is 18% off" card with high precision. That is ELIVO's core idea and it is still open. But the big platforms each have every ingredient (a live transcript, the organisation's documents, an LLM), so the window is probably 12–24 months.
- **Mandarin, Traditional Chinese and Mandarin-English code-switching is a real, verifiable gap in the US tools.** Otter supports only Simplified Chinese (in beta), one language per meeting. Google "Take notes for me" has no Chinese at all and one language per meeting. Teams AI notes support one language per meeting. Open models such as MediaTek Breeze-ASR-25 now make zh-TW code-switching ASR cheap to build, so ASR itself is not a moat. The workflow, the knowledge graph and trust (on-prem or data-residency) are where a moat can come from.
- **Hardware is risky but proven when it is focused.** Plaud shipped over 2M devices and has over $100M software ARR. Humane was bricked. Limitless was absorbed by Meta. Bee was absorbed by Amazon. Chinese competitors (DingTalk A1 at RMB 499) quickly commoditise recorder-style hardware.

---

## 1. Competitive landscape

### (a) Post-meeting notetakers (increasingly adding live features)

| Player | Positioning | Real-time? | External knowledge? | Scale / funding | Recent news |
|---|---|---|---|---|---|
| **Otter.ai** | Now "AI Meeting Agent" suite (Meeting, Sales, SDR agents) | **Yes.** Voice-activated agent answers live questions from the company-wide meeting database; live sales coaching ([UC Today](https://www.uctoday.com/unified-communications/otter-revolutionises-meetings-with-ai-agent-that-speaks-up-during-calls/)) | Meeting DB, MCP server, public API; HIPAA (Jul 2025) | $100M ARR (Mar 2025), 35M+ users, <200 staff ([Otter blog, Dec 2025](https://otter.ai/blog/otter-ai-caps-transformational-2025-with-100m-arr-milestone-industry-first-ai-meeting-agents-and-global-enterprise-expansion)) | Class action consolidated as *In re Otter.AI Privacy Litigation*. On 2026-08-13 the court let the Wiretap Act, CIPA and BIPA claims proceed ([NatLawReview](https://natlawreview.com/article/invited-participant-or-third-party-eavesdropper-court-holds-otterai-third-party), [RecordingLaw](https://www.recordinglaw.com/news/otter-ai-wiretap-lawsuit-explained/)) |
| **Fireflies.ai** | "AI teammate" for meetings, email, CRM; AI Sales Suite (Jul 2026) | **Yes.** "Live Assist" gives live notes, suggestions and answers, but needs the bot in the call ([Fireflies KB](https://guide.fireflies.ai/articles/6032274417-learn-about-fireflies-live-assist-get-real-time-suggestions-answers-and-notes-live-during-the-meeting)) | CRM (HubSpot/Salesforce), "AskFred" | $1B valuation via June 2025 tender offer ([Fireflies](https://fireflies.ai/blog/fireflies-1-billion-valuation)); claims 20M users / 500k orgs; revenue unverified (Latka estimate of $10.9M for 2024 looks stale) | BIPA voiceprint class action *Cruz v. Fireflies.AI* (C.D. Ill., filed 2025-12-18) ([Data Privacy Insider](https://www.dataprivacyandsecurityinsider.com/2025/12/lawsuit-alleges-fireflies-ai-corp-illegally-collects-biometric-data-from-virtual-meetings/)) |
| **Granola** | Bot-free Mac/Windows "AI notepad", moving to an "enterprise AI app" | Partial. You can chat during the meeting, but it gives no proactive cards | Spaces, APIs, MCP server | $125M Series C at $1.5B (Mar 2026, Index); $192M raised in total; customers include Vanta, Asana, Cursor, Mistral ([TechCrunch](https://techcrunch.com/2026/03/25/granola-raises-125m-hits-1-5b-valuation-as-it-expands-from-meeting-notetaker-to-enterprise-ai-app/)) | Users pushed back after Granola restricted access to its local database, which broke their agent workflows. It now claims 32 languages including Mandarin and Cantonese ([Granola](https://www.granola.ai/updates/granola-now-supports-32-languages)); whether it handles code-switching is unverified |
| **Fathom** | Free-tier-led notetaker, strong with HubSpot users | Minimal | CRM sync | 400k+ MAU; valued at $94M in 2024 ([TechCrunch](https://techcrunch.com/2026/09/14/superhuman-acquires-yc-backed-notetaker-fathom-as-productivity-platforms-push-for-agentic-work/)); ~$30M ARR in 2025 (Latka, unverified) | **Acquired by Superhuman on 2026-09-14**, a clear "the notetaker is becoming a feature" signal ([Superhuman](https://blog.superhuman.com/superhuman-acquires-fathom/)) |
| **tl;dv** | SMB/sales notetaker, EU-based | Limited | CRM | n/a | Business tier adds sales coaching |
| **Read AI** | Notes, engagement/sentiment scoring, "Search Copilot" across meetings, email and chat | **Yes.** Live engagement and speaking-coach nudges ([Read AI](https://www.read.ai/meeting-tools)) | Email, Slack, CRM | $50M Series B (Oct 2024), $81M in total ([Read AI](https://www.read.ai/post/read-ai-announces-50-million-series-b-launch-of-read-ai-for-gmail)) | No new round found for 2026 |
| **Notion AI Meeting Notes** | Bot-free capture inside Notion pages | No | Notion workspace (strong RAG base) | Bundled in Business at $20/user/mo ([Engadget](https://www.engadget.com/ai/notion-ai-can-transcribe-conversations-and-write-reports-but-itll-cost-you-130018464.html)) | 16 languages |
| **Krisp** | Noise cancellation plus bot-free notes and accent conversion | Audio-level live processing | CRM push | n/a | Customer-side accent conversion for call centres (Mar 2026) |
| **Jamie / Bluedot / Supernormal** | Bot-free (Jamie, Bluedot) or credit-based (Supernormal 2.0) notetakers | No | Limited | Small | Supernormal switched to credit-based pricing in 2026 ([Supernormal](https://www.supernormal.com/pricing)) |
| **Avoma** | Notetaker plus CI plus revenue intelligence for SMB sales | "Real-time answer assistant" is sold inside the CI add-on | CRM | n/a | Add-ons can push the price to about $77/seat ([Docket](https://docket.io/resources/research/avoma-pricing)) |
| **Wispr Flow Notetaker** | New bot-free entrant (Mac Aug 2026, Windows Sep 2026) | No | n/a | n/a | 21 languages ([TechCrunch](https://techcrunch.com/2026/08/05/wispr-flow-is-preparing-to-launch-a-meeting-notetaker-updated-terms-suggest/)) |

### (b) Platform-native (the biggest threat)

- **Microsoft Teams / M365 Copilot.**
  - **Facilitator** produces live co-authored notes, summarises decisions and open questions, answers questions in chat about the conversation and shared documents, tracks the agenda, and can create Word documents.
  - Limits: it works only in scheduled meetings (not channel or instant meetings, not calls), external participants cannot see its updates, and it needs a Copilot license ([Microsoft Support](https://support.microsoft.com/en-us/teams/copilot/facilitator-in-microsoft-teams-meetings)).
  - Copilot costs $30/user/mo for Enterprise and $21 for Business (≤300 users) ([Microsoft](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing)).
  - Paid seats passed **30M at the end of FY26** ([MSFT FY26 Q4](https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast)), against about 450M M365 commercial seats ([Office365ITPros](https://office365itpros.com/2026/01/30/microsoft-fy26-q2-results/)).
  - AI notes support only single-language meetings ([Microsoft multilingual](https://support.microsoft.com/en-us/office/multilingual-speech-recognition-in-microsoft-teams-650cb6d2-8a33-40e7-840d-36bb90216aa4)). The Interpreter agent recently added Traditional Chinese ([M365 Admin](https://m365admin.handsontek.net/microsoft-teams-ai-interpreter-simultaneous-quality-improvements-new-traditional-chinese-support/)).
  - Taiwan signal: **KPMG Taiwan is rolling out paid Copilot to all staff from October** ([BigGo](https://finance.biggo.com/news/5847817c-8ea3-41c7-bf29-6c4cba725f23)). Consultants, a core ELIVO segment, are being handed Copilot for free.
- **Zoom.**
  - AI Companion 3.0 went GA on 2025-12-15. It adds agentic retrieval across meetings, Google Drive and OneDrive; the standalone tier is $10/mo ([Zoom](https://news.zoom.com/zoom-launches-ai-companion-3-0/)).
  - In-Meeting Questions lets participants ask what has been said so far. Custom AI Companion costs $12/user/mo.
  - **ZoomMate** (launched 2026-06-01, from $20/user/mo, credit-metered; EMEA and APAC later in 2026) ([Reworked](https://www.reworked.co/collaboration-productivity/zoom-launches-ai-companion-30-with-10-standalone-option/), [Laxis](https://www.laxis.com/blog/zoom-ai-companion/)).
  - Meeting summaries cover 36 languages with auto-detection ([Zoom](https://news.zoom.com/breaking-down-boundaries-zoom-ai-companion-expands-language-support-across-its-platform-to-enable-better-global-collaboration-and-productivity/)).
- **Google Meet / Gemini.**
  - "Take notes for me" is bundled from Business Standard ($14/user/mo). It supports **EN, FR, DE, IT, JA, KO, PT, ES only, with no Chinese and one language per meeting** ([9to5Google](https://9to5google.com/2026/06/29/google-meet-take-notes-ai-pro-ultra/), [Google Help](https://support.google.com/meet/answer/14754931?hl=en&co=GENIE.Platform%3DDesktop)).
  - In-person note-taking arrived in August 2026, but only in English and only for 15-minute sessions ([Workspace Updates](https://workspaceupdates.googleblog.com/2026/08/take-notes-with-me-for-in-person-meetings-is-now-available.html)).
  - **Ask Gemini in Meet** is reactive live Q&A over captions, Workspace documents, Gmail and the web. It launched English-only ([Workspace Updates](https://workspaceupdates.googleblog.com/2025/09/ask-gemini-in-google-meet.html)). This is the closest mainstream product to "live RAG", but the user has to ask.
- **Apple.** macOS Tahoe records and transcribes Phone and FaceTime audio calls, and Apple Intelligence summarises them in Notes ([Apple](https://support.apple.com/guide/mac-help/mchld69597ca/mac)). It is not a meeting product today. It could become an OS-level threat to bot-free capture on the Mac.

### (c) Real-time in-meeting assistants

- **Cluely.**
  - An invisible overlay that reads the screen and audio and gives live suggestions. It started as "cheat on everything" and repositioned as an "undetectable AI meeting assistant".
  - Funding: $5.3M seed and a $15M a16z Series A in 2025 ([Wikipedia](https://en.wikipedia.org/wiki/Cluely)).
  - Pricing: Pro from $11.99/mo (annual); "undetectable" mode costs $149.99/mo ([Cluely](https://cluely.com/pricing)).
  - In March 2026 the CEO retracted the $7M ARR claim; the real figure was $5.2M.
  - Journalists measured response delays of 5–90 seconds.
  - A reported breach exposed 83k users (partly unverified: it is absent from HIBP) ([GhostPilot](https://ghostpilotai.com/blog/cluely-data-breach-investigation/)).
- **Otter Meeting Agent, Fireflies Live Assist, Read AI** are covered in (a).
- **Interview copilots.**
  - Final Round AI raised a $6.88M seed (Jan 2025), claims 500k+ users, and charges $25–90/mo.
  - This category is ethically contested. In an interviewing.io survey, 81% of interviewers suspected candidates of AI cheating ([Four-Leaf](https://four-leaf.ai/blog/ai-interview-copilots)).
- **Sybill.** Post-call sales assistant; $11M Series A in 2024 ([TechCrunch](https://techcrunch.com/2024/07/31/sybill-raises-11m-for-its-ai-assistant-that-helps-salespeople-reduce-administrative-burden/)). No real-time product found.

### (d) Sales conversation intelligence and agent assist

- **Gong.** $500M ARR (May 2026), growing more than 55% year over year ([Gong](https://www.gong.io/press/gong-growth-accelerates-past-55-yoy-arr-tops-500m)). A $4.5B secondary valuation in Nov 2025, down from $7.25B in 2021 (Sacra/Latka). Credit-metered AI launched in Jun 2026. Real-time guidance is not its strength.
- **Salesloft + Clari.** The merger closed 2025-12-03, with about $450M combined ARR and 5,000+ customers ([Salesloft](https://www.salesloft.com/company/newsroom/clari-salesloft-merger)). Clari Copilot provides **real-time live battlecards**.
- **Outreach Kaia.** Live "content cards" that pop up when, for example, a competitor or pricing is mentioned ([Outreach](https://support.outreach.io/hc/en-us/articles/1260805179870-Best-Practices-for-Creating-Outreach-Kaia-Content-Cards)). This is the nearest existing version of "insight cards", but it is keyword- or topic-triggered from a curated library, not reasoning over organisational memory.
- **Chorus (ZoomInfo).** Acquired in 2021 for $575M. One aggregator gives the date as 2026, which I believe is wrong. Customers reported outages in 2026.
- **Attention.** $30M Series B (Jun 2026). ARR up 4x; moving from real-time coaching to autonomous actions ([PR Newswire](https://www.prnewswire.com/news-releases/attention-raises-30m-series-b-to-build-the-ai-system-that-runs-revenue-teams--not-just-records-them-302808821.html)).
- **Contact-centre agent assist**, the most mature real-time category:
  - **Cresta:** under 200ms whisper guidance; $125M Series D (Nov 2024); about $100M ARR by Apr 2026 (Sacra estimate) ([Cresta](https://cresta.com/blog/cresta-raises-125m-to-create-the-unified-platform-for-human-and-virtual-agents), [Sacra](https://sacra.com/c/cresta/)).
  - **Observe.AI:** $214M raised.
  - **Balto:** about $52M raised ([Balto](https://www.balto.ai/blog/balto-raises-37-5m-pushes-to-close-execution-gap-for-contact-centers/)).
  - Lesson for ELIVO: real-time assist makes money where the ROI per conversation is measurable (sales, support).

### (e) Wearables and hardware

- **Plaud (NotePin, NotePin S, Note Pro).**
  - Over 2M units shipped and over $100M software ARR (Jun 2026). About 50% of device owners pay for a subscription. Plaud Teams launched in 2026 ([TechCrunch](https://techcrunch.com/2026/06/16/plaud-says-its-software-business-topped-100m-in-arr-after-shipping-over-2m-ai-notetakers/)).
  - About $250M annualised revenue in 2025 and profitable ([Forbes](https://www.forbes.com/sites/iainmartin/2025/09/02/how-an-ai-notetaker-became-one-of-the-few-profitable-ai-startups/)). It is targeting $500M in 2026 sales ([Bloomberg](https://www.bloomberg.com/news/articles/2026-06-16/plaud-plans-new-wearable-as-ai-note-taking-startup-eyes-500-million-in-sales)).
  - Valuation reportedly about $2B, with a Tencent stake that both sides denied ([36Kr](https://eu.36kr.com/en/p/3799129165863937)).
  - Devices are about $159–179; the Unlimited plan is $239.99/yr.
- **Limitless.** Acquired by Meta in Dec 2025. The pendant was discontinued, Rewind was shut down on 2025-12-19, and service was withdrawn from the EU and UK ([TechCrunch](https://www.techcrunch.com/2025/12/05/meta-acquires-ai-device-startup-limitless/)).
- **Bee.** Acquired by Amazon in Jul 2025. A $49.99 wristband that is still sold ([CNBC](https://www.cnbc.com/2025/07/22/amazon-ai-bee-wearable.html)).
- **Omi.** Open-source pendant at about $129, with 25k+ units sold and a small seed round ([Omi](https://www.omi.me/)). Figures unverified.
- **Humane AI Pin.** Assets sold to HP for $116M. Devices were bricked on 2025-02-28 after roughly 10k units shipped against a 100k target ([TechCrunch](https://techcrunch.com/2025/02/18/humanes-ai-pin-is-dead-as-hp-buys-startups-assets-for-116m)).
- **Rabbit R1.** Employees reported months of unpaid wages in late 2025 ([Tom's Guide](https://www.tomsguide.com/ai/whats-next-for-rabbit-employees-say-they-havent-been-paid-for-months-while-company-teases-new-ai-hardware)).
- **Chinese clones.** DingTalk A1 (RMB 499/799, Sep 2025) topped Tmall's recorder chart on Double 11 ([Sina](https://finance.sina.com.cn/tech/discovery/2025-10-30/doc-infvrtfr7300817.shtml)). Anker/ByteDance, Dreame and Mobvoi have launched similar products.
- **Room devices.**
  - Meeting Owl 5 Pro is Teams-certified ([BusinessWire](https://www.businesswire.com/news/home/20260203989764/en/Owl-Labs-Unveils-Next-Generation-Meeting-Owl-5-Pro-Expanding-Enterprise-Hybrid-Collaboration)).
  - Logitech Sight does AI framing.
  - HP Poly Studio Room Compute (NPU-based, Jul 2026) and VideoOS 5.1 ([HP](https://www.hp.com/us-en/newsroom/press-releases/2026/HP-debuts-ai-powered-unified-collaboration-ecosystem-at-infocomm-2026.html)).
  - Taiwan's **AVer (圓展)** launched the CORE500 MTR kit ([ChannelTimes](https://channeltimes.com/aver-showcases-ai-ready-conferencing-and-pro-av-innovations-at-infocomm-asia-2026/)).
  - Room AI today is audio/video framing plus platform notes. **No desk "insight display" product exists**, which is white space but also unproven demand.

### (f) Taiwan and Chinese-language players

- **雅婷逐字稿 (Yating, Taiwan AI Labs / 雅婷智慧).**
  - Around since 2017 and strong on Taiwan-accented Mandarin and Taiwanese. Pay-as-you-go at about NT$100/hour, falling to NT$8/hour on the 100-hour pack ([數位時代](https://fc.bnext.com.tw/solutions/view/yating)).
  - Its enterprise offer is the **FedGPT** on-prem "sovereign AI" platform, which includes a Meeting Assistant.
  - Its June 2026 survey (n=562): **72% of Taiwanese organisations want on-prem AI and 51% worry about data leakage** ([Taiwan AI Labs](https://ailabs.tw/news-room/more-than-half-of-taiwanese-enterprises-concerned-about-confidential-data-leakage-from-cloud-ai-over-70-want-ai-back-on-premises-yating-fedgpt-sovereign-ai-platform-enables-enterprises-to-build-secur/)).
  - This is the most direct local competitor for enterprise and government deals.
- **Vocol.ai (Taiwan).** Chinese/English/Japanese, claims 97%+ Traditional Chinese accuracy, Teams and Meet integration ([Vocol](https://www.vocol.ai/tw/home)). Funding unknown.
- **Meeting Ink (迪威智能 DeepWave, Taiwan).** Live subtitles and translation; handles Taiwanese and Hakka ([Meeting Ink](https://ink.dwave.cc/zh-TW/news/85)).
- Also local: CyberLink MyEdit and Tinrec 秒聽錄音. I could not verify "口袋逐字稿" as a distinct company.
- **飛書妙記 Feishu/Lark Minutes.** Collaborative transcripts, 300 free minutes/month, bundled in Lark Pro at about $12/user ([Feishu](https://www.feishu.cn/product/minutes)).
- **通義聽悟 Tongyi Tingwu (Alibaba).** Live transcription and translation, 20 free hours/month, "millions" of users ([Tingwu](https://tingwu.aliyun.com/)).
- **訊飛聽見 iFlytek.** Real-time and offline transcription, claims 98% accuracy, and sells hardware such as the iFlybuds Pro 3 ([iflyrec](https://www.iflyrec.com/)). Current pricing unverified.
- **騰訊會議 AI小助手 (Tencent Meeting).** Hunyuan-based live minutes, late-joiner catch-up and live-refreshing conclusions and to-dos ([Tencent](https://meeting.tencent.com/ai/)). Pricing unverified.
- **Strategic note.** PRC tools are strong on Mandarin, but many Taiwanese enterprises, government bodies and regulated industries avoid PRC cloud services for security reasons. That is an opening for a Taiwan-built product.

---

## 2. Market size (wide variance; treat as directional)

| Segment | Estimate | Growth | Source |
|---|---|---|---|
| AI meeting assistants | $3.14B (2025) → $9.33B (2030) | 24.3% CAGR | [TBRC](https://www.thebusinessresearchcompany.com/report/artificial-intelligence-ai-powered-meeting-assistants-global-market-report) |
| AI meeting assistants | $3.5B (2025) → $21.5B (2033) | 25.8% | [Grand View](https://www.grandviewresearch.com/industry-analysis/ai-meeting-assistant-market-report) |
| AI meeting assistants | $3.67B (2024) → $72B (2034) | 34.7% (aggressive) | [Market.us](https://market.us/report/ai-meeting-assistant-market/) |
| AI note-taking (narrow) | $623.5M (2025) → $740M (2026) → $3.48B (2035) | 18.75%; APAC is the fastest-growing region | [Precedence](https://www.precedenceresearch.com/ai-note-taking-market) |
| Conversation intelligence software | $21.9–28.5B (2025) | 8–15% | [Research&Markets](https://www.researchandmarkets.com/reports/6226068/conversation-intelligence-software-global-market), [SNS Insider](https://www.snsinsider.com/reports/conversation-intelligence-software-market-7165) (broad definitions that include contact-centre analytics) |
| Speech-to-text API | $2.4–4.7B (2025) | ~18–21% | [Fortune BI](https://www.fortunebusinessinsights.com/speech-to-text-api-market-102781), [Mordor](https://www.giiresearch.com/report/moi2073020-speech-text-api-market-share-analysis-industry.html) |
| Conference room hardware | $11.25B (2025) | n/a | [Mordor](https://www.mordorintelligence.com/industry-reports/conference-room-hardware-market) |
| Video conferencing hardware | $7.0–8.7B (2025) | n/a | [Mordor](https://www.mordorintelligence.com/industry-reports/video-conferencing-hardware-market) |

**Sanity check from the bottom up.** Known vendor ARR already exceeds the "AI note-taking" estimates: Otter $100M, Plaud software $100M+, Gong $500M, Salesloft+Clari about $450M, Cresta about $100M (estimate), Fathom about $30M (estimate). Add about 30M paid Copilot seats at $21–30, some of which is meeting-driven. The realistic addressable pool for meeting intelligence is several billion dollars. For a pitch, use about $3–3.5B (2025) for AI meeting assistants at about 25% CAGR, and cite Grand View or TBRC rather than the $72B figure.

---

## 3. White space analysis

### What is genuinely underserved

1. **Proactive, grounded, cross-source insight during the meeting.** The live features that exist fall into three kinds:
   - Reactive Q&A: Ask Gemini, Zoom In-Meeting Questions, Otter's voice agent, Facilitator chat.
   - Keyword battlecards: Kaia, Clari Copilot.
   - Generic LLM whispers: Cluely, which is slow and generic.

   None of them does unprompted checks against the organisation's decision log, prior proposals or numbers, with citations and a controlled false-positive rate. A search for "contradiction detection" turned up only forum requests and marketing copy ([Microsoft Q&A](https://learn.microsoft.com/en-nz/answers/questions/2336737/ai-meeting-agent-for-transcript-summarization-cont)). The hard parts are precision and restraint: when to stay silent, and how to cite the source. Those are also the defensible parts.
2. **A structured "decision and commitment ledger" across meetings.** Summaries exist; a queryable, versioned record of decisions, numbers and owners that can be compared over time largely does not. This is what the insight cards need, and it is valuable on its own.
3. **zh-TW and code-switched meetings.**
   - Otter: Simplified Chinese only (beta), one language, no auto-detection ([Speakapp](https://speakapp.com/blog/otter-ai-languages)).
   - Google: no Chinese at all.
   - Teams AI notes: single language only.
   - Taiwanese professionals routinely mix English terms into Mandarin sentences.
   - Benchmarks: Whisper-large-v3 scores about 23% MER on the ASCEND code-switching set ([arXiv](https://arxiv.org/pdf/2311.17382)). MediaTek's Apache-2.0 **Breeze-ASR-25** claims 56% better code-switching than Whisper ([GitHub](https://github.com/mtkresearch/Breeze-ASR-25)), and Breeze-ASR-26 also exists.

   Implication: ELIVO can get good ASR cheaply, and so can every competitor. Differentiate on post-ASR entity normalisation (company jargon, mixed-language names, Traditional Chinese output, terms like 報價/毛利) and on the knowledge layer.
4. **On-prem, data-residency and bot-free enterprise deployment for APAC.** 72% of Taiwanese organisations want on-prem AI. Taiwan's AI Basic Act was promulgated in Jan 2026 and emphasises privacy and data governance ([Baker McKenzie](https://www.bakermckenzie.com/en/insight/publications/2026/01/taiwan-ai-basic-act)). US notetakers are cloud-only in the US. Yating FedGPT is the local incumbent here.
5. **In-person meetings.** Google's in-person notes are English-only and capped at 15 minutes. Taiwan's conference-room culture (in-person client meetings, factory and supplier reviews) needs a room or desk device, which is where ELIVO's hardware could fit. Plaud Note Pro is closest, but it has no live insights.

### How strong is the bundling threat?

It is high for notes and medium for proactive insights.
- Microsoft (30M+ paid Copilot seats), Zoom (AI Companion bundled into paid plans) and Google (Gemini in Business Standard at $14) give summaries away as part of the suite.
- **Microsoft and Google are now blocking third-party bots.**
  - Teams first required separate approval for detected external bots (MC1251206). It then added a tenant-wide `ExternalBotAccessMode` auto-block, rolling out from August 2026 ([UC Today](https://www.uctoday.com/unified-communications/microsoft-teams-to-block-external-bots-automatically-as-ai-notetaker-crackdown-hardens/)).
  - Google Meet has flagged third-party bots as a "potential risk" since March 2026 ([UC Today](https://www.uctoday.com/security-compliance-risk/google-meet-launches-update-to-better-screen-suspicious-bots/)).
- So ELIVO must be **bot-free**: local system-audio capture on the Mac, a device in the room, or an official platform app.

The platforms' limits are ELIVO's opening:
- They work only inside their own suite (Facilitator does not run in calls or instant meetings, and external participants are excluded).
- They support one language per meeting.
- Their proactivity is conservative, for liability reasons.
- They are weak at knowledge outside their own suite (Notion, Confluence, local file shares, ERP numbers).
- Mixed-platform meetings are common for consultants and sales teams who meet on the client's platform.

### Where a Taiwan-based startup can win

- **Beachhead:** Taiwanese and APAC consultants, PMs and B2B sales (including semiconductor supply-chain teams) running code-switched, cross-platform or in-person meetings with confidential numbers. A narrow wedge example is "commitment and price-consistency checks for supplier and customer meetings", where an 18% cost deviation card has obvious ROI.
- **Enterprise:** a hybrid or on-prem deployment (a local ASR model plus a private LLM), with SOC 2 or ISO 27001 plus Taiwan PDPA alignment, positioned against PRC tools and US cloud tools.
- **Distribution:** Taiwan SIs and Microsoft partners, and AV integrators. AVer, a Taiwanese room-hardware maker, is a potential partner rather than a competitor.
- **Risk:** Yating or Taiwan AI Labs adds proactive cards to FedGPT, or Microsoft ships Facilitator with Traditional Chinese and proactive insights.

---

## 4. Pricing benchmarks (USD, per user per month; annual billing unless noted)

| Product | Free | Entry | Team/Business | Enterprise | Source |
|---|---|---|---|---|---|
| Otter | 300 min | Pro $8.33 ($16.99 mo) | Business $19.99 ($30 mo) | Custom | [Otter](https://otter.ai/pricing) |
| Fireflies | Yes | Pro $10 ($18 mo) | Business $19 ($29 mo) | $39 | [Sonix](https://sonix.ai/resources/fireflies-ai-pricing/) |
| Granola | 30-day history | — | Business $14 | $35 | [Granola](https://www.granola.ai/pricing) |
| Fathom | Unlimited | Premium $16 | Team $15; Business $25 | Custom | [Fathom](https://www.fathom.ai/pricing) |
| tl;dv | Yes | Pro $18 | Business $59 | Custom | [Claap](https://www.claap.io/blog/tl-dv-pricing) |
| Read AI | Yes | Pro $15 | Enterprise $22.50 | Ent+ $29.75 | [eesel](https://www.eesel.ai/blog/read-ai-pricing) |
| Notion AI Notes | — | — | Business $20 (bundled) | Custom | [Engadget](https://www.engadget.com/ai/notion-ai-can-transcribe-conversations-and-write-reports-but-itll-cost-you-130018464.html) |
| Krisp | Yes | Pro $8 | Business $10 | Custom | [Krisp](https://krisp.ai/pricing/) |
| Jamie | 10 meetings | Plus €25 | Team €39 | Custom | [Sally](https://www.sally.io/blog/jamie-ai-the-best-alternatives) |
| Bluedot | Yes | Pro ~$20 | — | — | [Bluedot](https://www.bluedothq.com/pricing) (unverified) |
| Avoma | Yes | $19 base | +$29 CI, +$29 RI (up to ~$77) | Custom | [Docket](https://docket.io/resources/research/avoma-pricing) |
| Cluely | Yes | $11.99–19.99 | "Undetectable" $149.99 | Custom | [Cluely](https://cluely.com/pricing) |
| Final Round AI | — | $25 (annual) to $90 (monthly) | — | — | [LoopCV](https://www.loopcv.pro/directory/finalround/) |
| M365 Copilot (Facilitator) | — | Business $21 | Enterprise $30 (add-on) | — | [Microsoft](https://www.microsoft.com/en-us/microsoft-365-copilot/pricing) |
| Zoom AI Companion / ZoomMate | Bundled in paid plans | Standalone $10 | Custom AI $12; ZoomMate from $20 | — | [Reworked](https://www.reworked.co/collaboration-productivity/zoom-launches-ai-companion-30-with-10-standalone-option/) |
| Google Gemini in Meet | — | Bundled from Business Standard $14 | — | — | [eesel](https://www.eesel.ai/blog/gemini-workspace-pricing) |
| Gong | — | ~$113–133 per seat equivalent ($1,360–1,600/yr) plus platform fee | — | — | [Oliv](https://www.oliv.ai/blog/gong-io-pricing) |
| Lark (incl. Minutes) | Yes | Pro ~$12 | — | Custom | [Toolradar](https://toolradar.com/tools/lark/pricing) |
| Yating 逐字稿 | 300 min trial | ~NT$100/hr, down to NT$8/hr in bulk | Enterprise on-prem (FedGPT) quote-based | — | [數位時代](https://fc.bnext.com.tw/solutions/view/yating) |
| Plaud (hardware plus plan) | 300 min/mo | Pro $99.99/yr | Unlimited $239.99/yr; Team $20/user | — | [Plaud](https://www.plaud.ai/pages/plaud-ai-plan-pricing) |
| Omi / Bee | Free tier | Omi $19 Plus / $29 Unlimited; Bee ~$12 (unverified) | — | — | [UMEVO](https://www.umevo.ai/blogs/ume-all-posts/omi-ai-wearable-deep-dive-subscription-cost-and-developer-kit-review) |

**What this means for ELIVO's pricing.** Notes-only tools cluster at $8–20. ELIVO's Pro at $15–30 sits at or above Otter and Fireflies Business, so the insight cards have to justify the premium; around $20–25 is plausible. Team at $30–60 overlaps with Copilot ($30) and tl;dv Business ($59), which is defensible only with measurable ROI (sales, consulting) or on-prem. Enterprise custom with on-prem pricing, benchmarked against Gong's roughly $110–130 per seat, is realistic for regulated APAC buyers. Consider usage or credit metering for the heavy RAG and inference work, as Zoom, Gong, Fireflies and Supernormal all now do.

---

## 5. Lessons: failures, controversies and fatigue

1. **Consent and data-use litigation.**
   - The Otter court held (2026-08-13) that a vendor which **trains on recordings** can be a "third-party eavesdropper" under CIPA ([Lawsuit Intelligencer](https://lawsuitintelligencer.com/otter-ai-cipa-ruling)).
   - Fireflies faces BIPA liability over speaker voiceprints.
   - NYC Bar Formal Opinion 2025-6 (Dec 2025) warns lawyers about AI notetakers and confidentiality ([PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/the-meeting-bot-nobody-invited-is-now-exhibit-a)).
   - Design implications for ELIVO:
     - Train on no customer data by default.
     - Show a visible consent indicator for all parties.
     - Keep speaker identification optional and time-limited to reduce voiceprint and biometric risk.
     - Offer retention controls.
   - In Taiwan, recording by a participant is generally lawful under 通保法 §29, but covert recording by a non-party falls under 刑法 §315-1 ([亮遠法律](https://lylaw.tw/article-content.asp?ids=40)). An AI vendor that retains data for its own use raises the same "third party" question. Get local legal advice before selling to enterprises and government.
2. **Bot fatigue and platform lockout.** Teams and Meet now block or flag bots, and corporate lawyers eject notetakers because transcripts become discoverable evidence. The market is shifting to bot-free capture (Granola, Wispr, Fathom's bot-free mode since Apr 2026). ELIVO should also offer "ephemeral mode": insights shown live, with no transcript retained.
3. **"Undetectable" is a brand liability.** Cluely went viral, then faced an ARR retraction, latency complaints and a reported breach. ELIVO's "low-interruption" positioning should be transparent, not stealthy, especially for enterprise buyers.
4. **Hardware.**
   - Humane (about $230M raised, bricked in 10 months) and Rabbit show that a device must beat the phone or laptop at one specific job.
   - Plaud shows the job can be "capture in-person meetings reliably", monetised through a roughly 50% software attach rate.
   - Limitless and Bee show that big tech acquires this category rather than letting it scale independently.
   - The Chinese supply chain copies designs within months (DingTalk A1).
   - Recommendation: delay the display device until software retention is proven. Consider partnering with a Taiwanese ODM or AV firm (e.g., AVer) instead of building bespoke hardware first.
5. **Consolidation.** Fathom went to Superhuman, Limitless to Meta, Bee to Amazon, and Salesloft merged with Clari. Standalone notetakers are becoming features. ELIVO's exit and defensibility depends on owning the **decision/knowledge graph plus real-time reasoning layer**, not capture.

---

### Items I could not verify

- Fireflies' true ARR.
- Granola's ARR and user counts.
- Fathom's ARR (Latka estimate).
- Cresta's $100M ARR (Sacra estimate).
- Plaud's $2B valuation and Tencent stake (both parties denied).
- The Cluely breach (disputed).
- Bluedot and Supernormal current list prices (pricing changed in 2026).
- Tencent Meeting and iFlytek current pricing.
- "口袋逐字稿" as a distinct company.
- AVer's revenue.
- Facilitator's support for Traditional Chinese.
- Granola's handling of code-switching within one meeting.
- The Chorus acquisition date: aggregators show 2026, but my belief is July 2021, which I could not confirm in this session.