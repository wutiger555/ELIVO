# 產品發佈與商業模式：從原型到可販售的產品

> 狀態：2026-09-30 初版研究。競品資料查自各家官方頁面（附連結），查不到的標「待驗證」。價格會變動，引用前請再確認。
> 對應：[`02-project-plan.md`](02-project-plan.md) §7 定價、[`03-technical-architecture.md`](03-technical-architecture.md) §6 單位經濟、ADR-0002、ADR-0004、ADR-0006。

---

## 1. 結論：直接回答四個問題

1. **能不能包成一個產品讓人用？可以，而且不用讓使用者自己下載一堆模型。**
   - 業界主流是「安裝包本身小，第一次啟動時在背景下載一個模型」，MacWhisper、Superwhisper、WhisperKit 都這樣做。
   - ELIVO 只需要**一個 ASR 模型**（Breeze q8 約 1.7 GB，或 q5 約 1.1 GB），依機型自動選。LLM 在雲端，使用者不用下載。
   - 模型還沒下載完之前，可以先用 macOS 內建的 Apple SpeechAnalyzer（零下載），讓使用者一裝好就能開始。
2. **AI 的 API key 要使用者自己準備嗎？不要。**
   - 我們查的 5 家主流會議筆記產品（Granola、Otter、Fireflies、Read AI、tl;dv）**全部由廠商內含 LLM 成本**，官方頁面都沒有公開 BYOK（自帶金鑰）。
   - 做法是：app 透過 **ELIVO 的雲端 LLM 閘道**呼叫模型。金鑰在我們的伺服器上，閘道同時負責驗證帳號、用量配額與計費。
   - 「自帶雲」（客戶自己的 Azure OpenAI、AWS Bedrock，或像 IBM ICA 這類企業平台）留給**企業方案**。
3. **怎麼收費？訂閱制，但現在的 LLM 用法要先大幅降成本。**
   - 本機 ASR 幾乎零成本，所以「逐字稿不限量」可以當免費方案的賣點，這是雲端 ASR 的競品做不到的。
   - ⚠️ 依目前原型的實測 token 數，會中持續整理每小時要 **US$1.25–1.65** 以上（見 §5.1），是規劃文件假設的 4–5 倍。照這個成本，Pro 方案會賠錢，必須先降到每小時 US$0.25 左右。
4. **現行做法要怎麼改？** 主要是五件事：
   - 加入帳號與授權。
   - 自建 LLM 閘道，取代鑰匙圈裡的開發者金鑰。
   - 做模型管理器，負責下載、驗證、依機型選模型。
   - 打包成已簽章的 Mac app（Tauri ＋ Swift helper ＋ 內嵌 runtime）。
   - 把 LLM 呼叫的頻率與輸入量降下來。

   詳細清單見 §6。

---

## 2. 競品怎麼做

### 2.1 會議筆記產品

| 產品 | Bot | ASR 在哪 | LLM 誰付 | 最低付費方案（月繳／年繳，每人每月） | 中文與中英混說 |
|---|---|---|---|---|---|
| [Granola](https://www.granola.ai/pricing) | 只有 bot-free | 雲端（Deepgram、AssemblyAI） | 廠商 | Business US$14（只有月繳） | 有 Mandarin；code-switching 待驗證 |
| [Otter](https://otter.ai/pricing) | 兩者都有 | 雲端 | 廠商（Anthropic） | Pro US$16.99／8.33 | 簡中 beta，一次只能一種語言 |
| [Fireflies](https://fireflies.ai/blog/fireflies-pricing-which-plan-is-right-for-you) | 兩者都有 | 雲端 | 廠商；進階 AI 功能扣 credits | Pro US$18／10 | **明確支援句內中英切換**（Business 以上，beta），列出 Taiwan Mandarin |
| [Read AI](https://www.read.ai/plans-pricing) | 兩者都有 | 雲端 | 廠商 | Pro US$19.75／15 | 有 Mandarin；code-switching 待驗證 |
| [tl;dv](https://tldv.io/app/pricing/) | 兩者都有 | 雲端 | 廠商（Anthropic） | Pro €29／18 | 待驗證 |
| [Jamie](https://www.meetjamie.ai/pricing) | 只有 bot-free | 雲端（法蘭克福） | 廠商 | Plus €21（年繳） | 自稱支援 code-switching（待驗證） |
| [Krisp](https://krisp.ai/pricing/) | bot-free | **英文在本機**，其他語言在雲端 | 廠商（Azure） | Core US$16／8 | 中文不在清單內（待驗證） |
| [Notion AI Meeting Notes](https://www.notion.com/pricing) | bot-free | 雲端 | 廠商（綁 Business 方案） | US$20／16 | 有中文 |
| [Meeting Ink](https://ink.dwave.cc/zh-TW/pricing)（台灣） | bot 與 app | 雲端 | 廠商 | Pro NT$2,790／年（每月 20 小時） | 針對繁中 |
| [雅婷逐字稿](https://developer.yating.tw/en-US/pricing)（台灣） | app／網頁 | 雲端 | 廠商 | API 串流 NT$96／小時；app 價格待驗證 | 中英混說、台語、粵語；另有地端 FedGPT |

**重點**：

- **ASR 全都在雲端**：沒有一家在裝置上做中文轉錄。Krisp 只有英文在本機。**ELIVO「本機 Breeze＋中英混說」在這裡是真正的差異化**，同時也是成本優勢。
- **LLM 全由廠商付費**，官方頁面都沒有公開 BYOK。Fireflies 對進階 AI 功能改用 credit 制；Otter、tl;dv 則是對 AI 對話設次數上限。
- **平台免費化的壓力是真的**：
  - [Zoom](https://zoom.us/pricing) 付費方案內含摘要與逐字稿，免費方案每月也有 3 次。
  - [Google Meet](https://knowledge.workspace.google.com/admin/meet/let-google-meet-ai-take-notes-for-my-users) 從 Business Standard 起內含，但**支援語言沒有中文**。
  - Teams 要 Premium 或 Copilot 授權。
  - 繁中與中英混說，是平台內建功能的弱點。
- **企業需求**：SSO、SCIM、HIPAA 幾乎都只在 Enterprise 方案。資料區域大多只有美國，tl;dv 在歐洲。沒有一家提供地端部署；台灣只有雅婷的 FedGPT 有地端選項。

### 2.2 在 Mac 上跑本地模型的 app（看他們怎麼發佈模型、怎麼收費）

| 產品 | 模型怎麼到使用者電腦 | 收費 | LLM |
|---|---|---|---|
| [MacWhisper](https://macwhisper.com) | app 內「Manage Models」下載，75 MB–3 GB 可選 | 免費版＋Pro 一次買斷 €64 | 自帶金鑰，**或**付費訂閱它自家的 Assistant（含雲端轉錄） |
| [Superwhisper](https://superwhisper.com/docs/billing/plans) | app 內下載，75 MB–3 GB | 免費（本機不限）、Pro US$8.49／月、終身 US$249.99 | **Pro 內含雲端 LLM，「不需要 API key」**，自帶金鑰為選配 |
| [Aiko](https://apps.apple.com/us/app/aiko/id1672085276) | **模型直接包在 app 裡**（1.8 GB） | 一次買斷 US$24 | 沒有 LLM |
| [WhisperKit](https://github.com/argmaxinc/WhisperKit) | 依機型**自動下載推薦模型**並快取（依 `config.json` 的 device_support） | 開源（MIT） | — |
| [Argmax Pro SDK](https://www.argmaxinc.com/pricing) | 同上，另有串流與 diarization | 每裝置每月 US$1.33（年繳 US$1.00），**最少 1,000 授權** | — |
| [Apple SpeechTranscriber](https://developer.apple.com/videos/play/wwdc2025/277/) | **由系統管理，不佔 app 大小**，自動更新 | 免費（macOS 26 以上） | — |

**重點**：

- 主流是**安裝後在 app 內下載**；只有 Aiko 把 1.8 GB 模型整包放進安裝檔。
- **依機型自動選模型**已是常見做法。例如 WhisperKit 在 M1 預設用壓縮版 large-v3，M2 以上用完整版。
- 「本機功能一次買斷、雲端功能訂閱」與「訂閱內含雲端 LLM」兩種模式都有人做。**要持續付 LLM 成本的產品，都走訂閱。**
- Mac App Store 可以接受大型 app（上限 200 GB），但 macOS 不支援 On-Demand Resources，要改用 Apple 代管的 Background Assets（OS 26 以上）。另外，**Core Audio process tap 與背景 helper 行程在 App Store 沙盒下的限制待驗證**。一開始建議走官網下載的已簽章、已公證 DMG。

---

## 3. 本地模型怎麼發佈：ELIVO 的建議

1. **安裝包只放程式**，目標 150–250 MB（Tauri 介面、Swift 擷取 helper、ASR 與會議記錄核心）。
2. **第一次啟動：偵測硬體 → 背景下載一個 ASR 模型**，可續傳、驗證 SHA256、有進度條。

   | 機型 | 預設 | 大小 |
   |---|---|---|
   | Apple silicon，記憶體 16 GB 以上 | Breeze-ASR-25 q8_0 | 1.7 GB |
   | Apple silicon，8 GB | Breeze q5_0；太慢時改雲端 ASR | 1.1 GB |
   | Intel Mac、效能不足 | 雲端 ASR（經 ELIVO 閘道，例如 Soniox） | 0 |

3. **下載完成前先能用**：
   - 以 Apple SpeechAnalyzer 產生暫時的逐字稿（零下載，系統內建）。
   - 它**一個 transcriber 只能設一種語言**，中英混說較弱，所以只當過渡與備援。
4. **模型獨立更新**：模型放在我們的 CDN（例如 Cloudflare R2），附簽章與版本清單。app 可以更新模型而不用重裝，也方便之後換成更好的模型。
5. **本地 LLM 不是預設**：只給 24 GB 以上機型的「隱私模式」或企業方案（例如 Qwen3-4B，MLX）。一般使用者只需要一個 ASR 模型。
6. **授權確認**：

   | 元件 | 授權 | 商用 |
   |---|---|---|
   | Breeze-ASR-25 | Apache-2.0 | 可以 |
   | whisper.cpp | MIT | 可以 |
   | Silero VAD | MIT | 可以 |
   | OpenCC | Apache-2.0 | 可以 |

   若改用 Argmax Pro SDK，要另外評估每裝置授權費。

---

## 4. AI 金鑰與成本：改成 ELIVO 代管的 LLM 閘道

**現況**：開發者自己的 ICA 或 Anthropic 金鑰放在鑰匙圈。這只適用於開發。**IBM ICA 是 IBM 內部資源，不能拿來服務外部客戶。**

**建議**：

```text
ELIVO app ──(帳號 token)──▶ ELIVO LLM 閘道（雲端）──▶ Anthropic／Bedrock／Azure／Gemini…
                              ├ 驗證帳號與方案
                              ├ 用量配額、計量、超量處理
                              ├ prompt 放在伺服器端（保護 know-how，可即時改）
                              ├ 依任務選模型、供應商備援（ADR-0002）
                              └ 只用 zero-retention、不訓練的合約
```

- **一般使用者**：登入就能用，沒有金鑰要管。
- **企業方案**：
  - 「自帶雲」：閘道改用客戶自己的 Azure OpenAI、Bedrock 或企業平台。
  - 「地端」：LLM 也在客戶環境，搭配本地模型。
- **隱私承諾**：
  - 音訊不上雲（本機 ASR）。
  - 送到雲端的只有逐字稿文字，走 zero-retention，不用來訓練。
  - 提供「純本機模式」：不送 LLM，只有逐字稿。

---

## 5. 訂閱與定價

### 5.1 ⚠️ 先處理成本：目前原型的 LLM 用量太高

依 2026-09-30 合成會議實測的 token 數（ICA，Claude Haiku 4.5）推估：

| 項目 | 實測 | 推估每小時（持續有人說話） |
|---|---|---|
| 即時抽取 fast：每 12 秒一次 | 平均 input 2,225／output 255 tokens，約 US$0.0035／次 | **約 US$1.05** |
| 反思整理 reflect：每 150 秒一次 | 平均 input 2,912／output 1,071 tokens | Haiku 約 US$0.20；Sonnet 4.6 約 US$0.60 |
| **合計** | | **約 US$1.25–1.65**；會議越長，整理時要讀的逐字稿越多，實際更高 |

以每人每月 30 會議小時計算，這是 **US$37–50／人·月**。高於 Pro 方案售價（約 US$20–25），毛利是負的。

**降成本做法**（目標每小時 ≤ US$0.25，約每人每月 US$7.5）：

1. **Prompt caching**：system prompt 與規則是固定的，快取後輸入費大約只要一成。
2. **降低 fast 頻率**：改成「換人說話、停頓超過 700 ms，或累積 30 秒」才抽取，不是每 12 秒一次。
3. **只送差異**：目前記錄改用精簡格式，不要每次都送完整 JSON。
4. **reflect 改成事件驅動**：偵測到換話題，或每 5 分鐘一次；長會議只送最近的逐字稿加上摘要。
5. **分層用模型**：
   - fast 用最便宜的模型（Haiku、Gemini Flash-Lite、GPT nano 級）。
   - reflect 只在會議結束時用較強的模型。
   - 24 GB 以上機型可以把 fast 改用本地小模型。
6. **量測**：每一次呼叫的 token 已經記錄在 `stream-*.jsonl`，之後在 eval harness 加上「每會議小時成本」指標。

**2026-09-30 實測（節省模式）**：用 `services/realtime/eval/replay_minutes.py` 重播合成會議 `meeting-long`（60 句、約 6.4 分鐘，含閒聊、決策翻盤、數字變更、問題被回答），以 13 項檢查驗品質，成本依公開牌價換算。

| 模式 | 設定 | 呼叫次數（fast／reflect） | 推估每會議小時 | 檢查 |
|---|---|---|---|---|
| 高品質（quality） | fast 每 12 秒；reflect 每 150 秒送全文，用 Sonnet 4.6 | 31／3 | US$1.38 | 13/13 |
| 節省 v2 | 攢到 80 字或 90 秒才 fast、閒聊不送、精簡格式；reflect 每 300 秒只送最近逐字稿加摘要 | 13／1 | US$0.75 | 13/13 |
| **節省 v3（現行預設）** | v2 ＋ reflect 只回傳有變動的項目 | 13／1 | **US$0.59** | 13/13 |
| 節省 v3，fast 改用 Gemma 4 26B | 同上 | 13／1 | 約 US$0.40（估） | 13/13，但輸出冗長、偶有截斷 |

- 實際服務端到端跑同一場（真實 ASR、兩條音軌）：6 分鐘 14 次 LLM 呼叫，決策翻盤與數字變更都有正確更新。
- 節省 v3 裡 fast 佔成本約 73%。下一個槓桿是 fast 換成 nano 級便宜模型（估約 US$0.19／小時），這要等 LLM 閘道（§4）接上其他供應商才能驗證；ICA 的付費模型額度已用完，這次無法實測。
- Prompt caching 尚未驗證（ICA 不支援；Anthropic 直連的最低快取長度待確認）。
- 限制：合成會議、內容密集，每種設定只跑一次。要用真實、取得同意的會議錄音再驗一次。
- **產品上**：節省模式是所有方案的預設；高品質模式保留給 Pro 以上或以 credits 計費。

### 5.2 方案建議（修正 `02-project-plan.md` §7）

| 方案 | 價格（建議） | 內容 | 說明 |
|---|---|---|---|
| **Free** | NT$0 | **本機逐字稿不限量**；每月 5 會議小時的 AI 會議記錄；30 天歷史 | 本機 ASR 近乎零成本，「逐字稿不限量」比競品的每月 300–400 分鐘有吸引力 |
| **Pro** | NT$690／月（年繳）、NT$790（月繳） | AI 會議記錄 fair use 40 小時／月、Decision Ledger、Spaces、第二螢幕、Ephemeral | 成本降到每小時 US$0.25 時，毛利約 65%；超量改賣 credits 加值包 |
| **Team** | 約 US$35–45／人·月 | 共享 Spaces 與帳本、管理員政策、SSO（Team+） | 與原計畫相同 |
| **Enterprise** | 年約報價 | 自帶雲（Azure、Bedrock、企業 AI 平台）、地端 LLM、台灣資料落地、DPA、SCIM | 平台內建與國外競品都沒做好的地方 |

- **價位參考**：國外同類產品每人每月約 US$8–20（年繳），台灣 Meeting Ink 年繳約 NT$233／月（每月 20 小時）。NT$690 屬於中高價位，要靠「本機隱私、中英混說、Decision Ledger」撐住。定價要在 Phase 1 試點時驗證付費意願。
- **不建議一次買斷**：會議記錄有持續的 LLM 成本。若要吸引只想要逐字稿的人，可以考慮「純本機版一次買斷」，但這會分散產品定位，先不做。
- **收款**：B2B 在台灣需要開統一發票。金流可選 Stripe（海外）加上台灣的金流與電子發票服務，待評估。

---

## 6. 現行架構要改的地方

| 項目 | 現在 | 要改成 | 位置 |
|---|---|---|---|
| 帳號與授權 | 沒有 | 登入、裝置 token、方案與授權檢查（可離線使用一段時間） | 新增雲端服務 |
| LLM 呼叫 | 鑰匙圈裡的開發者金鑰（ICA、Anthropic） | 新增 `elivo` provider 走 LLM 閘道；ICA／Anthropic 只留作開發與企業自帶雲 | `services/realtime/elivo/llm.py`；新增 `services/gateway/` |
| LLM 成本 | 每 12 秒 fast＋每 150 秒 reflect | prompt caching、事件驅動、精簡輸入、分層模型（§5.1） | `services/realtime/elivo/minutes.py` |
| 模型 | 手動放在 `~/.cache/whisper.cpp` | 模型管理器：依硬體選模型、背景下載、續傳、SHA256、版本更新；SpeechAnalyzer 當過渡 | 新增模組＋`apps/capture-mac` |
| whisper.cpp | Homebrew 安裝的 `whisper-server` | 隨 app 附上已簽章的 whisper.cpp（server 或函式庫） | 打包設定 |
| 發佈 | 開發者自己啟動 Python 與網頁 | Tauri app（介面）＋Swift helper＋內嵌 runtime；簽章、公證、自動更新 | `apps/desktop`（ADR-0004） |
| 核心執行環境 | Python（venv） | 短期：內嵌 Python（例如 python-build-standalone）當 sidecar；中期評估把即時核心改寫成 Swift／Rust，縮小安裝包並降低記憶體 | 待 ADR |
| 資料位置 | `~/ELIVO-data` | `~/Library/Application Support/ELIVO`；考慮本機加密；Team 方案再做雲端同步 | `config.py` |
| 雲端 ASR 備援 | 沒有 | 低階機型與 Intel Mac 走閘道的雲端 ASR | ADR-0006 |
| 隱私 | 開發階段 | 次處理者清單、zero-retention 合約、純本機模式、錄音告知（已有） | `docs/06` |

**建議新增的 ADR**：

- **ADR-0007 產品發佈與模型管理**：安裝包大小、首次下載、依機型選模型、SpeechAnalyzer 過渡、官網 DMG 或 App Store。
- **ADR-0008 LLM 閘道與計費**：取代使用者自備金鑰、配額與 credits、自帶雲的企業選項、zero-retention 供應商。
- 同時修訂 ADR-0002，加入閘道層；修訂 ADR-0004，說明 Python sidecar 或核心改寫的決定。

---

## 7. 風險與待驗證

- **成本估算只來自一場 110 秒的合成會議**，要用真實會議（30–60 分鐘）重測，並驗證降成本後品質沒有下降。
- **Apple SpeechAnalyzer 的中英混說品質**、支援語系清單（zh_TW 出自第三方整理），都要實測。
- **Mac App Store**：沙盒是否允許 Core Audio process tap、背景 helper 與內嵌 runtime，待驗證。在那之前走官網 DMG。
- **付費意願**：NT$690 是假說，要在試點與訪談中驗證（`05-validation-plan.md`）。
- **競品價格與功能變動很快**：Zoom 在 2026-06 才把 AI Companion 改名為 ZoomMate。本文價格以 2026-09-30 官方頁面為準。
- **法遵**：逐字稿送雲端 LLM 要寫進告知與同意書；企業客戶可能要求資料留在台灣或自帶雲。
