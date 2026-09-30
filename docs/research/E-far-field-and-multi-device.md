# 研究：大會議室遠場收音、專有名詞辨識與多手機分散式收音

調查日期：2026-09-30。標記說明：**【已查證】**表示有附來源，**【推論】**是依據來源做的工程判斷，**【未驗證】**表示需要在 spike 中實測。

---

## 0. 結論摘要

1. **收音距離的影響大於模型和演算法。** Microsoft 用 7 台消費級手機與筆電做的會議轉錄實驗中，近講麥克風（IHM）的 WER 是 14.4%，單一遠場裝置是 27.0%，7 台裝置融合後是 22.3%【已查證】（[Yoshioka et al. 2019](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/06/meeting_transcription_using_asynchronous_distant_microphones.pdf)）。因此「讓麥克風靠近說話的人」是最值得先做的一件事。做法有兩種：擺一台會議揚聲麥克風，或讓每個人用自己的手機收音。
2. **不要在 Whisper 前面預設開啟降噪。** 多篇 2025–2026 年的研究指出，現代 ASR 前加語音增強會讓錯誤率變高【已查證】。
3. **專有名詞的處理要分三層**：動態挑選 glossary 放進 prompt、用拼音做模糊比對後交給 LLM 校正、會後用整段音檔重新轉錄。其中拼音比對加 LLM 校正的效益最高，而且不用改 ASR【推論】。
4. **模型方面值得正式 A/B 測試 Qwen3-ASR-1.7B**（2026-01 發布，Apache-2.0）。它的技術報告在 CV-zh-TW 與會議語料上的成績明顯好於 Whisper-large-v3，也支援用 context 做偏置，Apple Silicon 上有 MLX 移植版【已查證，但沒有 zh/en 夾雜的評測】。
5. **多手機收音可行，但阻擋點在 iPhone 瀏覽器的 HTTPS 限制**：目前的 `http://192.168.x.x` 頁面**無法**呼叫 `getUserMedia`【已查證】。訊號層 beamforming 在瀏覽器環境下不實際。建議的做法是「每段話挑最近的手機」加上 hypothesis 選擇或合併。
6. **建議先做離線 spike**：用 iPhone 內建「語音備忘錄」同步錄音，事後對齊並計算 CER，先量出增益的上限，再決定要不要投入即時 Web 收音的工程。

---

## A. 單台 Mac 的遠場收音與專有名詞品質

### A 排序表（品質增益 / 工時 / 成本）

| # | 做法 | 預期增益 | 工時（1 人） | 成本 | 信心 |
|---|---|---|---|---|---|
| 1 | 會議揚聲麥克風放桌子中央 | 高（縮短收音距離） | 1–2 天 | US$145–369 | 高（方向）/ 幅度未驗證 |
| 2 | glossary 拼音模糊比對 + LLM 校正 | 對名詞召回率高 | 3–5 天 | LLM token 費 | 中高 |
| 3 | 換模型或加測 Qwen3-ASR | 可能中到高 | 2–3 天（benchmark） | 0 | 中 |
| 4 | 動態挑選 glossary 放進 prompt | 中 | 2–3 天 | 0 | 中 |
| 5 | 會後兩段式重轉錄 | 單靠解碼參數效果小；搭配換模型或多來源才明顯 | 3–5 天 | 0 | 中 |
| 6 | whisper.cpp logits 偏置（trie boosting） | 中，但有誤觸風險 | 1–2 週 | 0 | 低中 |
| 7 | 降噪 / 去混響前處理 | **可能是負的** | 1–2 天（只驗證） | 0 | 中 |

### A1. 前處理（降噪、去混響、AGC）

- 一篇系統性研究在 Whisper、Parakeet、Gemini Flash 2.0 等四個 ASR 前加 MetricGAN+ 降噪，**九種噪音條件全部變差**，semWER 增加 1.1–46.6 個百分點（[arXiv 2512.17562](https://arxiv.org/abs/2512.17562)）。另一篇用 SAM-Audio 分離音源再送 Whisper，結果同樣變差（[arXiv 2603.04710](https://arxiv.org/html/2603.04710v2)）【已查證】。原因是增強演算法會產生 artifact，讓音訊偏離 ASR 的訓練分布。
- WPE 去混響的結果不一致，有論文顯示在遠場語料上反而變差（49.54%→56.12%）（[LOTUSDIS, arXiv 2509.18722](https://arxiv.org/pdf/2509.18722)）【已查證】。目前找不到「WPE 搭配 Whisper」的正面證據。
- Apple Voice Processing I/O（`setVoiceProcessingEnabled`）是為通話做的，主要功能是 AEC，會改變增益（[WWDC23](https://developer.apple.com/videos/play/wwdc2023/10235/)）。沒有證據顯示它對 Whisper 有幫助【未驗證】。
- **建議**：送進 ASR 的一律是原始訊號，只做音量正規化。降噪後的訊號只拿來驅動 VAD 或估計 SNR，不送進 ASR【推論】。spike 中保留一組「開降噪 vs. 不開」的對照。

### A2. 上下文偏置（contextual biasing）

- **initial prompt 的限制**：Whisper 解碼器共有 448 個 token 位置，prompt 最多 224 個，超過時**只保留最後 224 個**，前面的會被默默丟掉（[openai/whisper #1386](https://github.com/openai/whisper/discussions/1386)）【已查證】。一個中文字大約佔 1–3 個 token（byte-level BPE），所以實際能放的大約是 80–150 個中文字【推論，建議用 whisper.cpp tokenizer 實測】。whisper.cpp 有 `carry_initial_prompt` 參數，可以讓每個解碼視窗都帶上 prompt（[whisper.h](https://github.com/ggml-org/whisper.cpp/blob/master/include/whisper.h)）【已查證】。
- **prompt 的風險**：initial prompt 可能讓 Whisper 輸出錄音裡沒有的詞（[arXiv 2503.06924](https://arxiv.org/pdf/2503.06924)）【已查證】。靜音段更容易發生，目前的 Silero VAD 可以擋掉一部分。
- **建議做法「動態 prompt」**：每個 Space 的 glossary 可能有幾百個詞，但每個視窗只放 20–40 個最相關的。挑選依據是議程、行事曆上的與會者、最近 2 分鐘逐字稿裡出現的詞。prompt 用自然的繁中句子寫（例如「今天與會：王小明、ACME 的 Jenny；討論 Nebula 平台…」），不要寫成純詞表【推論】。
- **解碼層偏置**：whisper.cpp 提供 `logits_filter_callback`（[whisper.h](https://github.com/ggml-org/whisper.cpp/blob/master/include/whisper.h)）【已查證】，可以實作不需訓練的 trie keyword boosting。做法可參考「每個 token 給固定 reward」的 trie biasing（[arXiv 2508.17796](https://arxiv.org/html/2508.17796)）與 CB-Whisper（[LREC-COLING 2024](https://aclanthology.org/2024.lrec-main.262/)）。問題是 whisper-server 要自己 patch，而且詞表一大就容易誤觸，放到後面再做。TCPGen 需要訓練（[arXiv 2306.01942](https://arxiv.org/abs/2306.01942)），不適合 Phase 0。
- **ASR 後校正（建議優先做）**：
  1. 把逐字稿和 glossary 都轉成**無聲調拼音**，用滑動視窗計算編輯距離，找出候選替換。
  2. 加入台灣口音的**模糊音規則**：zh/z、ch/c、sh/s、eng/en、ing/in、n/l【推論，屬於常見的台灣口音合流現象】。
  3. 英文詞用字母或音素相似度比對。
  4. 把「原句、候選詞、拼音」一起交給 Haiku，讓它判斷要不要替換。
  文獻支持這條路：把拼音交給 LLM 的 PY-GEC（[arXiv 2409.13262](https://arxiv.org/html/2409.13262v1)）、用拼音篩選偏置詞後 AISHELL-1 的 CER 降低 25%（[Interspeech 2025 PYG-ASR](https://www.isca-archive.org/interspeech_2025/zhengjie25_interspeech.html)）、Apple 的 RAG 實體校正（[Apple ML Research](https://machinelearning.apple.com/research/retrieval-asr)）【已查證】。這個方法和現有「讀音明顯相近才改」的規則一致，而且產生的是可以稽核的替換紀錄。
- **自動建立 glossary**：從 Space 裡的舊會議記錄與文件，用 LLM 抽出人名、公司、產品名和縮寫，再依出現頻率和最近使用時間排序。這些只是**候選**，要使用者確認後才寫入。會中如果手動修正了某個詞，也回寫成候選。資料只留在該 Space，不拿去訓練模型（ADR-0003）。

### A3. 兩段式：即時草稿，會後重新轉錄

- **單改解碼參數的增益有限**：Whisper-Streaming 用 LocalAgreement 串流時，WER 只比離線多 0.2–0.6 點（[arXiv 2307.14743](https://arxiv.org/abs/2307.14743)）。sequential 長音檔解碼比 chunked 最多準約 0.5%（[whisper-large-v3 model card](https://huggingface.co/openai/whisper-large-v3)）【已查證】。所以用同一個模型、只把 beam 加大重跑，只能拿到小幅改善。
- **真正的效益來自三個地方**：
  1. 用完整上下文重新挑選 glossary 並做 LLM 校正。
  2. 換成更強的離線模型，例如 Qwen3-ASR-1.7B。它的串流模式比離線差，例如 LibriSpeech 上是 1.95–4.51 對 1.63–3.38（[Qwen3-ASR 技術報告](https://arxiv.org/html/2601.21337v1)）。
  3. 多來源的 hypothesis 合併（見 B）。
- **會議記錄重新對齊**：以 segment 的時間戳為錨點。第二次轉錄後，用字元層級的 diff 標出變動，只重算有變動段落對應的會議記錄項目。使用者手動改過的內容要保留，不能被覆蓋。

### A4. 模型與服務（2025–2026）

| 模型 / 服務 | 日期 | zh-TW / 中英夾雜 | 自訂詞彙 | 本地 Apple Silicon | 備註 |
|---|---|---|---|---|---|
| Breeze-ASR-25（現用） | 2025 | CV16-zh-TW CER 7.97；CSZS-zh-en 13.01 | 只有 prompt | ✅ whisper.cpp | [HF](https://huggingface.co/MediaTek-Research/Breeze-ASR-25) |
| Breeze-ASR-26 | 2026-02 | **台語**模型，不是 25 的後繼版本 | — | ✅ | [HF](https://huggingface.co/MediaTek-Research/Breeze-ASR-26) |
| **Qwen3-ASR 0.6B / 1.7B** | 2026-01 | CV-zh-tw CER 3.77（Whisper-large-v3 為 7.84）；WenetSpeech test_meeting 4.97–5.88（v3 為 9.86–19.11）；**沒有中英夾雜評測** | system prompt 可放 context | ✅ 社群 MLX 移植（[例](https://github.com/moona3k/mlx-qwen3-asr/)） | Apache-2.0，[報告](https://arxiv.org/html/2601.21337v1) |
| Fun-ASR-Nano-2512 | 2025-12 | 中、英、日、方言口音 | prompt 可放 hotword | 有社群 CoreML / llama.cpp 版本 | [HF](https://huggingface.co/FunAudioLLM/Fun-ASR-Nano-2512) |
| Qwen-Audio-3.0-ASR | 2026-09 報告 | 30 種語言 + 16 種中文方言 | 分層 hotword | **權重是否開放未查證** | [arXiv 2609.07549](https://arxiv.org/abs/2609.07549) |
| NVIDIA Canary-1B-v2 / Parakeet-v3 | 2025 | **只支援 25 種歐洲語言**，排除 | — | — | [arXiv 2509.14128](https://arxiv.org/abs/2509.14128) |
| Google Chirp 3 | — | cmn-Hant-TW（**Preview**） | 最多 1,000 個 phrase | 雲端 | [文件](https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3) |
| Deepgram Nova-3 | — | 支援 zh-TW；多語 code-switching 清單**沒有中文** | keyterm 最多 500 token（中文效果未查證） | 雲端 | [文件](https://developers.deepgram.com/docs/models-languages-overview) |
| ElevenLabs Scribe v2 | — | 99 種語言 | 批次 1,000 個 / 即時 50 個 keyterm | 雲端，即時 US$0.39/小時 | [文件](https://elevenlabs.io/docs/overview/capabilities/speech-to-text) |
| OpenAI gpt-transcribe | 2026-07 | 可給多個語言提示、支援 code-switching | keyword hints | 雲端，US$0.0045/分鐘 | [文件](https://developers.openai.com/api/docs/models/gpt-transcribe) |

注意：Qwen3-ASR 和 Breeze 用的 Common Voice 版本不同，**數字不能直接比較**。必須用我們自己的中英夾雜測試集比過才算數。雲端服務一律放在 ADR-0002 的抽象層後面，可以作為「會後第二段轉錄」的選項，但要另外取得同意並說明資料去向。

### A5. 硬體

| 裝置 | 價格（約） | 適用 | 來源 |
|---|---|---|---|
| Anker PowerConf S3（6 支麥克風） | US$145 | 8 人以下 | [Amazon](https://www.amazon.com/Anker-PowerConf-Speakerphone-Conference-Compatible/dp/B0899S421T) |
| Jabra Speak2 75（4 支 beamforming 麥克風） | US$369 | 中型會議室 | [評測](https://alexreviewstech.com/jabra-speak2-75-review-serious-business-tool-serious-price/)、[Jabra](https://www.jabra.com/business/speakerphones/jabra-speak-series/jabra-speak2-75) |
| Yamaha YVC-1000（可串接最多 5 支麥克風） | 未查證，明顯更高 | 大會議室 | [Yamaha](https://usa.yamaha.com/products/unified_communications/speakerphones/yvc-1000/index.html) |

這類揚聲麥克風本身會做 AEC、降噪和 AGC，而且通常關不掉。這和 A1 的建議有衝突，所以效果要實測【未驗證】。原本問題中提到的 Shure MV5C 是單人桌上型麥克風，不適合整間會議室。**判斷**：中小型會議室買一台揚聲麥克風最划算。大會議室裡一台放中央仍然離多數人很遠，多支串接或多手機才能真正縮短距離【推論】。

---

## B. 多手機分散式收音

### B1. 既有研究與產品

- **Microsoft Project Denmark**（[Yoshioka et al., Interspeech 2019](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/06/meeting_transcription_using_asynchronous_distant_microphones.pdf)、[MSR blog](https://www.microsoft.com/en-us/research/blog/bring-your-phones-to-the-conference-table-creating-ad-hoc-microphone-arrays-from-personal-devices/)）【已查證】：
  - 設備：7 台不同型號的消費級裝置（4 台 iOS、3 台 Android），錄的是真實、非腳本的會議。
  - 音訊對齊：以一路為參考，每 30 秒做一次 cross-correlation 算出延遲，再用重取樣補償漂移。
  - WER 隨裝置數下降：1 台 27.0、3 台 24.0、5 台 22.7、7 台 22.3（相對改善約 17%）。
  - 融合方式：beamforming 加 CNC 最好；只用 ROVER、不做 beamforming 也有 25.3。
  - 非重疊語音：單一遠場 20.6、beamforming 18.1、beamforming + CNC 16.2、近講 13.2。
  - **注意**：他們假設所有與會者**事先註冊了聲紋**，這一點 ELIVO 不能照做（ADR-0003）。這項研究最後沒有直接做成產品。
- **CHiME-7/8 DASR** 在研究「不限定陣列形狀、可用異質裝置」的遠場轉錄。頂尖系統都依賴 GSS 和 target-speaker diarization。另外有一個值得注意的發現：**LLM 產生的摘要品質和 WER 的相關性很弱**（[arXiv 2507.18161](https://arxiv.org/abs/2507.18161)、[CHiME-8](https://arxiv.org/abs/2407.16447)）【已查證】。意思是會議記錄本身對辨識錯誤有一定容忍度，但名詞和數字仍然需要專門處理。
- **PickNet** 每個 frame 挑出離說話者最近的裝置，勝過 block-online beamforming（[arXiv 2201.09586](https://arxiv.org/abs/2201.09586)）。**LibriWASN** 是非同步裝置的公開資料集，可以拿來開發（[arXiv 2308.10682](https://arxiv.org/pdf/2308.10682)）。
- **產品面**：沒有找到主流產品做「多支與會者手機融合收音」。Otter 這類產品是單一裝置錄音【未完全驗證】。
- **ELIVO 情境的差異**：手機放在每個人面前 0.3–1 m，比 Denmark 實驗中隨機擺放的裝置更接近近講。因此**挑最近麥克風**帶來的增益可能比論文更大【推論，需實測】。

### B2. 非同步裝置的實務流程

1. **傳輸**：每支手機把 16 kHz mono Int16 PCM 切成 20–100 ms 的小段上傳，附上序號和本機時間戳。每支約 256 kbps，10 支約 2.6 Mbps，Wi-Fi 很輕鬆。Phase 0 不需要 Opus【推論】。
2. **粗同步**：用 NTP 式 ping 估計各手機的時鐘偏移，精度大約數十 ms。
3. **細同步**：在有語音的片段，用 GCC-PHAT 和參考通道（Mac 麥克風或目前最強的一支）比對。手機與音訊裝置的取樣率偏差文獻報告的範圍是 −40 到 416 ppm，超過 ±100 ppm 的少見（[LibriWASN, arXiv 2308.10682](https://arxiv.org/pdf/2308.10682)）【已查證】。100 ppm 大約是每小時漂移 360 ms【推論】，對逐段選通道來說，每 10–30 秒重新估一次延遲就足夠了。
4. **不做訊號層 beamforming**：beamforming 需要小於一個取樣點的對齊精度和穩定的增益。瀏覽器的重取樣、各手機的 AGC、網路掉包都會破壞這些條件【推論】。改做**逐段選通道**。
5. **切段與選通道**：先在所有通道上做聯合 VAD，得到 utterance。每一段計算各通道的 SNR、對齊後的能量比，選出最佳通道再送 ASR。這樣 ASR 的運算量維持大約 1 倍，不會變成 N 倍。能量接近時才讓前 2 名都跑 ASR，用平均 logprob 挑一個。ROVER 要至少 3 個 hypothesis 投票才有意義，只有 2 個時用信心分數挑選即可。中文的 ROVER 要在字元層級做。
6. **去重**：每段只輸出一個 hypothesis，重複的問題自然就消失了。重疊語音（兩支不同手機各自是能量最高的）先標成「重疊」，之後再處理。
7. **「最近的手機」當作說話者線索**：每段話會被標成「靠近 Max 的手機」這類標籤。標籤只在該場會議內有效、會後丟棄，不產生也不保存 speaker embedding，**不算聲紋**，符合 ADR-0003【推論】。但要說清楚三個限制：旁邊的人說話也可能被判給同一支手機、多人共用一支手機、有人移動座位。所以 UI 用「靠近 X」這種說法，而且可以手動改。

### B3. iPhone 瀏覽器收音

- **HTTPS 是必要條件**：`getUserMedia` 只能在 secure context 使用，在不安全的頁面上 `navigator.mediaDevices` 是 `undefined`（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)）【已查證】。現在的 `http://192.168.x.x:8765` **可以看、不能收音**。

| 方案 | 來賓的操作負擔 | 隱私 | 主要問題 |
|---|---|---|---|
| 自簽憑證 | 要點過警告頁 | 資料留在區網 | iOS 上接受警告後 HTTPS 可以用，但 **wss 仍然失敗**，除非安裝描述檔並開啟完全信任（[說明](https://www.hotelexistence.ca/ios-safaris-websockets-implementation-doesnt-work-with-self-signed-certs/)、[gist](https://gist.github.com/apankrat/612dde3d7f01c4713c9579b0a94d9547)） |
| mkcert 本地 CA | 要安裝 root CA 並開啟完全信任 | 資料留在區網 | 不能要求來賓這樣做；**只適合團隊自己的測試機** |
| 公網網域 + 每台 Mac 各自的憑證（Plex / [tlsmy.net](https://github.com/supersat/tlsmy.net) 模式） | 零設定 | 資料留在區網 | 要自己維運 DNS 和 ACME DNS-01 簽發服務；部分路由器的 DNS rebinding 防護會擋掉解析到私有 IP 的網域【未驗證】 |
| Let's Encrypt IP 憑證 | — | — | 2026-01 已正式提供，效期 6 天（[LE](https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability)）。但驗證要從公網連入，**私有 IP 拿不到**【推論】 |
| 雲端中繼 / tunnel | 零設定 | **音訊會離開區網** | 違反「預設本地」的定位，只能做成需要使用者選擇開啟的選項 |
| **公網 HTTPS 頁面 + WebRTC 區網 P2P** | 零設定 | 媒體走區網、DTLS-SRTP 加密，只有 signaling 經過雲端 | Mac 端要有 WebRTC 堆疊（如 aiortc）；音訊會經過 Opus 編碼；HTTPS 頁面不能連 `ws://` 區網位址（mixed content）；可行性【未驗證】 |

- **背景執行與鎖定螢幕**：WebKit 工程師回應說，WKWebView 在 App 進入背景時會把麥克風靜音，除非 App 宣告了 `UIBackgroundModes: audio`（[WebKit bug 226620](https://bugs.webkit.org/show_bug.cgi?id=226620)）。2024 年有人回報加到主畫面的 Web App 進入背景後會失去麥克風【已查證】。Safari 本體在鎖定螢幕或切換分頁時會怎樣，**沒有明確文件，必須實測**。對策如下：
  - 用 Screen Wake Lock 防止螢幕休眠。Safari 從 16.4 開始支援，主畫面 Web App 從 18.4 開始支援（[WebKit 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)）。
  - 監聽 `track.onmute` 和 `visibilitychange`，一旦斷線就在 Mac 端顯示「X 的手機已暫停收音」。
  - 收音畫面用全黑背景，降低耗電。
  - 另外，有人回報 iOS 26.1 beta 的 Safari 音訊輸入壞掉（[Apple 論壇](https://developer.apple.com/forums/thread/802555)），說明這條路比較脆弱。
- **取樣率**：iOS 硬體通常是 48 kHz。在 AudioWorklet 裡先做 anti-alias 低通濾波，再降到 16 kHz 上傳。`echoCancellation`、`noiseSuppression`、`autoGainControl` 這三個 constraint 要做開與關的對照實驗（呼應 A1）【未驗證】。
- **耗電**：螢幕常亮、麥克風、Wi-Fi 同時開一小時的耗電量【未驗證，在 spike 中量測】。
- **原生 App 與 App Clip**：
  - 原生 App 用 AVAudioEngine，宣告 background audio 後鎖定螢幕也能繼續錄，時間戳也比較精確（hostTime）。缺點是來賓要先安裝。
  - App Clip 可以用 QR 碼免安裝啟動，iOS 17 以上的大小上限提高了（[來源為社群貼文](https://x.com/Baconbrix/status/1928719889067553123)），但背景能力受限，而且要經過 App Store 審核【細節未驗證】。
  - 建議：Phase 0 先用 Web 版給團隊內部測試機，產品化時再在「WebRTC 方案」和「原生 App / App Clip」之間做決定。
- **區網隔離風險**：很多企業或訪客 Wi-Fi 開了 client isolation，手機根本連不到 Mac。備案是 Mac 開 Wi-Fi 分享或改走雲端中繼【推論，屬於高機率阻擋點】。

### B4. 多人同時觀看

十支手機透過 WebSocket 廣播字幕，負載很小。重點在權限與同意：

- **每個人在自己的手機上按「加入並分享麥克風」**，系統記錄顯示名稱與時間，隨時可以停止。這比只在 Mac 上徵求同意更扎實，也符合「不做隱形」的原則。
- **角色要分開**：來賓只看得到即時字幕和本場會議記錄。ELIVO 連結到 Space 過去決策和文件的卡片，**不能出現在來賓的手機上**。
- pairing token 要設到期時間，會議結束就失效。

### B5. 法規（簡述，不構成法律意見）

- **台灣**：
  - 通保法 §29：通訊的一方自己錄音，或已取得一方同意，而且不是出於不法目的，就不罰（[全國法規資料庫](https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=K0060044&flno=29)）。
  - 錄音和逐字稿屬於個人資料，企業蒐集時要履行告知義務，並限於特定目的使用（[個資法](https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021)）。
- **美國**：加州等約 11–12 州要求**所有當事人同意**（[CA PC §632](https://codes.findlaw.com/ca/penal-code/pen-sect-632/)、[RCFP](https://www.rcfp.org/introduction-to-reporters-recording-guide/)）。伊利諾州對聲紋等生物特徵有額外規範，這也是不建立聲紋的另一個好處【推論】。
- 「每台手機各自同意」加上「會議開始時在 Mac 和所有手機上都顯示錄音中」，可以同時滿足兩地的要求。

---

## C. 分階段計畫

### 第一階段（1–2 週）：量出增益上限，暫不寫即時收音功能

- **測試集**：在大會議室錄一場約 20–30 分鐘、依腳本進行的中英夾雜會議。腳本刻意放 30–50 個 glossary 詞，包括人名、客戶名、產品名、縮寫和數字。
- **同步錄音來源**：
  1. Mac 內建麥克風（放在遠處）
  2. 桌子中央一台揚聲麥克風
  3. 2–3 支 iPhone 放在說話者前面，用內建「語音備忘錄」錄音
  4. 選配：一支領夾式麥克風當作近講上限
- 事後用 GCC-PHAT 對齊，**離線**跑下面這個實驗矩陣：

| 維度 | 選項 |
|---|---|
| 音源 | Mac 遠場 / 揚聲麥克風 / 自動選通道（多手機）/ oracle 最佳通道 / 近講 |
| 模型 | Breeze-ASR-25 / Qwen3-ASR-1.7B |
| 名詞處理 | 無 / 動態 prompt / + 拼音模糊 LLM 校正 |
| 前處理 | 原始 / DeepFilterNet |

- **評估指標**：
  - 中英夾雜錯誤率 MER：中文以字、英文以詞為單位計算
  - glossary 詞的召回率與精確率
  - 人名正確率
  - 會議記錄中被標註的錯誤數

### 第二階段（1.5–2 週）：即時多手機 spike，只增益確認後才做

- 用 mkcert 讓團隊自己的 2–3 支 iPhone 能收音（只限內部），走 AudioWorklet 降到 16 kHz 再用 WSS 上傳。
- 在 Mac 端實作：粗同步與細同步、逐段選通道、「靠近 X」的標籤。
- 測試項目：鎖定螢幕、切換 App、來電中斷、60 分鐘耗電、企業 Wi-Fi 的 client isolation。

### 第三階段：產品化決策，寫成 ADR

- 在「公網 HTTPS + WebRTC」和「原生 App / App Clip」之間選一個。
- 設計來賓的同意 UX 與角色權限。
- 決定雲端 ASR 是否開放作為會後第二段轉錄的選項。

### 成功門檻（建議值，需團隊確認）

- 多手機自動選通道的 MER，相對 Mac 遠場降低 **≥ 25%**。Denmark 用 7 台裝置約降 17%，但本情境手機更靠近說話者。
- glossary 詞召回率 **≥ 90%**，LLM 校正造成的誤改 **≤ 2%**。
- 重複或錯置的 utterance **≤ 2%**；即時確定延遲維持在約 3 秒內。
- iPhone 在螢幕常亮狀態下 60 分鐘不中斷，耗電有實測數字可以報告。

### 主要風險

1. iOS Safari 在背景或鎖定螢幕時的收音行為。
2. 企業 Wi-Fi 的區網隔離。
3. 來賓不願意裝東西或分享麥克風。
4. 手機主人不等於說話者，造成標籤錯誤。
5. 揚聲麥克風內建的處理可能反而讓辨識變差。
6. Qwen3-ASR 在中英夾雜上的表現還是未知數。
7. 本地同時跑兩個 ASR 模型時，Mac 的運算和記憶體壓力。

---

## D. ELIVO 實測（2026-09-30，合成語音）

工具：`services/realtime/eval/asr_compare.py`。測試稿 `spikes/asr-realtime/fixtures/meeting-names.txt`：17 句、110 秒，虛構的人名、公司名、產品名與英文縮寫共 25 處，術語表 18 個。
「遠場」版本：兩軌混成單聲道，−12 dB，加 5 階回音模擬混響，再混入粉紅噪音。兩個模型吃同樣的切段。

| 版本 | 設定 | MER | 術語正確 |
|---|---|---|---|
| 近距離 | Breeze-ASR-25＋術語提示（現行） | 0.073 | 21/25 |
| 近距離 | Qwen3-ASR-1.7B＋術語 context | 0.085 | 21/25 |
| 近距離 | Qwen3-ASR-1.7B，不給術語 | 0.142 | 10/25 |
| 遠場 | Breeze-ASR-25＋術語提示 | 0.199 | 15/25 |
| 遠場 | Breeze＋術語校正 | 0.193 | 16/25 |
| 遠場 | **Qwen3-ASR-1.7B＋術語 context** | **0.151** | 15/25 |
| 遠場 | Qwen3-ASR-1.7B，不給術語 | 0.193 | 8/25 |

- **術語表是最大的槓桿**：不給術語時，專有名詞辨識對的數量大約少一半。
- **遠場時 Qwen3-ASR 的錯誤率比 Breeze 低約 24%**，近距離時略差；給術語 context 時偶爾會把沒說的術語塞進句子（HubSpot → Bootstrap、Salesforce → Strapi）。
- **拼音術語校正（glossfix.py）效益小但安全**：遠場多 1 個術語正確；一般會議 60 句沒有任何誤判。遠場的錯多半是整段聽糊了（「承恩」→「成分」），不是同音字。
- 速度（M 系列 Mac）：Qwen3-ASR（PyTorch MPS）110 秒音訊約 16–25 秒，適合會後重新辨識；Breeze 維持即時辨識。
- 限制：macOS 合成語音、單次測試、人工模擬遠場。要用真實會議錄音確認（見 `../10-field-test.md`）。
