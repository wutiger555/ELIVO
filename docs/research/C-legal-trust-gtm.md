> **研究附錄**（2026-09-29 由研究代理以公開網路資料彙整；英文原文保留）。每項非顯而易見的主張均附來源；標示 *unverified* 者尚待一手資料確認。**非法律意見。**

# ELIVO Due-Diligence Report: Legal, Trust, Go-to-Market, Discovery and Brand (as of 2026-09-29)

> **This is not legal advice.** It is desk research to prepare for talks with counsel in Taiwan, the US and the EU. Many figures come from secondary sources such as law-firm blogs and news, and some come from search-engine summaries rather than primary texts. Items marked **[unverified]** need a primary-source check before anyone relies on them.

---

## Executive summary: the five things that matter most

1. **Being a "bot-free" product no longer protects you from lawsuits.** Otter (bot-based) lost most of its motion to dismiss in August 2026. Granola (bot-free, captures the device's own audio) was sued on 30 July 2026. The legal theory against both is the same: the vendor **uses the recordings for its own purposes (model training)**. That turns it from the user's tool into a third-party eavesdropper. ELIVO's strongest protection is a product that **never trains on customer data, is visible to other participants, and acts only on behalf of the user**.
2. **Taiwan is permissive about recording, but its data-protection law still applies.** Recording by a participant in the conversation is lawful under 通保法 §29(3), provided the purpose is not unlawful. PDPA (個資法) obligations are growing: the November 2025 amendment adds mandatory breach reporting to the new PDPC. The PDPC itself (個資會) was, at the last point I could verify, **still a preparatory office (籌備處)**.
3. **The EU AI Act makes sentiment features risky.** Since 2 February 2025 it has been illegal in the EU to infer *employees'* emotions from voice, face or other biometrics. Text-only sentiment is outside the ban. Customer-directed emotion inference is outside the ban but is regulated. The Article 50 transparency duties applied from 2 August 2026 and were **not** delayed by the Digital Omnibus.
4. **Treat voiceprints as a hazardous material.** Illinois BIPA claims survived against Otter and are the core of both Fireflies suits. Keep speaker identification off by default, require opt-in with written consent, and keep a published retention schedule. Better still, use diarization without persistent voiceprints.
5. **The market is crowded and well funded:** Otter ($100M ARR), Fireflies ($1B valuation), Granola ($1.5B), Plaud ($250M revenue run rate). ELIVO's opening is **real-time, context-linked insight** plus Taiwan/APAC trust (local data residency, Mandarin and Taiwanese-accented speech, on-prem option), not transcription.

---

## 1. Recording-consent and data-protection law

### 1.1 Taiwan

**Criminal and wiretap law.**
- 刑法 §315-1 penalises recording another person's non-public speech "without justification" (無故).
- 通訊保障及監察法 §29(3) exempts the recorder when the recorder **is a party to the communication, or has one party's prior consent, and the purpose is not unlawful**. Taiwan courts generally treat this as meaning a participant's own recording does not violate §315-1 either.
- Sources: [亮遠法律](https://lylaw.tw/article-content.asp?ids=40), [臺灣高等檢察署](https://www.tph.moj.gov.tw/4421/4475/632364/960875/post), [陳哲瑋律師](https://lawyerchen.com.tw/%E5%81%B7%E5%81%B7%E9%8C%84%E9%9F%B3%E5%90%88%E6%B3%95%E5%97%8E%EF%BC%9F%E5%8F%B0%E7%81%A3%E6%B3%95%E5%BE%8B%E5%AE%8C%E6%95%B4%E8%A7%A3%E6%9E%90%EF%BC%9A%E9%8C%84%E4%B8%8B%E8%87%AA%E5%B7%B1%E8%88%87/).

**Implications for ELIVO (my analysis, not settled law):**
- **A recording device left running when its owner is not present.** Think of the future desk device, or an app that auto-joins meetings its user isn't in. The owner is then *not* a party, so the §29(3) exemption may not apply. Presence-gating is a legal control, not just a UX feature.
- **The vendor itself.** If ELIVO used recordings for its own purposes, it could look like an independent "監察者" (the person doing the monitoring) rather than the user's tool. This mirrors the US Otter reasoning below. No Taiwan case on point was found.

**Personal Data Protection Act (個人資料保護法).**
- **2023 amendment:** Art. 48 fines for private entities that fail to keep data secure are now NT$20k–2M. Serious violations draw NT$150k–15M, and fines can be imposed immediately, without a prior correction order ([iThome](https://www.ithome.com.tw/news/156904)).
- **2025 amendment:**
  - Third reading on 17 Oct 2025; promulgated 11 Nov 2025. The effective date is to be set by the Executive Yuan ([PDPC 籌備處](https://www.pdpc.gov.tw/News_Content/20/1010/), [理律](https://www.leeandli.com/TW/NewslettersDetail/7532.htm)).
  - For private companies it adds **mandatory incident reporting to the PDPC** above set thresholds, and removes excuses for delaying notice to data subjects.
  - It lets the PDPC fine for security failures without first issuing an order, and gives the PDPC powers to restrict international transfers.
  - It does **not** require private companies to appoint a DPO (that duty is for government agencies only).
  - Sector regulators may keep their supervisory role for 6 years after the PDPC is established.
- **PDPC (個資會) status:**
  - The organic law (組織法) passed the Executive Yuan on 27 Mar 2025, and the committee-stage review in the Legislative Yuan was completed ([PDPC](https://www.pdpc.gov.tw/News_Content/20/1001/), [行政院](https://www.ey.gov.tw/Page/9277F759E41CCD91/747cda78-926f-4205-99b3-1a735fc1b97b)).
  - I could **not confirm** that it has passed its third reading, or that the PDPC has been formally established, as of Sept 2026. The pdpc.gov.tw site still brands itself 籌備處 (preparatory office). **[unverified — check directly]**
- **Practical points:**
  - **Enterprise use:** the customer is the data controller and ELIVO is the entrusted party (受委託機關, the processor).
  - **Personal and household use:** exempt (Art. 51), but a consultant or salesperson using ELIVO for work is not.
  - **Biometric data:** as I read it, a voiceprint is personal data (Art. 2 lists "特徵" and fingerprints) but is not an Art. 6 sensitive category. **[my reading; confirm with counsel]**
- **Taiwan AI Basic Act (人工智慧基本法):** third reading on 23 Dec 2025; the competent authority is the National Science and Technology Council (國科會). It is principles-based (privacy, transparency, accountability) and has no direct product obligations yet ([CNA](https://www.cna.com.tw/news/aipl/202512230036.aspx), [moda](https://moda.gov.tw/press/press-releases/18316)).

### 1.2 Japan
- No general law criminalises a participant recording their own conversation **[unverified; general practitioner understanding]**. APPI still requires the purpose of use to be notified or published, consent for providing data to third parties, and consent (or an equivalent-protection mechanism) for cross-border transfers.
- A voiceprint counts as an "individual identification code" under the APPI Enforcement Order **[from memory; verify]**.
- **2026 APPI amendment:** passed by the Diet on 10 Jul 2026 and promulgated on 17 Jul 2026. It takes effect by cabinet order within 2 years, so by about mid-2028. It introduces **administrative fines for the first time**, relaxes consent for AI and statistical use, and creates a "specific biometric personal information" category with stricter transparency rules ([Mori Hamada](https://www.morihamada.com/en/insights/newsletters/138006), [Biometric Update](https://www.biometricupdate.com/202604/japan-introduces-new-rules-on-biometric-data-in-appi-amendment-bill), [dig.watch](https://dig.watch/updates/japan-appi-personal-data-ai-fines)).

### 1.3 Singapore
- No statute bans recording a conversation you are part of. When an **organisation** records, though, the PDPA requires notice and consent, which may be deemed consent. Penalties reach up to 10% of Singapore turnover (for turnover above S$10M) or S$1M ([SingaporeLegalAdvice](https://singaporelegaladvice.com/can-an-organisation-record-a-conversation-without-consent/), [Recording Law SG](https://www.recordinglaw.com/world-laws/world-recording-laws/singapore-recording-laws/)).

### 1.4 Hong Kong
- The PDPO requires the purpose to be notified at collection (DPP1). No general criminal ban on a participant's recording was found **[unverified]**.
- The Privacy Commissioner (PCPD) has issued employee Gen-AI guidance (2025) and agentic-AI guidance (2026). The agentic-AI guidance warns about *new* collection or new processors that fall outside existing privacy notices ([PCPD AI](https://www.pcpd.org.hk/english/artificial_intelligence/index.html), [Bird & Bird](https://www.twobirds.com/en/insights/2025/china/gen-ai-at-work-hong-kong-privacy-commissioner), [Lexology](https://www.lexology.com/library/detail.aspx?g=60bdd4af-8436-4f89-bf05-79859385a6e1)).

### 1.5 Mainland China (PIPL)
- Biometric data is sensitive personal information. It needs **separate consent** (PIPL Arts. 28–29), and cross-border transfer also needs separate consent (Art. 39).
- The cross-border certification measures took effect on 1 Jan 2026. Transferring non-sensitive personal information of ≤100k individuals in a year is exempt from the security assessment, the standard contract and certification, but **not** from consent or impact-assessment duties ([China Briefing](https://www.china-briefing.com/news/china-cross-border-data-transfer-certification/), [Arnold & Porter](https://www.arnoldporter.com/en/perspectives/advisories/2025/11/china-issues-clarifications-cross-border-data-transfer-rules)).
- **Recommendation:** do not serve mainland users from Taiwan infrastructure in phase 1.

### 1.6 United States
- **Federal law (ECPA) is one-party consent.** The key exception is the "crime or tort" purpose, and the Otter ruling shows that a *vendor's* own interception is judged separately from its user's.
- **All-party-consent states:** CA, DE, FL, IL, MD, MA, MT, NV, NH, PA and WA. CT, MI, OR and VT are mixed ([Recording Law](https://www.recordinglaw.com/party-two-party-consent-states/), [Layer3](https://www.layer3labs.io/guides/two-party-consent-states)). Because a video call can include someone in an all-party state, design for **all-party notice**.
- **California CIPA:** SB 690 passed the Legislature in Sept 2026. It was **narrowed**: the broad "commercial business purpose" exemption was dropped, and it now only moves website pen-register and trap-and-trace claims to the Attorney General. §§631/632, the provisions used against notetakers, are untouched. If signed, it takes effect 1 Jan 2027 ([Sidley](https://www.sidley.com/en/insights/newsupdates/2026/09/californias-sb-690-clears-the-legislature-what-it-means-for-cipa-website-tracking-claims), [CIPAWorld](https://cipaworld.com/2026/07/03/senate-bill-690-amended-california-scales-back-its-proposed-cipa-overhaul-by-eliminating-the-commercial-business-purpose-exemption-heres-what-the-latest-means-for-cipa-lit/)).
- **Biometrics:**
  - **Illinois BIPA:** requires written notice, written release, and a public retention and destruction schedule. The 2024 SB 2979 amendment limits recovery to one per person per method and permits e-signatures ([Seyfarth](https://www.seyfarth.com/news-insights/bipa-legislative-update-governor-pritzker-signs-amendment-limiting-damages-to-a-single-recovery-1.html)). The 7th Circuit held that the amendment applies retroactively ([ABA](https://www.americanbar.org/groups/business_law/resources/business-law-today/2026-may/7th-circuit-holds-bipa-damages-remedy-applies-retroactively/)).
  - **Colorado HB24-1130:** in force since 1 Jul 2025, covers voiceprints, and gives no private right of action ([Colorado GA](https://leg.colorado.gov/bills/hb24-1130)).
  - Texas CUBI and Washington's biometric law also apply **[not researched in detail]**.

### 1.7 European Union
- **GDPR:**
  - Recording needs a lawful basis (usually consent or legitimate interest with prominent notice).
  - Voice data becomes an Art. 9 **special category** only when processed "for the purpose of uniquely identifying" a person. Speaker ID therefore needs explicit consent; diarization without identity arguably does not.
  - A DPIA is very likely needed (Art. 35).
  - Taiwan has **no EU adequacy decision**, so SCCs are needed for EU data processed in Taiwan **[verify]**. An EU hosting region avoids this.
- **National criminal law:** Germany's §201 StGB criminalises recording the non-publicly spoken word without consent ([gesetze-im-internet.de](https://www.gesetze-im-internet.de/stgb/__201.html)). In practice this is all-party consent.
- **EU AI Act:**
  - **Art. 5(1)(f):** since 2 Feb 2025, bans AI that infers emotions of natural persons *in the workplace or education*, except for medical or safety reasons. Fines reach €35M or 7% of turnover ([Bird & Bird](https://www.twobirds.com/en/insights/2025/global/ai-and-the-workplace-navigating-prohibited-ai-practices-in-the-eu)).
  - **What the Commission's 4 Feb 2025 guidelines clarify** ([FPF](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/), [Lewis Silkin](https://www.lewissilkin.com/insights/2025/02/17/understanding-the-eu-ai-acts-prohibited-practices-key-workplace-and-advertising-102k011)):
    - Emotion inference from **text** is outside the ban.
    - Physical states such as fatigue are outside the ban.
    - Inferring **customers'** emotions (not employees') is outside the prohibition, but it remains an Annex III high-risk use and triggers the Art. 50(3) disclosure duty.
  - **What this means for ELIVO:**
    - **Prohibited in the EU:** "Your team sounds frustrated" drawn from voice prosody or video of colleagues in an internal meeting.
    - **Permissible:** text-based "the discussion turned negative on pricing."
    - **High-risk and disclosure-bearing:** voice emotion scoring of a prospect on a sales call.
  - **Timelines after the Digital Omnibus:**
    - The Omnibus was agreed 6 May 2026 and entered into force in July 2026; the regulation number I found, 2026/1744, is **[unverified]**.
    - Annex III high-risk duties move to **2 Dec 2027**, and Annex I duties to 2 Aug 2028.
    - **Art. 50 transparency applied from 2 Aug 2026 as planned**, with an Art. 50(2) marking grace period to 2 Dec 2026 for existing systems.
    - The AI-literacy duty was softened to "support the development" of staff AI literacy.
    - Sources: [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/), [CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/).
  - **Speaker identification** that matches voices to known identities could be "remote biometric identification", which is Annex III high-risk from Dec 2027. Diarization without identity is safer. **[analysis; confirm with EU counsel]**

---

## 2. Litigation and controversies, and the design lessons

| Case / event | Facts | Status (Sept 2026) |
|---|---|---|
| **In re Otter.AI Privacy Litigation**, No. 5:25-cv-06911-EKL (N.D. Cal.), consolidating Brewer (15 Aug 2025), Walker, Theus and Winston | A non-user's sales call was recorded by OtterPilot, which joined automatically; recordings were allegedly used for training | **13 Aug 2026:** ECPA, CIPA §631, both BIPA voiceprint claims, UCL and unjust enrichment **survive**. CFAA, CDAFA, the Washington claim and most common-law privacy claims were dismissed with leave to amend. The court held that Otter "independently collects, retains, and uses" the data, so it is not just its user's tape recorder ([Recording Law](https://www.recordinglaw.com/news/otter-ai-wiretap-lawsuit-explained/), [UC Today](https://www.uctoday.com/productivity-automation/otter-ai-fails-to-dismiss-core-privacy-claims-in-u-s-court/), [complaint](https://www.fisherphillips.com/a/web/x27EBgcvus2uFdfXMJiyCk/aAQ5CP/brewer-v-otterai.pdf)) |
| **Cruz v. Fireflies.AI**, 3:25-cv-03399 (C.D. Ill., 18 Dec 2025); **Fricker v. Fireflies.AI**, 1:26-cv-02675 (N.D. Ill., Mar 2026) | "Speaker Recognition" allegedly builds voiceprints of non-users without BIPA notice, release or retention policy | Pending ([NatLawReview](https://natlawreview.com/article/ai-meeting-assistants-and-biometric-privacy-governance-lessons-firefliesai-lawsuit), [tl;dv summary](https://tldv.io/blog/ai-meeting-recorder-lawsuits/)) |
| **Chamberlain v. Granola**, 3:26-cv-07926 (N.D. Cal., 30 Jul 2026) | Bot-free capture of microphone plus system audio. Training allegedly **on by default**, with per-user opt-out only. Notice to participants optional and off by default. Marketing said "other people…won't know it's there." | Newly filed ([PPC Land](https://ppc.land/granola-sued-for-recording-meetings-without-consent-to-train-ai-models/), [PacerMonitor](https://www.pacermonitor.com/public/case/65990958/Chamberlain_v_Granola,_Inc_et_al)) |
| **Zoom ToS, Aug 2023** | ToS §10.4 appeared to allow AI training on customer data. After backlash it was revised on 7 Aug, then on 11 Aug to say *no* customer audio, video, chat or content trains Zoom's or third-party models | Settled norm: "no training on customer content" ([TechCrunch](https://techcrunch.com/2023/08/08/zoom-data-mining-for-ai-terms-gdpr-eprivacy/), [Business Standard](https://www.business-standard.com/companies/news/zoom-walks-back-on-new-terms-of-service-after-backlash-over-user-data-123081600464_1.html)) |
| **Institutional bans** | UMass banned Otter and MeetGeek (2024). Harvard prohibits AI meeting assistants (Feb 2025). UW blocked Read AI (Jan 2025), as did Chapman (Aug 2025). UC Riverside restricted non-native bots (Oct 2025). Oxford removed bot access and blocked SSO sign-up (Aug 2025). Stated reasons: Read AI **auto-joined meetings users didn't attend** and followed users across platforms | ([Crimson](https://www.thecrimson.com/article/2025/2/12/updated-ai-guidelines/), [Chapman](https://blogs.chapman.edu/information-systems/2025/08/13/security-notice-regarding-read-ai/), [Oxford](https://www.infosec.ox.ac.uk/article/are-your-online-meetings-safe-from-third-party-ai-bots), [UMass](https://dailycollegian.com/2024/04/umass-information-technology-places-ban-on-transcription-platforms-otter-ai-and-meetgeek/)) |
| **Platform countermeasures** | Microsoft Teams labels external bots "Unverified" in the lobby and needs explicit organizer admission by default. Admins can block detected bots. Rollout started May 2026, with GA expected Oct 2026 | ([BleepingComputer](https://www.bleepingcomputer.com/news/microsoft/microsoft-teams-will-tag-third-party-bots-in-meeting-lobbies/), [Topedia](https://blog-en.topedia.com/2026/05/meeting-bot-detection-in-microsoft-teams/)) |
| **Cluely** (a16z-backed real-time meeting copilot) | "Cheat on everything" launch marketing, built to be undetectable. CEO admitted a fabricated $7M ARR claim in Mar 2026 | Reputational cautionary tale for "invisible real-time AI" ([Inc.](https://www.inc.com/leila-sheridan/an-a16z-backed-startup-that-helps-people-cheat-on-job-interviews-just-got-caught-in-a-7-million-lie-the-ceo-was-sweating/91313070), [Wikipedia](https://en.wikipedia.org/wiki/Cluely)) |

**Design lessons:**
1. **Never train on customer content by default.** Make it contractual (the DPA) and enforce it with an **admin-wide** switch. Default opt-in training is the common thread in the Otter and Granola complaints.
2. **Visible disclosure, on by default.** Use an on-screen indicator, an auto chat message and a spoken or visual notice for in-person use. The user must not be able to fully hide it in all-party jurisdictions. Never market invisibility.
3. **Never join or record meetings the user is not attending.** No calendar-driven auto-join by default.
4. **No persistent voiceprints by default.** Speaker ID should be opt-in per enrolled person, with a BIPA-style written release and a published retention and destruction schedule.
5. **Short default retention, customer-controlled deletion, and deletion that propagates** to derived embeddings and indexes.
6. **A bot-free architecture is now strategically favoured** because platforms are fencing out bots. The consent burden moves to the user, though, so ELIVO has to *equip* the user to give notice.

---

## 3. Enterprise trust requirements

- **SOC 2 Type II:**
  - Auditor fees run about $8–20k for a small company; first-year all-in cost (platform, audit, pen test) is about $30–80k+.
  - Vanta and Drata partner auditors advertise startup rates from about $2.5k. Drata's entry tier is about $7.5–15k/year.
  - Type II needs an observation window of 3–12 months. Common startup path: Type I in about 2–3 months, then a 3-month Type II window, for a report in about 6–9 months ([Vanta](https://www.vanta.com/collection/soc-2/soc-2-audit-cost), [Comp AI](https://www.trycomp.ai/soc-2-cost), [Workstreet](https://www.workstreet.com/blog/soc-2-audit-cost)).
- **ISO 27001** is what Taiwan and Japan enterprises expect more than SOC 2 **[practitioner consensus; unverified]**.
- **ISO/IEC 27701:2025** was published 14 Oct 2025 as a **standalone** privacy management system that no longer requires 27001 ([ISO](https://www.iso.org/standard/27701), [BSI](https://www.bsigroup.com/en-IE/products-and-services/standards-services/iso-iec-27701-key-changes-and-guidance/)).
- **ISO/IEC 42001** (AI management system): startup estimates are about $15–40k and 4–6 months ([Workstreet](https://www.workstreet.com/blog/iso-42001-for-startups), [Elevate](https://elevateconsult.com/insights/iso-42001-certification-timeline-budget-for-founders/)). It is useful for EU and financial-sector buyers, but it is later-stage.
- **Standard enterprise checklist:**
  - SSO (SAML/OIDC) and SCIM provisioning.
  - Role-based access, audit logs, and admin retention policies.
  - A DPA with a list of sub-processors (including the LLM and ASR vendors) and a "no training" clause.
  - Regional data residency (Taiwan, Japan, EU, US), BYOK/KMS, and pen-test reports.
  - A trust center and incident-notice SLAs.
- **Taiwan-specific requirements:**
  - **資通安全管理法 (Cyber Security Management Act), amended and promulgated 24 Sep 2025:** its first overhaul. Government agencies may not use products that endanger national cyber security (in practice, PRC-brand products), and restrictions can extend to designated private-sector bodies. It also widens audit scope ([理律](https://www.leeandli.com/TW/NewslettersDetail/7505.htm), [CNA](https://www.cna.com.tw/news/aipl/202508290240.aspx)). ELIVO should avoid PRC-origin models, SDKs and cloud providers in anything sold to government, critical infrastructure or finance, and be able to prove it with an SBOM (software bill of materials) and model provenance.
  - **Executive Yuan Gen-AI guidelines:** officials must not feed confidential documents or personal data into generative AI ([行政院](https://www.ey.gov.tw/Page/448DE008087A1971/40c1a925-121d-4b6b-8f40-7e9e1a5401f2)). Government is a poor early market unless ELIVO runs on-prem.
  - **Financial sector (金管會, the FSC):** under the outsourcing rules (金融機構作業委託他人處理內部作業制度及程序辦法, revised 2023, risk-based), customer data for material consumer-finance systems should in principle **be stored in Taiwan**. If stored offshore without approval, a backup copy must be kept in Taiwan ([FSC law DB](https://law.fsc.gov.tw/LawContent.aspx?id=FL040528), [FSC press](https://www.fsc.gov.tw/ch/home.jsp?id=96&parentpath=0%2C2&mcustomize=news_view.jsp&dataserno=202308040001&toolsflag=Y&dtable=News)). The FSC's AI guidelines for the financial sector (金融業運用人工智慧(AI)指引, June 2024) add governance, privacy and explainability expectations ([FSC](https://www.fsc.gov.tw/ch/home.jsp?id=96&parentpath=0%2C2&mcustomize=news_view.jsp&dataserno=202406200001&dtable=News)).
  - **On-prem demand:** regulated Taiwan buyers are wary of data leaving the country. Telcos such as Taiwan Mobile (with NVIDIA) and Chunghwa Telecom (CHT AI Factory) sell local and private AI deployments ([search summary of Taiwan industry coverage](https://www.bnext.com.tw/article/83490/ai-on-premises-qa)). PwC reports that only 5% of Taiwan firms highly trust Gen-AI **[secondary citation; unverified]**. Plan a **Taiwan-hosted region first** (e.g., a Taiwan cloud region or a local IDC), then a private-cloud or appliance SKU. The future desk device could double as an on-prem edge node.

---

## 4. Go-to-market

**Competitor growth patterns:**

| Company | Motion | Data points |
|---|---|---|
| **Otter** | Freemium consumer → teams → enterprise | $100M ARR (2025), 35M users, <200 staff ([BusinessWire](https://www.businesswire.com/news/home/20251222704206/en/Otter.ai-Caps-Transformational-2025-with-$100M-ARR-Milestone-Industry-first-AI-Meeting-Agents-and-Global-Enterprise-Expansion)) |
| **Fireflies** | Bot virality: every meeting exposes non-users | Profitable since 2023, $1B valuation via secondary sale (Jun 2025), 20M users, India a top-3 market ([Fireflies](https://fireflies.ai/blog/fireflies-1-billion-valuation)). The same virality created its legal exposure. |
| **Fathom** | Generous free individual tier, paid team tier | ARR $1M → $10M → $30M (2023–2025) **[getlatka/secondary; unverified]**; $17M Series A in 2024 ([TechCrunch](https://techcrunch.com/2024/09/19/ai-notetaker-fathom-raises-17m/)) |
| **Read AI** | Bot virality plus cross-app "copilot everywhere" | $50M Series B, 100k new accounts per week at the time ([GeekWire](https://www.geekwire.com/2024/seattle-startup-read-ai-raises-50m-to-fuel-copilot-everywhere-vision-for-enterprise-software/)); later banned by several universities |
| **Granola** | Bot-free Mac app, design-led, word of mouth among VCs and founders | $125M Series C at $1.5B (Mar 2026), about 15k enterprise customers, ARR growth above 400% ([TechCrunch](https://techcrunch.com/2026/03/25/granola-raises-125m-hits-1-5b-valuation-as-it-expands-from-meeting-notetaker-to-enterprise-ai-app/)); now sued (see §2) |
| **Plaud** | Hardware plus subscription | Over 2M devices shipped, $100M+ software ARR (Jun 2026) ([TechCrunch](https://techcrunch.com/2026/06/16/plaud-says-its-software-business-topped-100m-in-arr-after-shipping-over-2m-ai-notetakers/)). This validates ELIVO's device roadmap. |
| **Limitless** | Wearable | Acquired by Meta in Dec 2025; hardware discontinued ([CNBC](https://www.cnbc.com/2025/12/05/meta-limitless-ai-wearable.html)) |
| **Taiwan local** | Transcription | 雅婷逐字稿 (Yating, Taiwanese-accent and Taiwanese-language support, no live captions), Plaud TW, 秒聽錄音 (Tinrec) ([Tinrec review](https://tinrec.com/blog/8229)) |

**Recommended motion:**
- Use **PLG (product-led growth) for individuals** (consultants, PMs, researchers), with a **bot-free Mac app and visible participant notice**. Then add **sales-assisted team plans** for sales and consulting firms.
- **Enterprise and regulated deals** in Taiwan are relationship-driven and go through system integrators, telcos (Chunghwa, Taiwan Mobile) and the Microsoft partner channel **[practitioner view; unverified]**.
- **Wedge:** transcription is commoditised, so differentiate on *real-time retrieval from the user's own docs, email and past meetings*. Also differentiate on **Mandarin/English code-switching and Taiwanese accent accuracy**.
- **APAC sequencing:** Taiwan, then Japan (strong privacy culture, high willingness to pay; consider localisation and a Japan data region), then Singapore as the regional HQ and hub for SEA enterprise.

**Taiwan funding and support (2025–2026):**
- **國發基金創業天使投資方案 (National Development Fund angel program):** up to NT$20M per company, or NT$30M when co-investing with an institution that has ≥US$1B AUM, and up to NT$100M cumulative with follow-ons. Eligibility: company under 8 years old and ≤NT$100M raised. Open until 2030 ([國發基金](https://www.df.gov.tw/cp.aspx?n=D96B18C3BC73D5B5&s=B97E7588060C2084), [angelinvestment.org.tw](https://www.angelinvestment.org.tw/introduction)).
- **SBIR (from 1 Jan 2026):** Phase 1 up to NT$1.5M over 6 months, with a slide deck replacing the written proposal. Phase 2 up to NT$6M per year (NT$12M over 2 years). Phase 2+ up to NT$6M, plus a new patent-fee subsidy ([旺得富/工商](https://wantrich.chinatimes.com/news/20251230900432-420501), [SBIR](https://sbir.org.tw/sbir/info)).
- **Taipei SITI (臺北市產業發展獎勵補助):** R&D subsidy up to NT$5M; startup subsidy of NT$1M for Taipei companies under 1 year old; rolling review ([SITI](https://industry-incentive.taipei/)).
- **Taoyuan:** A8 智慧產業加速器 (A8 smart-industry accelerator) ([桃園青年局](https://youth.tycg.gov.tw/cp.aspx?n=22446)) and a Plug and Play Taoyuan program ([工商時報](https://www.ctee.com.tw/news/20250625702153-431204)).
- **Accelerators:**
  - **AppWorks:** no equity; AW#33 deadline was 19 Jul 2026; AI focus ([AppWorks FAQ](https://appworks.tw/accelerator-faq/)).
  - **Garage+ (時代基金會, the Epoch Foundation):** F26 batch, applications 16 Jun–31 Aug 2026, programme 5–12 Dec; US$25–50k awards ([Garage+](https://garageplus.asia/en/startupglobalprogram)).
  - **Taiwan Tech Arena (NSTC):** CES and VivaTech delegations ([TTA](https://www.taiwanarena.tech/)).
  - **Startup Island TAIWAN:** national brand of the National Development Council, with a Silicon Valley hub and a Tokyo hub ([NDC](https://www.ndc.gov.tw/en/Content_List.aspx?n=7D09AF77A1259036)).
  - **NTU Garage:** needs an NTU-affiliated founder; the 2027 batch opens around Dec 2026 ([NTUTEC](https://tec.ntu.edu.tw/garage)).
- **Seed round sizes:**
  - Taiwan's 2024 median deal across all stages was about US$1.96M (average US$5.83M). For domestic investors, 2015–Q1 2025, the median was about US$1.08M ([FINDIT annual report](https://findit.org.tw/en/Res/2573); the page returned 503 when fetched, so figures come from the search summary).
  - A typical Taiwan seed round is therefore about **US$0.5–2M** **[inference]**. A US-style seed for AI apps is about $2M+.
- **YC:**
  - No explicit YC stance on meeting tools was found. YC has funded meeting notetakers such as Circleback (W24) ([TechCrunch](https://techcrunch.com/2024/11/26/yc-backed-circleback-is-out-to-become-the-best-meeting-notetaker)).
  - Its current Requests for Startups favour AI that *does the work* over copilots ([YC RFS](https://www.ycombinator.com/rfs)).
  - Pitch ELIVO as a meeting agent that *acts* (drafts the follow-up, pulls the contract clause, updates the CRM), not as another notetaker.

---

## 5. Customer discovery and measuring "helpful insight"

**Interview questions (Mom Test style: ask about past behaviour, not hypotheticals):**
1. Tell me about the last meeting where you lacked a fact you knew existed somewhere. What was it, where was it, and what happened as a result?
2. What do you do in the 10 minutes before an important meeting? What do you open?
3. During meetings, do you search anything, and on which device? How often do you do it covertly?
4. What happened the last time a note-taker bot showed up in your meeting? Did a client object?
5. Who in your company decides whether recording tools are allowed? Has anything ever been blocked?
6. For sales: how do you currently hear about a competitor mention or pricing objection, and how fast?
7. Would the other side's knowing you had an AI assistant change the meeting? Walk me through a real example.
8. What would make you turn off an assistant permanently? (Probe for the interruption threshold.)
9. What do you pay for today (Otter, Copilot, Plaud, Yating), who approved it, and what do you use it for?
10. Which documents or emails would you *never* let a tool read?

**Validation experiments:**
- **Wizard-of-Oz:** a human analyst listens (with consent) and pushes insight cards to a side screen in 20–30 real meetings. Measure use and willingness to pay before building real-time ML.
- **Retrospective replay:** give users post-meeting "insights we would have shown." They rate each card as would-have-helped, neutral or distracting. This yields precision labels cheaply.
- **Fake door / pre-sale:** landing pages in Mandarin, English and Japanese for three segments. Collect paid LOIs from 3–5 consulting or sales teams.
- **Consent-friction test:** measure how often participants object when the visible notice is on, and what share of meetings users abandon.
- **Accuracy benchmark:** Mandarin, English and Taiwanese code-switched ASR word-error rate (WER) against Yating, Whisper-class models and platform-native captions, on real Taiwan meeting audio.

**Metrics:**
- **Precision** of surfaced insights: share rated useful, or acted on (expanded, pinned, copied, spoken).
- **False-interruption rate:** unhelpful or distracting cards per meeting-hour. Set a budget of, say, ≤1 per hour in interruptive mode.
- **Recall proxy:** "moments I wished I had X" from the post-meeting survey that the system did not catch.
- **Latency:** from the utterance that triggered the need to the card appearing.
- **Conversation-flow cost:** speaking pauses and gaze-away time, plus NASA-TLX workload scores.
- **Retention:** week-4 retention of users with real-time mode on, compared with transcript-only users.

**Research grounding:**
- **Horvitz (CHI 1999), mixed-initiative principles:** act only when the *expected utility* of acting beats not acting, given uncertainty about the user's goal. Use graded actions: do nothing, offer quietly, ask, or act. Consider the cost of poor timing ([PDF](https://erichorvitz.com/chi99horvitz.pdf)).
- **Amershi et al. (CHI 2019), 18 Human-AI Guidelines:** notably G3 "time services based on context" and G4 "show contextually relevant information" ([ACM](https://dl.acm.org/doi/10.1145/3290605.3300233)).
- **Interruption-cost literature:**
  - Mark, Gudith and Klocke (CHI 2008), "The cost of interrupted work" ([ACM](https://dl.acm.org/doi/10.1145/1357054.1357072)).
  - Adamczyk and Bailey (CHI 2004): interruptions at task boundaries cost less ([ACM](https://dl.acm.org/doi/10.1145/985692.985715)).
  - Both citations are from memory; verify.
- **Recent work:**
  - CHI 2025 "Are We On Track?": active AI nudges during meetings felt intrusive when frequent or poorly timed; passive displays fared better ([arXiv](https://arxiv.org/abs/2504.01082)).
  - CHI 2025 proactive programming assistants: persistent suggestions were judged "distracting/annoying," and presence indicators reduced the disruption ([ACM](https://dl.acm.org/doi/10.1145/3706598.3714002), [ACM](https://dl.acm.org/doi/10.1145/3706598.3713357)).
  - CHI 2025, proactive voice agents moderating conflict in design teams ([ACM](https://dl.acm.org/doi/10.1145/3706598.3713457)).
  - **InsightToast** (arXiv, Aug 2026): proactive retrieval shown as peripheral, glanceable "toasts" kept conversation flow natural (N=16) ([arXiv](https://arxiv.org/abs/2608.31115)). This is very close to ELIVO's concept.
- **Design implication:** default to a **peripheral, glanceable side channel**. Escalate to an interruptive alert only above a high confidence-times-stakes threshold, and let users tune that threshold.

---

## 6. Brand and trademark check for "ELIVO" (not a formal clearance)

**Trademarks:**
- **USPTO:** serial **99496372**, "ELIVO" (stylized house logo), owner **Majestyhub LLC**, for household goods such as drain stoppers, mugs and lunch boxes ([uspto.report](https://uspto.report/TM/99496372)). The classes appear to be 21 and similar, **not** 9 or 42, so the conflict risk looks lower. I could not open TSDR to confirm classes or status **[unverified]**.
- **TIPO, EUIPO and WIPO:** I could not query these databases directly. Run TIPO (智慧局商標檢索), WIPO Global Brand Database and EUIPO TMview searches for classes **9, 42, 35 and 38**, including similar marks (ELIO, ELEVO, ELYVO, ELAI).

**Businesses using the name:**

| Name | What it is | Classes it would touch |
|---|---|---|
| Elivo (elivo.co) | AI "life concierge" and life-coach app | Closest overlap: AI assistant software, classes 9/42 |
| Elivo (elivo.io) | Hotel management and analytics software | Classes 9/42 |
| ELIVO (elivo.org) | Lithuanian design and dev studio | — |
| Elivo AB | Swedish company, on LinkedIn | — |
| Elivo Media | Digital-marketing agency | — |

- elivo.app hosts a Chinese A-share stock-research site.
- Sources: [elivo.co](https://elivo.co/), [elivo.io](https://www.elivo.io/en/), [elivo.org](https://elivo.org/), [LinkedIn](https://www.linkedin.com/company/elivo-ab).

**Domains (RDAP lookups I ran on 2026-09-29):**

| Domain | Status |
|---|---|
| elivo.com | Registered since 2002-04-02, expires 2027-04-02; the site did not respond |
| elivo.ai | Registered 2024-10-10, **expires 2026-10-10**, all client locks set; the site did not respond. Worth monitoring or a broker enquiry. |
| elivo.io | Registered, expires 2026-10-16 (the hotel software) |
| elivo.org | Registered 2025-05-25 |
| elivo.app | Registered 2026-01-27 |
| elivo.co | Live (the life-concierge app); the registry lookup failed |
| getelivo.com, tryelivo.com, useelivo.com | **Appear unregistered** (Verisign 404) |
| elivo.tw, elivo.com.tw | **Appear unregistered** (TWNIC 404; google.tw returned 200 as a control) |

- **意聯:** no Taiwan company or trademark named 意聯 was found by web search. The nearest was 意騰科技 (Intelligo, TWSE 7749-KY), a speech/audio chip company. The name is different, but it is in an adjacent field (voice).
- **Recommendation:** check the 經濟部 company registry (商工登記) and TIPO directly, and file TIPO and a Madrid application for classes 9/42 early.
- **Overall:** "ELIVO" is used by several small software companies, including an AI assistant. It is not a strong, clearly ownable mark in software. Commission a professional search before investing in the brand.

---

## Compliance-by-design checklist

1. **No training on customer content.** Default off, admin-enforced workspace-wide, written into the DPA and ToS. Sub-processor LLMs must be zero-retention and no-training.
2. **Visible disclosure by default.** An on-screen "ELIVO is transcribing" badge, an auto chat message or opening notice, and a light, sound or voice prompt on the device. Stricter in all-party jurisdictions (the 11 all-party US states, Germany and the EU).
3. **Participant rights.** Anyone in the meeting can request pause or deletion through a link in the notice. There is a "pause for sensitive part" control.
4. **Presence gating.** Record only while the owner is an active participant. No auto-join of unattended meetings. The device stops when the owner leaves.
5. **Biometrics.** Diarization without persistent voiceprints by default. Speaker ID only after per-person written opt-in, with a public retention and destruction schedule (BIPA, GDPR Art. 9, Colorado).
6. **EU AI Act.**
   - No voice, face or video emotion inference about employees or colleagues in any market build (simplest).
   - Text-only "discussion tone" labelled as such.
   - Customer-emotion features off, and treated as high-risk if ever built.
   - Art. 50 disclosure that users are interacting with AI and that content is AI-generated.
7. **Data minimisation and retention.** Configurable retention (e.g., 30/90/365 days). Audio deleted after transcription by default. Deletion cascades to embeddings, indexes and backups.
8. **Residency.** Taiwan region first; then Japan, EU and US regions. A Taiwan backup option for financial customers. An on-prem or appliance SKU on the roadmap.
9. **Supply-chain provenance.** No PRC-origin models, SDKs or clouds in government, finance or critical-infrastructure SKUs (資安法). Maintain an SBOM and a model register.
10. **Security programme.** SOC 2 Type I, then Type II (Vanta or Drata), and ISO 27001. ISO 27701:2025 for privacy. ISO 42001 once enterprise AI governance is asked for.
11. **Breach readiness.** An incident plan that meets the PDPC reporting duty under the 2025 PDPA amendment, GDPR's 72 hours, and US state notice laws.
12. **Enterprise controls.** SSO/SCIM, RBAC, audit logs, legal hold, per-workspace retention, the ability to disable recording for certain meeting types or domains, and a DLP option for connected email and docs.
13. **Connector scoping.** Least-privilege OAuth scopes for docs and email. Show users which source each insight came from. Honour the source system's permissions when retrieving.
14. **Documentation.** A DPIA template for customers, a Record of Processing, and a transparency note (model limits, hallucination risk). Counsel-reviewed notice templates in Traditional Chinese, English and Japanese.
15. **Marketing hygiene.** Never advertise invisibility or undetectability. The Granola complaint quotes "other people…won't know it's there," and Cluely's "cheat" branding backfired.