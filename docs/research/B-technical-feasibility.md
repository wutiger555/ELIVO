> **研究附錄**（2026-09-29 由研究代理以公開網路資料彙整，已譯為中文）。每項非顯而易見的主張均附來源；標示「待驗證」者尚待一手資料確認。**非法律意見。**

# ELIVO 第 1–3 階段技術可行性報告

*研究日期 2026-09-29。除另有註明外，價格均為牌價或隨用隨付（pay-as-you-go）費率。「待驗證」表示我無法從一手來源確認該主張。*

---

## 0. 摘要

- **ASR 是風險最高的環節，而且沒有任何公開 benchmark 能回答這個問題。** 我找不到任何針對 **streaming** zh-TW／中英夾雜（code-switched）ASR 的獨立正面對比 benchmark。依廠商說法與批次（batch）benchmark 整理出的最強候選名單：**Soniox**（streaming 含 diarization $0.12/hr，內建 code-switching）、**ElevenLabs Scribe v2 Realtime**（$0.39/hr，在 2026 年 9 月一項企業 code-switch benchmark 所測模型中 ZH/EN 分數最佳）、**Speechmatics `cmn_en` 雙語**（real-time enhanced $0.43/hr），以及 **Deepgram Nova-3 zh-TW**（便宜，但中文不在其 code-switching「multi」清單中）。本地與開源模型方面，**Breeze-ASR-25**（針對台灣調校的 Whisper）與 **Qwen3-ASR** 是最佳候選。在決定廠商之前，請預留 2–3 週建立自有的 5–10 小時 zh-TW code-switch 測試集。
- **在 macOS 14.2+/14.4+ 上，免 bot 的音訊擷取已有解法**：透過 Core Audio process taps。這與 Granola 採用的做法相同。只有在需要每位與會者獨立音軌，或需涵蓋 Windows／會議室時才需要 bot。Recall.ai 目前收費 $0.50/hr。
- **雲端 pipeline 每會議小時成本約 $0.35–$1.10**（ASR + LLM + 檢索）。走超大型雲端業者（hyperscaler）ASR 路線約 $2/hr。混合本地 pipeline 約 $0.18/hr。
- **「何時浮現（when to surface）」的策略是產品的護城河。** HCI 研究一致發現，主動式協助能提升效率，但會打斷心流。預設採用環境式（ambient）顯示，任何更具侵入性的呈現則需經門檻把關後才升級。
- **第 2 階段硬體：** 做一個輕量的輔助顯示器，而不是 AI 小裝置。從 Plaud 的成功以及 Humane 與 Rabbit 的失敗學到的教訓是：要當既有工作流程的配件。
- **建議的第 1 階段技術堆疊：** Tauri 2（與 web 共用 React UI）+ Swift 擷取／推論 helper + Python（FastAPI）即時 pipeline + Postgres/pgvector，本地端則使用 sqlite-vec。

---

## 1. Streaming ASR 選項

### 1.1 商用 API

| 廠商／模型 | Streaming 價格 | Latency（廠商宣稱） | 即時 diarization | 自訂詞彙 | zh-TW／code-switch 備註 |
|---|---|---|---|---|---|
| **Soniox** `stt-rt-v5` | **$0.12/hr**（非同步 $0.10）[src](https://soniox.com/pricing) | 「sub-200ms」[src](https://soniox.com/speech-to-text/chinese) | 有，已含在價格內 | Context／instructions（以文字 token 計費） | 句中自動 zh↔en 切換，無需設定 [src](https://soniox.com/speech-to-text/chinese)。**未說明是否輸出繁體**（待驗證；可能需要 OpenCC）。未公布中文 WER。 |
| **Deepgram Nova-3** | 單語 $0.0048/min（**$0.29/hr**，促銷價；牌價 $0.0077/min）；多語 $0.0058/min [src](https://www.happyrobot.ai/hub/deepgram-pricing), [src](https://convertaudiototext.com/blog/deepgram-nova-3-explained) | 首個 partial 約 57 ms（英文）[src](https://artificialanalysis.ai/articles/new-streaming-speech-to-text-benchmark-aa-wer-streaming) | Streaming 加購 **+$0.002/min**（+$0.12/hr）[src](https://www.gladia.io/blog/deepgram-pricing) | Keyterm prompting [src](https://developers.deepgram.com/docs/keyterm) | Streaming 支援 `zh-TW`/`zh-Hant`；相較 Nova-2 相對 WER 降低 44.87%（批次）[src](https://deepgram.com/learn/deepgram-nova-3-expands-speech-to-text-support-across-asia-pacific)。**中文不在官方文件列出的 code-switching「multi」清單中**（en, es, fr, de, hi, ru, pt, ja, it, nl）[src](https://developers.deepgram.com/docs/models-languages-overview)。 |
| **AssemblyAI** | Universal-Streaming 多語 $0.15/hr；**Universal-3.6 Pro Realtime $0.45/hr**；diarization +$0.12/hr [src](https://www.assemblyai.com/pricing) | — | 有（U3.6 Pro 內建） | U3.6 Pro 與多語版含 keyterms | Pro realtime 產品線列有「Chinese」[src](https://www.assemblyai.com/blog/speech-to-text-api-pricing)。繁體輸出待驗證。U-3.5-Pro 在 CoSE-E 的 ZH/EN CER 為 4.6%（批次），見 §1.3。 |
| **ElevenLabs Scribe v2 Realtime** | 牌價 **$0.39/hr**；Business 年約約 $0.28 [src](https://www.therundown.ai/tools/scribe-v2-realtime) | partial 約 150 ms [src](https://elevenlabs.io/blog/introducing-scribe-v2-realtime) | Scribe v2 列有 diarization；realtime diarization 待驗證 | Keyterm prompting，最多 1,000 個詞 | 90+ 種語言，自動語言切換。在 CoSE-E 測試的系統中批次 ZH/EN WER 最佳（§1.3）。 |
| **Speechmatics** | RT Standard $0.24/hr；**RT Enhanced $0.43/hr**（2026 年 7 月由 $0.56 調降）[src](https://www.usagepricing.com/blueprint/activity/speechmatics-2026-07-06-realtime-stt-price-cut) | — | 有（即時語者 diarization） | 自訂詞典 | 專屬 **中英雙語包 `cmn_en`** [src](https://docs.speechmatics.com/speech-to-text/languages)。支援繁體與簡體中文 [src](https://www.speechmatics.com/pricing)。`cmn_en` *之內*是否輸出繁體待驗證。 |
| **Gladia Solaria-1** | $0.75/hr（Scaling 方案 $0.55）[src](https://www.gladia.io/pricing) | partial 103 ms，final 約 270 ms [src](https://www.gladia.io/blog/best-real-time-stt-models-for-meeting-assistants-2026) | 有 | 有 | 跨 100+ 種語言的 code-switching。無中文專屬數據。 |
| **OpenAI** | `gpt-realtime-whisper` / `gpt-live-transcribe` **$0.017/min（$1.02/hr）**；`gpt-4o-transcribe` $0.006/min；`gpt-4o-mini-transcribe` $0.003/min；`gpt-transcribe` $0.0045/min；`gpt-4o-transcribe-diarize` $0.006/min [src](https://developers.openai.com/api/docs/pricing) | — | 有 diarize 版本；realtime diarization 待驗證 | Prompt 文字 | 一般中文品質良好，但 Qwen 的表格顯示 GPT-4o 在 WenetSpeech-meeting 為 32.27（會議音訊表現差）[src](https://github.com/QwenLM/Qwen3-ASR) |
| **Google Chirp 3** | $0.016/min（**$0.96/hr**）[src](https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3) | — | **不支援 zh-TW**：各中文變體中，diarization 僅涵蓋簡體中文 | Adaptation | 支援 StreamingRecognize [src](https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3) |
| **Azure AI Speech** | 基本 $1.00/hr，diarization 與連續語言辨識（continuous LID）各 +$0.30/hr（全含約 **$1.60/hr**）[src](https://azure.microsoft.com/en-us/pricing/details/speech/) | — | 有（SDK 即時 diarization）[src](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-stt-diarization) | Phrase lists、Custom Speech | 支援 zh-TW。zh-TW 即時 diarization 待驗證。 |
| **AWS Transcribe** | $0.024/min（**$1.44/hr**）[src](https://brasstranscripts.com/blog/aws-transcribe-pricing-per-minute-2025-better-alternative) | — | 有，streaming [src](https://docs.aws.amazon.com/zh_tw/transcribe/latest/dg/diarization.html) | 自訂詞彙 | 支援 `zh-TW` streaming；zh-TW 不支援自訂語言模型 [src](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html) |
| **Alibaba Qwen3-ASR-Flash** | $0.000035/s（約 $0.13/hr）[src](https://openrouter.ai/qwen/qwen3-asr-flash-2026-02-10) | — | 待驗證 | Context | 中文表現強。Realtime 版本與繁體輸出待驗證。資料落地（data residency）對台灣企業買家可能是個問題。 |

### 1.2 開源與本地模型

| 模型 | 大小／授權 | Streaming | zh／code-switch 證據 | 適用性 |
|---|---|---|---|---|
| **MediaTek Breeze-ASR-25** | Whisper-large-v2 微調，Apache-2.0，2025 年 6 月 | 無原生 streaming（與 Whisper 一樣採分段） | CSZS-zh-en WER **13.01 vs 29.49**（Whisper-v2，−56%）；ASCEND-MIX 16.38 vs 21.01；CommonVoice16 zh-TW 7.97 vs 9.84 [src](https://huggingface.co/MediaTek-Research/Breeze-ASR-25) | **台灣 code-switching 證據最充分的模型。** 社群已有 WhisperKit CoreML [src](https://huggingface.co/fredchu/breeze-asr-25-whisperkit-coreml) 與 ggml/whisper.cpp [src](https://huggingface.co/tsuzuri-app/Breeze-ASR-25-ggml) 移植版。（Breeze-ASR-26 鎖定台語，而非中英夾雜 [src](https://huggingface.co/MediaTek-Research/Breeze-ASR-26)。） |
| **Qwen3-ASR** 1.7B / 0.6B | Apache-2.0 | 僅能透過 vLLM 做 streaming，streaming 模式下無時間戳記 | 1.7B：AISHELL-2 2.71，WenetSpeech net/meeting **4.97/5.88**，對比 Whisper-large-v3 9.86/19.11 [src](https://github.com/QwenLM/Qwen3-ASR)。未公布 code-switch 數據。 | 強大的伺服器端自架選項（GPU）。輸出簡體；以 OpenCC 轉換。 |
| **FunASR：Paraformer / SenseVoice / Fun-ASR-Nano** | MIT／Apache 類授權（請逐一確認各模型） | Paraformer-streaming、Fun-ASR streaming | 廠商部落格中文 CER：SenseVoice 7.81%、Fun-ASR-Nano 8.06%、Paraformer 10.18%、Whisper-v3 約 20% [src](https://www.funasr.com/en/blog/which-funasr-model.html)（與廠商有關聯的部落格）。Paraformer 支援熱詞（hotwords）。 | CPU 上非常快；適合邊緣裝置。輸出簡體。 |
| **Whisper large-v3 / turbo** | MIT | 僅分段 | 因語言辨識錯誤而在 ZH/EN code-switch 上失效：CoSE-E ZH/EN WER **1.494**（比完全沒用還糟）[src](https://arxiv.org/html/2609.35645) | 除非強制指定語言或進行微調（Breeze 正是這麼做），否則 code-switching 情境應避免使用。 |
| **WhisperKit / Argmax Pro SDK** | 核心開源；Pro 為商用 | 有；0.46 s latency，2.2% WER（英文）[src](https://arxiv.org/abs/2507.10860) | 語言品質取決於載入的模型（可載入 Breeze CoreML） | 最佳的 Apple 裝置端 runtime。Pro SDK 內含 Parakeet v3 與 **Sortformer streaming diarization** [src](https://www.argmaxinc.com/blog/speakerkit)。價格未公開（待驗證）。 |
| **Apple SpeechAnalyzer**（macOS 26） | 作業系統框架，免費 | 有 | 42 種 locale 中支援簡體中文、繁體中文與香港中文 [src](https://loronote.com/en/blog/apple-speechanalyzer-vs-whisper)。某 benchmark 英文 WER 2.12% [src](https://www.developersdigest.tech/blog/apple-speechanalyzer-vs-whisper-benchmark)。無 code-switch 數據。 | 零成本備援與隱私模式。每個 transcriber 只能設一個 locale，因此 code-switching 可能較弱（待驗證）。不支援自訂詞彙。 |
| **NVIDIA Parakeet TDT v3** | CC-BY-4.0 | 有 | **不支援中文**：25 種歐洲語言 [src](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) | 無法用於中文。 |
| **Kyutai STT** | CC-BY | 有（0.5 s 延遲） | 僅英文／法文 [src](https://kyutai.org/stt/) | 無法使用。 |
| **Moonshine v2** | — | 有 | 訓練語言中列有中文 [src](https://github.com/moonshine-ai/moonshine-v2)；無中文 benchmark | 僅列入觀察名單。 |

### 1.3 與中文／code-switching 相關的已發表 benchmark

- **CoSE-E（ServiceNow，arXiv 2609.35645，2026 年 9 月 28 日）：** 企業 code-switch benchmark，批次、zero-shot，含 294 則 ZH/EN 語句 [src](https://arxiv.org/html/2609.35645)。

  | 模型 | ZH/EN WER（jieba） | CER |
  |---|---|---|
  | Qwen3-Omni | 0.040 | 0.039 |
  | ElevenLabs Scribe-V2 | 0.073 | 0.031 |
  | Gemini-3-Flash | 0.090 | 0.041 |
  | AssemblyAI U-3.5-Pro | 0.093 | 0.046 |
  | Whisper-v3-turbo | 1.494 | 2.516 |

  Deepgram Nova-3 Multilingual 與 Parakeet 有在其他語言組合上評測，但未評測 ZH/EN（Deepgram 的多語模型不支援 ZH/EN）。
- **ASCEND / SEAME：** 標準的自發性中英夾雜語料庫。SEAME 約 192 小時的新加坡／馬來西亞語音。一項 2025 年的評估報告 ASCEND 的 MER 為 20.4%、SEAME 為 39.72%，而在切換點本身的錯誤率更高（PIER 34–59%）[src](https://arxiv.org/html/2609.35645)。SEAME 與 ASCEND 的口音與台灣華語不同，僅能當作參考指標。
- **台灣專屬：** CSZS-zh-en、CommonVoice zh-TW 與 Formosa 資料集的結果由 Breeze 提供（見上表）。
- **Streaming 排行榜（Artificial Analysis AA-WER Streaming）僅有英文** [src](https://artificialanalysis.ai/articles/new-streaming-speech-to-text-benchmark-aa-wer-streaming)。Soniox 的公開 benchmark 亦同 [src](https://soniox.com/benchmarks)。

**建議：**
- 建立內部評測：5–10 小時真實的台灣商務會議（含英文術語），遠端與實體會議室皆需涵蓋。
- 評分項目：MER、切換點錯誤、對自家 keyterm 清單的術語召回率，以及首個 partial 與 final 的 latency。
- 測試 Soniox、Scribe v2 RT、Speechmatics `cmn_en`、Deepgram zh-TW 與 AssemblyAI U3.6 Pro。離線則測試 Breeze-ASR-25 與 Qwen3-ASR。
- 對任何輸出簡體的引擎，規劃 **OpenCC `s2twp`** 後處理步驟（簡體轉台灣正體，含詞彙轉換）。

---

## 2. 即時語者 diarization

| 選項 | 即時？ | 數據 | 備註 |
|---|---|---|---|
| **NVIDIA Nemotron 3 Diarization**（2026 年 9 月 23 日） | 是。緩衝 latency 0.32 / 0.64 / 1.04 / 30.4 s | 最多 **8 位語者**；DIHARD III 在 1.04 s 下 DER 13.18%；VoiceArena 第 1 名（14.72%）[src](https://huggingface.co/blog/nvidia/nemotron-diarization) | 100M 參數，OpenMDW 授權。以 21 種語言訓練。Baseten 代管價格約 1¢/hr [src](https://www.baseten.co/blog/nvidia-nemotron-3-diarization/)。 |
| **Streaming Sortformer 4spk v2.1** | 是，0.32 s 起 | CALLHOME-2spk 6.57%、4spk 12.44%、DIHARD III 13.24%。**硬上限 4 位語者**：5 位以上時 DER 42.56% [src](https://huggingface.co/nvidia/diar_streaming_sortformer_4spk-v2.1) | 可透過 Argmax Pro 在 Apple 平台使用 [src](https://www.argmaxinc.com/blog/speakerkit) |
| **pyannoteAI** | 透過 Live-1 API（beta）支援 streaming；開源的 Community-1 僅限離線 | Precision-2 自 €0.096/hr 起；Community-1 €0.035/hr [src](https://www.pyannote.ai/pricing) | 會後離線精修 |
| **廠商內建** | Soniox（已含）、AssemblyAI（+$0.12/hr）、Deepgram（+$0.12/hr）、Azure（+$0.30/hr）、Speechmatics、AWS | — | 最簡單的路徑。中文品質未經量測。 |

**為什麼實體會議室單一麥克風的 diarization 很難：**
- 遠場單一遠距麥克風（AMI「SDM」）的 SNR 遠低於頭戴式麥克風。
- 重疊語音是主要錯誤來源：一項 SDM 會議研究發現 **27.9% 的音框有兩位語者同時說話** [src](https://arxiv.org/html/2402.08932v1)。
- 殘響與相近的嗓音會讓分群不穩定。Streaming 模型還必須在不到 1 s 的 context 下決定標籤。

**設計上的意涵：**
- **遠端會議：** 免費利用聲道分離。麥克風＝「我」，系統音訊＝「其他人」。只需對系統音訊聲道做 diarization。
- **姓名：** 要取得真正的每位與會者身分，需要 bot、Zoom RTMS，或讀取發言者 UI（很脆弱）。否則就讓使用者為各分群命名一次，並依聯絡人保存語者 embedding（enrollment）。
- **實體會議室（第 2 階段）：** 麥克風陣列的到達方向（DoA，XVF3800）是 diarization 的強力額外線索。
- 在 UI 中將 diarization 標籤視為暫定，並於會後離線重新 diarize。

---

## 3. 音訊擷取

### 3.1 macOS 原生（建議）

- **Core Audio process taps**（`AudioHardwareCreateProcessTap` + `CATapDescription` + aggregate device）：
  - 此 API 於 macOS 14.2 推出；Apple 的範例與 TCC 行為以 14.4 以上為目標 [src](https://developer.apple.com/documentation/CoreAudio/capturing-system-audio-with-core-audio-taps), [src](https://github.com/insidegui/AudioCap)。
  - 所需權限是範圍較窄的 **「僅系統音訊錄製」（System Audio Recording Only）**（`NSAudioCaptureUsageDescription`），而非螢幕錄製 [src](https://developer.apple.com/documentation/bundleresources/information-property-list/nsaudiocaptureusagedescription)。
  - **沒有公開 API 可以事先檢查或請求該權限** [src](https://github.com/insidegui/AudioCap)。
  - 可以針對單一程序 tap（例如 Zoom）。瀏覽器較困難，因為音訊來自 helper 或 renderer 程序 [src](https://www.recall.ai/blog/core-audio-taps)。
- **ScreenCaptureKit：** 自 macOS 13 起支援系統音訊；麥克風擷取於 macOS 15 加入（依我的知識；Recall 的頁面寫 16+，兩者矛盾，故待驗證）。需要螢幕錄製權限，對使用者而言負擔較重。
- **Granola 的做法：**
  - 擷取裝置系統音訊加上麥克風，不使用 bot。無法隔離單一 app，所以音樂也會被轉錄。不儲存音訊 [src](https://help.granola.ai/article/transcription)。
  - 其轉錄次處理者（subprocessors）為 Deepgram 與 AssemblyAI [src](https://www.granola.ai/security)。
  - 某二手來源稱其以 Electron 加上原生 Swift helper 打造 [src](https://ampcode.com/threads/T-019c999d-a6a6-73db-8970-4804d16814c4)（待驗證）。
- **常見陷阱：**
  - 回音：麥克風加喇叭代表遠端語音會被擷取兩次。使用 `AVAudioEngine` voice processing（AEC），或以互相關（cross-correlation）去重。
  - 處理裝置切換（AirPods 切換）。
  - 兩條音訊流之間的取樣率轉換與時脈漂移 [src](https://www.recall.ai/blog/core-audio-taps)。
  - 較舊的 macOS 需要 BlackHole 之類的虛擬驅動程式。

### 3.2 瀏覽器擷取

- `getDisplayMedia` 分頁音訊在 Chromium 上可用。
- **在 macOS 上擷取系統或視窗音訊需要 Chrome 141+ 且 macOS 14.2+**，而且使用者每次工作階段都必須選擇視窗或螢幕並勾選「分享音訊」[src](https://blog.addpipe.com/getdisplaymedia-allows-capturing-the-screen-with-system-sounds-on-chrome-on-macos/)。Safari 與 Firefox 的支援情況待驗證。
- 這對於 Meet 在 Chrome 分頁中執行的 web MVP 來說可行，但不適合常駐的側邊面板。

### 3.3 會議 bot 與平台 API

| 路徑 | 狀態／價格 | 優缺點 |
|---|---|---|
| **Recall.ai** bot 或 Desktop Recording SDK | **$0.50/錄製小時**，轉錄 +$0.15/hr，無平台費（2026）[src](https://www.recall.ai/blog/new-recall-ai-pricing-for-2026) | 每位與會者獨立音訊（例如 Teams）[src](https://www.recall.ai/product/meeting-bot-api/microsoft-teams)。也可作為 Zoom RTMS 的前端 [src](https://docs.recall.ai/docs/meeting-direct-connect-for-zoom-rtms)。看得見的 bot 會增加社交摩擦。 |
| **Zoom RTMS** | 自 2026 年 5 月起可透過 Developer Pack 點數自助購買；僅限付費方案 [src](https://devforum.zoom.us/t/rtms-self-service-purchasing-is-now-available/144524)。每分鐘價格未公開（待驗證）。 | 免 bot 的 WebSocket 串流，提供分離的音訊、逐字稿與語者事件。需要 Marketplace app，並由主持人／管理員啟用。 |
| **Zoom Meeting SDK bot** | 每位使用者的原始 PCM [src](https://developers.zoom.us/docs/meeting-sdk/ios/add-features/raw-data/) | 需自行維運 headless Linux 基礎設施 |
| **Teams application-hosted media bot** | C#/.NET，正式環境需 **Azure 上的 Windows Server**，每台 VM 2+ vCPU [src](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/requirements-considerations-application-hosted-media-bots) | 對 1–3 人團隊來說負擔很重。改用 Recall。 |
| **Google Meet Media API** | **仍為 Developer Preview。** Cloud 專案、OAuth 主體*以及所有與會者*都必須加入註冊 [src](https://developers.google.com/workspace/meet/media-api/guides/overview) | 尚無法用於正式環境 |

**建議：** 優先採用原生擷取（macOS）。第 3 階段再為需要身分精確的語者或 Windows／會議室涵蓋的客戶加入 Recall.ai。

---

## 4. 即時 LLM pipeline

### 4.1 Latency 預算（目標：觸發語句後約 3–5 s 內出現卡片）

以下為工程估計，並非實測。

| 階段 | 預算 |
|---|---|
| 音訊片段到 ASR partial | 0.1–0.3 s（廠商宣稱 100–200 ms） |
| ASR final／端點偵測 | 語音停頓後 0.3–1.0 s |
| 增量擷取（小模型） | 0.5–1.5 s（短輸出，約 150 tokens） |
| 檢索：embed + hybrid search + rerank | 0.1–0.4 s（Zep 回報圖譜檢索 P95 300 ms [src](https://arxiv.org/abs/2501.13956)） |
| 卡片生成（中型模型，streaming） | 1–2 s |
| 等待換手邊界的門檻延遲 | 0–3 s（刻意設計） |

### 4.2 模型選項（每 1M tokens，輸入／輸出）

| 模型 | 價格 | 角色 |
|---|---|---|
| GPT-5-nano | $0.05 / $0.40 [src](https://developers.openai.com/api/docs/pricing) | 常駐擷取器 |
| GPT-5-mini | $0.25 / $2.00 | 擷取器或卡片撰寫者 |
| GPT-4.1-mini | $0.40 / $1.60 | 舊版選項 |
| Gemini 3.1 Flash-Lite | $0.25 / $1.50 [src](https://ai.google.dev/gemini-api/docs/pricing) | 擷取器 |
| Gemini 3.6–3.8 Flash | $0.75 / $3.75 至 2026 年 12 月 31 日，**2027 年 1 月 1 日起加倍** [src](https://ai.google.dev/gemini-api/docs/pricing) | 卡片撰寫者 |
| Claude Haiku 4.5 | $1 / $5（Anthropic API 定價，2026 年 9 月） | 擷取器或卡片撰寫者（中文能力強） |
| Claude Sonnet 5.5 | $2 / $10 | 卡片撰寫者與會後摘要 |
| 本地：MLX 上的 Qwen3-4B/8B | 邊際成本為零。Apple Silicon 上 prefill 約 159 / 93 tok/s [src](https://arxiv.org/pdf/2601.19139) | 隱私模式擷取 |

### 4.3 Streaming 擷取架構

1. **兩層串接（cascade）。**
   - Tier 1 是便宜的模型，每約 15–20 s 視窗執行一次，或在每個 ASR final 片段時執行。輸入為精簡的滾動狀態（實體表、開放中的議題、候選決策）加上新文字。輸出為結構化 JSON：`entities[]`、`topic_shift`、`decision_candidate`、`action_item{owner,due}`、`question_unanswered`、`retrieval_query`、`salience 0–1`。
   - Tier 2 是較強的模型，只有在 Tier 1 的 salience 與檢索命中超過門檻時才呼叫。它負責撰寫卡片並引用來源。
2. **Prompt caching。** 將 system prompt 與詞彙表保持靜態作為快取前綴，再附加新文字。這大約可讓 Tier-1 的輸入成本減半。
3. **自訂詞彙迴圈。** 同一份詞彙表（產品名稱、客戶名稱、英文縮寫）同時用於 ASR keyterms、LLM 正規化（修正 ASR 拼寫），以及作為實體種子。

### 4.4 決定「何時浮現」

建議策略（我的設計提案，非出自論文）：

- `score = relevance × novelty × confidence × actionability − interruption_cost(context)`
- **相關性（Relevance）：** 目前視窗與檢索到項目之間的 reranker 分數。
- **新穎性（Novelty）：** 1 − 與已顯示卡片或本場會議已說過內容的最大 cosine 相似度。
- **信心度（Confidence）：** 擷取器的自我回報，依使用者回饋校準，再加上關鍵詞的 ASR 信心度。
- **打斷成本（Interruption cost）：** 使用者正在說話時較高。只在換手邊界浮現（VAD 靜音超過 700 ms 或語者變換）。成本隨最近 N 分鐘內的卡片數量呈指數上升。
- **硬性限制：** token bucket，例如每 2 分鐘最多升級 1 張卡片、每小時最多 8 張。重複項目保留 10 分鐘不顯示。提供「專注／簡報中」模式，螢幕分享期間不浮現任何內容（可透過 ScreenCaptureKit 或 app 狀態偵測）。
- **兩種顯示層級：** 一個安靜填入低 salience 清單的環境式托盤（ambient tray），以及僅在超過門檻時才升級（細微醒目提示，絕不發出聲音）。從釘選、關閉與展開事件學習每位使用者的門檻。

**佐證研究：**
- Microsoft Research CHI 2025〈Are We On Track?〉：*被動式* AI 會議回饋能維持專注而不造成干擾，而*主動式*介入雖能引發反思，但「有打斷對話流程的風險」[src](https://arxiv.org/pdf/2504.01082)。MSR 專案頁面提及一項 CHI 2026 關於會議目標提示（nudges）的大規模預先註冊實地實驗 [src](https://www.microsoft.com/en-us/research/project/intentional-meetings/)。
- CHI 2025〈Assistance or Disruption?〉（Codellaborator）：主動式代理提升了效率，但也帶來工作流程的干擾。存在指示（presence indicators）與 context 支援可減輕干擾 [src](https://arxiv.org/abs/2502.18658)。
- CHI 2025〈Proactive Conversational Agents with Inner Thoughts〉：一條隱性、持續的「思考」流，用來決定在多方對話中何時發言，在換手適切性上勝過基準方法 [src](https://arxiv.org/abs/2501.00383)。這可直接對應到 Tier-1/Tier-2 設計。
- CHI 2026 延伸摘要，探討實體小組中的主動資訊支援（與第 2 階段裝置相關）[src](https://arxiv.org/abs/2601.17240)。
- Horvitz 等人〈Learning and Reasoning about Interruption〉（MSR）：經典的打斷期望成本框架 [src](https://www.microsoft.com/en-us/research/publication/learning-and-reasoning-about-interruption/)。
- ProactiveBench（Lu et al. 2024）：6,790 個事件；微調後的模型在判斷*何時*協助上達到 66.47% F1 [src](https://arxiv.org/abs/2410.12361)。已有較新的主動式代理 benchmark（UniClawBench、ProEvent）[src](https://arxiv.org/abs/2607.08768)。

### 4.5 共指消解，例如「上次那個方案」

1. **時間錨點：** 利用行事曆 metadata 解析「上次」，也就是同一系列中的前一場會議，或與會者重疊最多的會議。退而求其次則取最近 14 天。
2. **類型錨點：** 將「方案」對應到實體類型 {proposal, option, quote, plan}。
3. **候選檢索：** 從錨定會議的決策與議題中取出這些實體（具有效期時間的知識圖譜邊），再加上 hybrid search。
4. **LLM 排序**，搭配目前語句的 context。
5. **只有在第 1 名的領先差距高於門檻時才顯示。** 否則在托盤中顯示一個低調的「您是指 A／B？」小標籤（chip）。

這需要一個**含別名的實體登錄表**（中英文名稱、縮寫、ASR 誤拼）。Graphiti 式的時間性邊正是在這個登錄表上發揮價值。

---

## 5. 檢索層

**Embedding（中文 + 英文）：**

| 模型 | 價格 | 備註 |
|---|---|---|
| Qwen3-Embedding-8B / 4B / 0.6B | 開放權重 | 8B 曾在 MMTEB 多語排行榜排名第 1（70.58，2025 年 6 月）；C-MTEB 表現強 [src](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models) |
| BGE-M3 | 開放 | 單一模型同時提供 dense + sparse + multi-vector；MTEB 快照約 63.2 [src](https://www.morphllm.com/ollama-embedding-models) |
| OpenAI text-embedding-3-small / large | 每 M $0.02 / $0.13 [src](https://developers.openai.com/api/docs/pricing) | — |
| Voyage-4 / 4-lite / 4-large | 每 M $0.06 / $0.02 / $0.12，前 200M tokens 免費 [src](https://docs.voyageai.com/docs/pricing) | — |
| Cohere Embed v4 | 文字每 M $0.12 [src](https://embeddingcost.com/cohere) | — |
| Gemini Embedding 2 | 每 M $0.20 [src](https://ai.google.dev/gemini-api/docs/pricing) | — |

**建議：** 本地端（Mac／邊緣）使用 Qwen3-Embedding-0.6B，雲端使用 Voyage-4 或 Qwen3-Embedding-4B。先用自己的文件跑一個小型 C-MTEB 式評測。

**Reranker：**
- Voyage rerank-2.5：每 M tokens $0.05 [src](https://docs.voyageai.com/docs/pricing)。
- Cohere Rerank 4 Pro / Fast：每 1k 次搜尋 $2.50 / $2.00 [src](https://openrouter.ai/cohere/rerank-4-pro/pricing)。
- Qwen3-Reranker（開放）可自架 [src](https://arxiv.org/pdf/2506.05176)。

**Hybrid search 與中文斷詞陷阱：**
- 中文沒有空格，因此詞彙式（lexical）搜尋需要斷詞。
- SQLite FTS5 的 `trigram` tokenizer 可處理 CJK，但比對至少需要 3 個字元，而許多關鍵中文詞只有 2 個字（例如「報價」）。可先用 jieba 預先斷詞，存入以空白連接的欄位，或以字元 bigram 建立索引。
- 同樣的技巧適用於任何託管的 Postgres：在應用程式端斷詞，再儲存 `to_tsvector('simple', …)`。如此可免去 zhparser/pg_jieba 擴充套件。
- 以 RRF 融合詞彙式與向量結果 [src](https://alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html)。

**向量儲存：**
- **雲端：** Postgres + pgvector（單一資料庫處理應用程式資料、權限與 ACL 過濾）。只有在超過約 10M+ 個 chunk，或大量過濾影響效能時，才改用 Qdrant。
- **本地：** sqlite-vec + FTS5（佔用極小，單一檔案）或 LanceDB（欄式儲存，較適合大型語料）[src](https://www.firecrawl.dev/blog/best-vector-databases)。

**知識圖譜：**
- Zep/Graphiti 是時間性 KG，每條邊都有有效區間（有效直到被取代為止），適合「決策 X 被 Y 取代」這類情境。其回報檢索 P95 為 300 ms，DMR benchmark 為 94.8% [src](https://arxiv.org/abs/2501.13956)。Graphiti 為開源；Zep 的代管方案約每月 $25 起 [src](https://vectorize.io/articles/mem0-vs-zep)。
- **建議：** 先在 Postgres 中建立含 `valid_from` / `valid_to` 欄位的關聯式實體／決策／待辦事項表（「KG-lite」）。只有在多跳（multi-hop）查詢被證實有需求時才導入 Graphiti。

**Connector（第 3 階段）：**
- **Google Drive：** 以 Drive API `changes.list` 做增量同步（標準做法；無另計費用）。
- **M365：**
  - OneDrive/SharePoint 使用 Graph delta 查詢。
  - **Copilot Retrieval API** 會從 SharePoint、OneDrive 與 Copilot connector 回傳已依權限裁切的文字摘錄 [src](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/retrieval/overview)。
  - 隨用隨付每次呼叫 $0.10，自 2026 年 1 月起為預覽版。僅涵蓋 SharePoint 與 connector，不含 OneDrive，且租用戶中需至少有一個 Copilot 授權 [src](https://office365itpros.com/2026/04/14/copilot-retrieval-api/)。
- **Notion：** 每個整合約每秒 3 次請求，另有工作區層級限制 [src](https://developers.notion.com/reference/request-limits)。代管的 Notion MCP 包含會議記錄查詢 [src](https://www.jitendrazaa.com/blog/integration/notion-mcp-server-complete-guide-setup-troubleshooting-ai/)。
- **以 MCP 作為整合路徑：**
  - 在卡片生成時，使用廠商代管的 MCP server（Notion 等）做*隨需*查詢。
  - 自行維護同步與索引，以支援*低 latency* 檢索。MCP 來回（數百 ms 到數秒，外加速率限制）對 3 s 預算而言太慢。
  - 將 ELIVO 本身公開為 MCP server，讓 Claude、ChatGPT 或 Copilot 使用者可以查詢自己的會議記憶。這是低成本的通路。

---

## 6. 單位經濟（每會議小時）

**假設**（我自訂的；實測後再調整）：
- 逐字稿 ≈ 15k tokens/hr。
- 每 20 s 做一次 Tier-1 擷取：180 次呼叫 × 2k 輸入（一半可快取）+ 150 輸出，合計 360k 輸入／27k 輸出。
- 每小時約 30 次檢索，每次 rerank 20 個 × 300-token 候選（180k rerank tokens）。
- 12 次 Tier-2 卡片生成 × 6k 輸入／250 輸出，合計 72k 輸入／3k 輸出。
- 會後摘要：20k 輸入／2k 輸出。
- 基礎設施（WebSocket 伺服器、資料庫、儲存）：$0.02–0.05/hr（估計）。

**各元件成本：**

| 元件 | 選項 | $/會議小時 |
|---|---|---|
| **ASR** | Soniox RT（含 diarization） | 0.12 |
| | Deepgram Nova-3 zh-TW + diarization（促銷價／牌價） | 0.41 / 0.58 |
| | ElevenLabs Scribe v2 RT | 0.39 |
| | Speechmatics RT Enhanced | 0.43 |
| | AssemblyAI U3.6 Pro + diarization | 0.57 |
| | OpenAI realtime transcribe | 1.02 |
| | Google Chirp 3 / AWS / Azure（+diarization +LID） | 0.96 / 1.44 / 1.60 |
| **Tier-1 擷取** | GPT-5-nano | 0.03 |
| | Gemini 3.1 Flash-Lite | 0.13 |
| | GPT-5-mini | 0.14 |
| | Haiku 4.5（含快取） | ~0.33 |
| **Tier-2 卡片** | Gemini Flash（2026 促銷價） | 0.07 |
| | Haiku 4.5 | 0.09 |
| | Sonnet 5.5 | 0.17 |
| **摘要** | Sonnet 5.5 | 0.06 |
| **Embedding** | 任一 API | <0.01 |
| **Rerank** | Voyage 2.5 / Cohere 4 Pro | 0.01 / 0.075 |
| **Bot 擷取（選用）** | Recall.ai | +0.50 |

**Pipeline 總計：**

| Pipeline | 組成 | $/會議小時 | 每月 30 會議小時的 $/使用者/月 |
|---|---|---|---|
| **A. 精簡雲端** | Soniox + GPT-5-nano + Haiku 卡片 + Sonnet 摘要 + Voyage rerank + 基礎設施 | **≈ $0.34** | ≈ $10 |
| **B. 高品質雲端** | Speechmatics 或 Scribe（~0.40）+ Haiku Tier-1 + Sonnet 卡片／摘要 + Cohere rerank + 基礎設施 | **≈ $1.05–1.10**（改用 Soniox 則 ≈ $0.80） | ≈ $24–33 |
| **C. Hyperscaler** | Azure（含 diarization + LID）+ GPT-5-mini + Sonnet + Cohere | **≈ $2.10** | ≈ $63 |
| **D. 混合本地** | 裝置端 ASR（透過 WhisperKit 的 Breeze，或 SpeechAnalyzer）+ 本地 MLX 擷取器 + 雲端 Haiku 卡片 + Sonnet 摘要 | **≈ $0.18**（若使用 Argmax 另加授權費，待驗證） | ≈ $5 |

備註：
- Pipeline D 將成本轉移到使用者的電池與散熱上。需要 16GB 以上的 Apple Silicon，才能舒適地同時執行 ASR 與 4B LLM（估計）。
- Gemini Flash 價格將於 2027 年 1 月 1 日加倍，因此不要依促銷價鎖定模型。
- Deepgram 的費率為促銷價。

---

## 7. 第 2 階段硬體可行性

**平台選項：**

| 平台 | 運算 | 價格訊號 | 結論 |
|---|---|---|---|
| **ESP32-S3 精簡用戶端** + XVF3800 + 3.5–7" LCD | 僅 Wi-Fi streaming；所有推論在 Mac 或雲端執行 | Seeed 販售 XVF3800 + XIAO ESP32S3 組合 [src](https://www.seeedstudio.com/ReSpeaker-XVF3800-4-Mic-Array-With-XIAO-ESP32S3-p-6489.html)。估計 BOM 約 $40–80（待驗證）。 | **最佳首款裝置。** 便宜；使用預先認證的無線模組可降低 FCC 成本。 |
| **Raspberry Pi 5 / CM5** | 4× A76，無 NPU | 2026 年受記憶體帶動漲價：2026 年 2 月 8GB +$30、16GB +$60 [src](https://www.raspberrypi.com/news/more-memory-driven-price-rises/)；Pi 5 16GB 現為 $205 [src](https://www.tomshardware.com/raspberry-pi/raspberry-pi-5-price-increases-drastically-as-ai-shortage-bites-16gb-version-now-usd205-second-price-increase-in-three-months-over-70-percent-more-expensive-than-original-msrp) | 適合原型開發；本地 ASR/LLM 能力弱 |
| **Rockchip RK3588** | 8 核心，**6 TOPS NPU**；4B LLM 約 5–8 tok/s [src](https://turingpi.com/run-llm-locally-arm-rk3588-ollama-llama-cpp/) | Orange Pi 5 Max 零售約 $160 [src](https://tinycomputers.io/posts/rk3588-orange-pi-5-max-review.html) | 可在本地執行 SenseVoice/Paraformer + 小型 LLM；台灣／深圳 ODM 生態系強大 |
| **Jetson Orin Nano Super** | 67 TOPS | NVIDIA 於 2026 年 7 月調漲最多 101% 後，**現價 $399** [src](https://www.cnx-software.com/2026/07/22/nvidia-increases-the-price-of-jetson-modules-and-devkits-by-up-to-101/) | 對消費級 BOM 而言太貴 |
| **Android 面板**（RK3566/3568 等級，8–10"） | 執行 Android app | ODM 價約 $60–150（待驗證） | 最快上市的路徑；ODM 通常已具備現成認證 |

**麥克風陣列：**
- reSpeaker XVF3800：4 麥克風環形陣列，具 AEC、波束成形（beamforming）、DoA、AGC、去殘響，收音距離最遠 5 m，USB 或 I2S。**$54.90**（10 件以上 $49.90）[src](https://www.seeedstudio.com/ReSpeaker-XVF3800-USB-Mic-Array-p-6488.html)。
- 量產時直接採用 XVF3800 晶片設計。

**顯示器：**
- **電子紙（E-ink）** 符合「一瞥即懂、低打擾」的品牌承諾：不發光、低功耗、陽光下可讀。刷新慢、全頁刷新會閃爍，且色彩有限（定性描述）。
- **E Ink 元太科技是台灣公司**，屬於在地供應鏈優勢。
- **IPS LCD 7–10"** 適合動畫與較高資訊密度。
- 合理的選擇是「ambient」SKU 採用 7.5" 彩色電子紙，「pro」SKU 採用 LCD。

**粗估 BOM**（估計，待驗證；2026 年 DRAM 漲價影響重大）：
- 精簡用戶端：$45–90。
- RK3588 本地推論裝置：$150–250。
- 零售價約為 BOM 的 2.5–4 倍。

**認證：**
- **FCC：** 使用預先認證模組（僅 Part 15B）約 $3k–8k、2–6 週；自製無線電路則約 $18k–58k、8–16 週 [src](https://markready.io/learn/fcc-certification-cost)。
- **NCC（台灣）：** 數萬至 NT$100k 以上，約 5–6 週。BSMI 涵蓋安規／EMC [src](https://www.blueasialabs.com/shouyehuandeng/2025-taiwan-ncc-product-certification-cost-a-complete-breakdown), [src](https://ib-lenhardt.com/type-approval/taiwan)。
- **CE RED：** 與 FCC 同一量級（待驗證）。
- 鋰電池會額外需要 UN38.3 與 IEC 62368 測試。v1 避免內建電池，改用 USB-C 供電。

**台灣優勢：**
- 在地 ODM、E Ink，以及 MediaTek/Realtek 晶片。
- 新竹—深圳之間快速的原型迭代循環。
- 在地 NCC 測試實驗室。
- Breeze 模型出自 MediaTek Research，有潛在合作機會。

**其他裝置的教訓：**
- **Humane** 於 2025 年 2 月停止營運；HP 以 $116M 收購其資產 [src](https://www.axios.com/2025/02/18/humane-ai-pin-shut-down-hp)。獨立「取代手機」的品類失敗了。
- **Rabbit** 憑藉一個無法兌現的展示賣出約 10 萬台 [src](https://www.digitalapplied.com/blog/ai-product-failures-2026-sora-humane-rabbit-lessons)。
- **Plaud** 已出貨 **2M+ 台裝置，軟體業務 ARR 超過 $100M**（2026 年 6 月）[src](https://techcrunch.com/2026/06/16/plaud-says-its-software-business-topped-100m-in-arr-after-shipping-over-2m-ai-notetakers/)。它只做一件事（擷取）、與手機配對，並透過訂閱變現。
- **結論：** 讓第 2 階段裝置成為第 1 階段軟體的配件（供實體會議使用的麥克風 + 環境式顯示器），而不是獨立的 AI。

---

## 8. 建議的第 1 階段技術堆疊（1–3 人）

**桌面端：**
- **Tauri 2 + React/TypeScript UI**，搭配一個小型 **Swift helper**，可以是 sidecar 執行檔，或透過 `swift-rs` 的 Swift plugin [src](https://v2.tauri.app/develop/plugins/)。
- Swift helper 負責 Core Audio taps、含 AEC 的麥克風、SpeechAnalyzer/WhisperKit，以及 MLX。
- 理由：
  - 擷取與本地 ML 程式碼無論如何都必須用 Swift 寫。
  - React UI 可與 web app 及未來的 Windows 版共用。
  - Tauri 安裝包約 3–10 MB，Electron 則為 120–200 MB，且閒置 RAM 低得多 [src](https://www.pkgpulse.com/guides/electron-vs-tauri-2026)。
- 替代方案：
  - **Electron** 同樣可行，據報 Granola 就是使用它（待驗證）。如果團隊只會 JS 且希望 Chromium 行為一致，就選它。
  - **純 SwiftUI** 能提供最佳的 macOS 手感，但 UI 會與 web 分岔。

**即時後端：**
- **Python 3.12 + FastAPI/asyncio WebSockets**，因為 AI 與 NLP 生態系都在這裡：jieba、OpenCC、pyannote、評測工具、廠商 SDK。
- 每場進行中的會議各有一個「session worker」，將音訊分送給 ASR 廠商、執行 Tier-1/Tier-2，並推送卡片。
- 水平擴展時，在各階段之間加入 Redis Streams 或 NATS。

**資料：**
- Postgres（Neon/Supabase/Cloud SQL）+ pgvector + 應用程式端 jieba tokens 供詞彙式搜尋。
- 只有在使用者選擇保留音訊時才使用物件儲存（預設：不儲存，與 Granola 相同）。
- 本地端：SQLite + sqlite-vec + FTS5。

**基礎設施與區域：**
- 使用 GCP `asia-east1`（台灣彰化），以符合台灣企業對資料落地的期待。AWS 台北區域的狀態待驗證，請確認。
- 在廠商抽象層之後運作。ASR 與 LLM 必須保持可替換，因為價格每月都在變：Deepgram 的促銷、Gemini 2027 年 1 月的加倍、Speechmatics 7 月的調降。

**開發順序：**
1. Mac 擷取 helper + Soniox streaming + OpenCC + 即時逐字稿（第 1–3 週）。
2. 內部 zh-TW code-switch 評測框架（平行進行）。
3. Tier-1 擷取器 + 實體登錄表 + 環境式托盤（第 4–6 週）。
4. 對過往會議的 hybrid 檢索 + 經門檻把關的 Tier-2 卡片（第 7–10 週）。
5. Drive/Notion 資料匯入，接著做 ELIVO MCP server。

**法規遵循：**
- 台灣《個人資料保護法》（PDPA）與美國雙方同意（two-party-consent）州：加入清楚的錄音指示，以及可選的自動通知訊息給與會者。
- 與 ASR 及 LLM 廠商簽訂零保留（zero-retention）協議，台灣的企業買家一定會問到這點。

---

**應優先釐清的待驗證項目：**
1. Soniox、Scribe v2 RT 與 Speechmatics `cmn_en` 在台灣語音上的繁體輸出與 code-switch 品質。
2. AssemblyAI streaming 中文支援的範圍。
3. Zoom RTMS 每分鐘價格。
4. Argmax Pro 授權費用。
5. 來自台灣 ODM 的 Android 面板與精簡用戶端 BOM 報價。
