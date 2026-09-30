# 附錄 D：說話者分辨（Diarization）研究

> 狀態：研究草稿（2026-09-30）｜範圍：Apple silicon 本機方案、ELIVO 整合方式、合規、競品、分階段建議與 spike 計畫
> ⚠️ 法律段落**不是法律意見**，是提供給律師討論用的整理。
> 依據：ADR-0003、`docs/06-compliance-and-trust.md`、`docs/research/B-technical-feasibility.md` §2、`services/realtime/elivo/asr/stream_engine.py`

---

## TL;DR

1. **技術上可行，而且不必上雲。** 2026 年 9 月後，Mac 本機已有商用授權乾淨、能串流的 diarization：**NVIDIA Nemotron 3 Diarization**（OpenMDW-1.1，最多 8 人，訓練資料含中文）加上 **FluidAudio**（Apache-2.0，Swift／CoreML，跑在 ANE）。它不會跟 whisper.cpp 搶 Metal GPU。
2. **Phase 1 只做「同一場會議內的說話者 A／B／C＋使用者手動命名」**，先只對「他人」那一路做。speaker embedding 只放在記憶體，會議結束就丟，不寫入磁碟，也不跨會議比對。
3. **法律面的最新發展對本機處理有利，但仍有風險。** 第七巡迴法院 *G.T. v. Samsung*（2026-08-07）認為，只在使用者裝置上產生、廠商無法控制的生物特徵資料，廠商並未「持有／蒐集」。另一方面，*Basich v. Microsoft*（2026-02）主張 diarization 本身就會產生聲紋，這個案子還在審理中。
4. **跨會議自動認人（Otter、Jamie 的做法）正是 BIPA 訴訟的核心。** Otter 的 BIPA 請求在 2026-08-13 存活，法院看的正是「跨會議的說話者辨識 profile」。ELIVO 應延後到 Phase 3，而且必須逐人書面同意。
5. **下一步：1 週 spike。** 比較三條路線（見 §6），量測「每句說話者正確率」、標籤翻轉率，以及對 ASR 延遲的影響。

---

## 1. 本機可用方案比較

### 1.1 這台機器現況（已用 `ls` 確認，未下載任何東西）

| Cache | 內容 | 可否離線使用 |
|---|---|---|
| `pyannote/speaker-diarization-3.1` | `config.yaml` | ✅ 相依的 `segmentation-3.0`（5.6 MB）與 `wespeaker-voxceleb-resnet34-LM`（25 MB）都在，裝好 `pyannote.audio` 即可離線跑 |
| `pyannote/speaker-diarization-community-1` | **只有 `plda/`**（2 個約 134 KB 的 npz） | ❌ **不完整**：缺 `config.yaml` 與子模型，推測是 gated 下載中斷。需要 HF token 並接受條款後補下載 |
| Python | 系統 Python 與 `services/realtime/requirements.txt` 都**沒有** `pyannote.audio` | — |

### 1.2 方案總表

| 方案 | 串流／延遲 | 準確度（公開數據，DER 越低越好） | 資源／硬體 | 授權（商用） | 整合 | 中文 |
|---|---|---|---|---|---|---|
| **pyannote community-1** | ❌ 離線 | AISHELL-4 11.7%、AliMeeting 20.3%、AMI SDM 19.9%（[HF](https://huggingface.co/pyannote/speaker-diarization-community-1)） | PyTorch；H100 每小時音訊約 31–37 秒（[GitHub](https://github.com/pyannote/pyannote-audio)）；M1 待測 | CC-BY-4.0（需標示出處）；gated，**首次下載要 HF token**，之後可離線 | Python，最容易 | 訓練資料含 AISHELL、AliMeeting |
| **pyannote 3.1** | ❌ 離線 | AISHELL-4 12.2%、AliMeeting 24.4%（[HF](https://huggingface.co/pyannote/speaker-diarization-3.1)） | Mac MPS：45 分鐘音訊約 3.3 分鐘；**3.1 在純 CPU 上 embedding 反而較慢**（[#1626](https://github.com/pyannote/pyannote-audio/issues/1626)）；MPS 曾有時間戳錯誤（[#1337](https://github.com/pyannote/pyannote-audio/issues/1337)） | MIT；gated | Python | 同上 |
| **diart** | ✅ 500 ms–5 s 可調（[GitHub](https://github.com/juanmc2005/diart)） | 論文有 AMI／DIHARD／VoxConverse 數據（[arXiv](https://arxiv.org/abs/2109.06483)），確切數字待驗證 | 每個 5 s chunk：segmentation 12 ms＋embedding 26 ms（Ryzen CPU） | MIT | Python；**最新版 0.9.2（2025-02），官方建議 `pyannote.audio<3.1`**，與 4.x 相容性待驗證 | 未知 |
| **Streaming Sortformer 4spk v2.1** | ✅ 1.04 s 起 | AliMeeting near／far 12.60／15.60%、AMI SDM 20.57%（1.04 s）；**最多 4 人**，≥5 人時 DIHARD 41%（[HF](https://huggingface.co/nvidia/diar_streaming_sortformer_4spk-v2.1)） | 117M 參數 | NVIDIA Open Model License（可商用） | 原生需 NeMo＋CUDA；Mac 要透過 FluidAudio／Argmax | 以英文為主，訓練資料含 AISHELL-4／AliMeeting |
| **Nemotron 3 Diarization**（2026-09-23） | ✅ 0.32／0.64／1.04／30.4 s | AliMeeting near 6.40%、AMI MHM 9.25%（30.4 s）（[HF](https://huggingface.co/nvidia/Nemotron-3-Diarization)）；**最多 8 人** | 100M 參數；官方只列 NVIDIA GPU | **OpenMDW-1.1**：寬鬆授權、明言可商用（[HF](https://huggingface.co/nvidia/Nemotron-3-Diarization)、[LF](https://www.linuxfoundation.org/press/linux-foundation-releases-openmdw-1.1-nvidia-adopts-openmdw-for-cosmos-isaac-gr00t-ising-and-nemotron-ai-model-families)） | Mac：FluidAudio v0.17.0 已支援（見下一列） | **訓練語言明列 Mandarin** |
| **FluidAudio**（Swift／CoreML） | ✅ Nemotron 3、Sortformer、LS-EEND；另有 community-1 離線移植版 | Nemotron 3 CoreML 在 AMI MHM：`low` 1.04 s → 9.75%、`fast32` 2.88 s → 9.53%（M5 Pro）（[PR #883](https://github.com/FluidInference/FluidAudio/pull/883)）；community-1 在 AMI SDM 平均 13.9–15.1%（[Benchmarks](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/Benchmarks.md)）。**注意：用 community-1 硬切 chunk 做串流時 DER 38–56%，不可用** | ANE；Nemotron `fast32` RTFx 約 179×（M5 Pro），CoreML fp16 模型約 190 MB；M1 待測 | 程式碼 Apache-2.0（[GitHub](https://github.com/FluidInference/FluidAudio)）；模型沿用原授權 | **只有 Swift**（另有 Rust、RN），沒有 Python binding | 取決於模型 |
| **Argmax SpeakerKit／Pro SDK** | ✅ Pro SDK 2 是 Sortformer 串流；SDK 3 支援 Nemotron 3（[SDK 2](https://www.argmaxinc.com/blog/argmax-sdk-2)、[SDK 3](https://www.argmaxinc.com/blog/argmax-sdk-3)） | 自家報告在 11 個資料集中 Nemotron 3 最佳 | 約 10 MB（pyannote 版） | pyannote 4 引擎已開源；**Pro 版每裝置每月 $1.00–1.33，最低 1,000 授權／月**（[Pricing](https://www.argmaxinc.com/pricing)） | Swift | — |
| **sherpa-onnx** | ❌ 離線 pipeline（文件未提串流） | 未提供 DER | pyannote seg＋3D-Speaker：RTF 0.24–0.30；＋NeMo TitaNet：RTF 0.11（[docs](https://k2-fsa.github.io/sherpa/onnx/speaker-diarization/models.html)） | Apache-2.0；**reverb-diarization-v1 是非商用授權，不可用** | `pip`，Python／Swift／C 都有 | 3D-Speaker 模型以中文訓練 |
| **3D-Speaker（CAM++）** | ❌ | AISHELL-4 10.30%、AliMeeting 19.73%（含重疊偵測）；CPU RTF 0.03（[GitHub](https://github.com/modelscope/3D-Speaker/tree/main/egs/3dspeaker/speaker-diarization)） | 輕量 | Apache-2.0；訓練資料集授權待驗證 | Python | 20 萬人中文資料 |
| **WeSpeaker** | 工具包，不是現成的串流 pipeline | — | 可用 MNN runtime | 程式碼 Apache-2.0；**預訓練模型沿用資料集授權**（VoxCeleb → CC-BY-4.0）（[docs](https://github.com/wenet-e2e/wespeaker/blob/master/docs/pretrained.md)） | Python | 有 CN-Celeb 模型 |
| **Apple 內建** | — | — | — | — | SpeechAnalyzer 未見說話者模組；第三方做法都是自己搭配 FluidAudio（[例](https://github.com/Marvinngg/ambient-voice)）。**是否有官方 API 待驗證（查不到）** | — |

**解讀要點**
- **各家 DER 不能直接比較。** collar、是否計入重疊語音、AMI 用 MHM 還是 SDM 都不同；AMI MHM（近講混音）明顯比 SDM（單一遠場麥克風）容易。
- **中文遠場（AliMeeting far）是最接近「會議室一支麥克風」的公開指標。** 以這項來看：Sortformer 1.04 s 為 15.6%，community-1 離線為 20.3%，Nemotron 3 串流版的數字待驗證。
- **供應鏈限制。** 3D-Speaker（ModelScope／阿里巴巴）、sherpa-onnx（k2-fsa）、WeSpeaker 屬中國來源或以中國社群為主。依 `06-compliance` §3.7，政府／金融版本不能用，一般版本也建議避免當主路徑。

---

## 2. 在 ELIVO 架構下怎麼接

### 2.1 哪一路要做

| 情境 | 麥克風（我） | 系統音訊（他人） |
|---|---|---|
| 遠端會議（Phase 1） | 不做，維持「我」 | **做**：他人 A／B／C |
| 會議室、共用一支麥克風（Phase 1b） | **做**：同一支麥克風裡有多人，「我」這個標籤會錯。先顯示 A／B／C，由使用者點選哪一位是自己 | 通常無聲，或是混合會議的遠端與會者 |
| 混合會議＋喇叭外放 | 需要 AEC，否則同一句會出現兩次（spike 已知問題） | 做 |

建議把「我」也當成 diarization 的一個選項：麥克風那一路預設只有 1 位說話者；偵測到第 2 個 cluster 時，才在 UI 提示「好像有多人共用麥克風」。

### 2.2 與串流 ASR 對齊

現行引擎以 **VAD 語句**為單位（靜音 ≥0.6 s 句尾、最長 15 s），時間用 `time.monotonic()`，沒有記錄取樣點位置。

| 做法 | 優點 | 缺點 |
|---|---|---|
| **A. 每句指派一位說話者**（diarization 時間軸與語句重疊最多者勝出；community-1 的 *exclusive* 模式正是為此設計，見 [blog](https://www.pyannote.ai/blog/community-1)） | 最簡單，符合現有 `utt` 事件結構 | 兩人搶話、中間沒停頓時，一句會混進兩個人 |
| **B. 依 whisper segment 時間戳切句** | 已有 `res.segments[i]["start"]`（`_cut` 有用到） | segment 粒度粗；word-level 時間戳在 whisper-server 是否可用、準不準，待驗證 |
| **C. 把說話者切換當成句尾訊號**：diarizer 偵測到換人，就強制結束目前語句 | 從源頭避免一句兩人，也能改善 ASR。Argmax SDK 3 的「pre-diarized transcription」是同樣的思路 | 切換偵測需要 ≤1 s 延遲，誤判會把句子切碎 |

**建議**：Phase 1 用 A，並在第二位說話者佔比超過 30% 時標記 `mixed`；spike 驗證 C 的收益。需要一個小改動：`Utterance` 要記錄起訖的**取樣點位置**，兩個時間軸才對得起來。

**顯示策略**：會中標籤是「暫定」，句子定稿後 1–3 s 內鎖定。會後如果有 spool 音訊（非 ephemeral 模式），用 community-1 離線重算一次來修正（與 `03-architecture` §4.9 一致），完成後刪除音訊。

### 2.3 對推論負載的影響

- 現況：兩路共用一個 whisper-server（`asyncio.Lock` 排隊），Breeze q8 每次推論約 1.1 s。M1 Pro 16 GB 在 spike 時已用到約 14 GB，另有 2.8 GB swap（`RESULTS.md`）。**記憶體是最緊的資源。**
- **FluidAudio／CoreML 跑在 ANE**，與 whisper.cpp 的 Metal GPU 分開，理論上不搶鎖也不搶 GPU。模型約 95–190 MB。
- **pyannote（PyTorch）**：用 MPS 會與 whisper 搶 GPU，用 CPU 則 embedding 慢。適合會後批次處理，不適合會中。
- diarization **完全不需要**拿 `asr_lock`，所以不會增加 ASR 排隊。

---

## 3. 合規設計

### 3.1 法規怎麼定義「生物特徵」

| 法規 | 關鍵文字 | 對 diarization 的含意 |
|---|---|---|
| **BIPA**（伊利諾州） | "voiceprint" 是 biometric identifier。§15(a) 須公開保存政策，目的達成或最後互動後 3 年內銷毀；§15(b) 須書面告知並取得 written release；每次違反 $1,000／$5,000。2024 年 SB 2979：同一人、同一方式只算 1 次違反，電子簽章可作為 written release（[GT](https://www.gtlaw.com/en/insights/2024/8/bipa-update-illinois-limits-liability-and-clarifies-electronic-consent-for-biometric-data-collection)） | 見 3.2 判例 |
| **GDPR** | Art. 4(14)：生物特徵資料是經特定技術處理、「**allow or confirm the unique identification**」的資料（[gdpr-info](https://gdpr-info.eu/art-4-gdpr/)）。EDPB 02/2021：以聲紋**識別**使用者屬於 Art. 9 特殊類別，需明確同意；聲紋應存在本機；必須提供不用聲紋的同等功能（[EDPB](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-022021-virtual-voice-assistants_en)、[Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/edpb-releases-guidelines-on-virtual-voice-assistants)） | 只「區分」不「識別」的 diarization，較可能是一般個資（Art. 6）而不是 Art. 9（**我的解讀，需律師確認**） |
| **EU AI Act** | Art. 3(35) biometric identification 是「與資料庫比對以確認身分」；3(41) remote biometric identification 是「無需當事人主動參與」地與參考資料庫比對；Annex III(1) 列為高風險，但**排除 1:1 驗證**（[Art. 3](https://artificialintelligenceact.eu/article/3/)、[Annex III](https://artificialintelligenceact.eu/annex/3/)） | 會議內 A／B／C 不比對資料庫，不符合定義。**跨會議自動認人可能落入高風險**，須正式評估；高風險義務的適用日期仍待確認（待驗證） |
| **台灣個資法** | 第 2 條列舉「特徵」；非公務機關蒐集須有特定目的，並符合第 19 條各款之一（例如同意、契約關係、對當事人權益無侵害）（[第 19 條](https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050021&flno=19)）。生物特徵不在第 6 條特種個資之列（`C-legal` §台灣） | 聲紋是一般個資；跨會議建檔應取得同意並依第 8 條告知 |

### 3.2 判例

- **Zellmer v. Meta**（9th Cir. 2024）：biometric identifier 必須「能識別特定人」。無法用來識別的 face signature 不受 BIPA 規範（[Perkins Coie](https://www.perkinscoie.com/en/news-insights/2024_0708-biometric-identifiers-ninth-circuit-clarifies-the-scope-of-bipa.html)）。
- **G.T. v. Samsung**（7th Cir. 2026-08-07）：「possess／collect／capture／obtain」都要求廠商對資料有**控制**。只存在使用者裝置上的 template，廠商並未持有（[Justia](https://law.justia.com/cases/federal/appellate-courts/ca7/25-1120/25-1120-2026-08-07.html)、[Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2026/08/seventh-circuit-holds-that-bipa-does-not-reach-biometric-data-that-remains-on-a-users-device)）。這推翻了較早 *Hazlitt v. Apple*（S.D. Ill. 2020）的寬鬆見解（[UBG](https://www.ubglaw.com/news-and-media/illinois-federal-court-rules-apple-may-be-in-possession-of-biometric-data-stored-on-user-devices)）。**但州法院不受第七巡迴拘束。**
- **In re Otter.AI**（N.D. Cal. 2026-08-13）：BIPA 請求存活。法院依據的是「以 Zoom 名稱或手動標記建立 speaker identification profile，**以便之後的會議認出同一人**」（[ID Tech](https://idtechwire.com/otter-ai-must-face-voiceprint-claims-under-illinois-biometric-law/)）。
- **Cruz v. Fireflies.AI**（C.D. Ill. 2025-12-18）、**Fricker v. Fireflies.AI**（N.D. Ill. 2026-03）：Speaker Recognition 據稱為非使用者建立聲紋，且沒有書面告知、同意與保存政策（[tl;dv](https://tldv.io/blog/ai-meeting-recorder-lawsuits/)、[起訴狀](https://commlawgroup.com/wp-content/uploads/2025/12/Fireflies.ai-Complaint-1.pdf)）。
- **Basich v. Microsoft**（W.D. Wash. 2:26-cv-00422，2026-02-05）：**直接指控 Teams 即時轉錄的 diarization 本身**擷取音高、音色等特徵，構成聲紋（[UC Today](https://www.uctoday.com/unified-communications/microsoft-teams-lawsuit-bipa-voice-data/)、[Lewis Rice](https://www.lewisrice.com/publications/ai-transcription-tools-give-rise-to-bipa-claims)）。**這表示連會議內 diarization 都有被訴的可能**，目前沒有判決。

### 3.3 什麼樣的做法算「不建立持久聲紋」（建議的 ELIVO 規格）

1. embedding、attractor、Sortformer speaker cache **只存在 diarizer 行程的記憶體**。不寫入 SQLite、log、spool、crash report，也不送到任何伺服器（LLM 只收到文字與「說話者 A」這類標籤）。
2. **會議結束（或刪除會議）時清空**。暫停再繼續時可以保留，因為仍是同一場會議。
3. **不跨會議比對**。每場會議的 cluster ID 都從 A 重新開始。
4. 會後離線重算只用本場 spool，完成後連同音訊一起刪除。ephemeral 模式不做會後重算。
5. 在隱私政策與會議告知文字中寫明：「會分辨同一場會議中的不同說話者，但不建立聲紋、不跨會議辨識」。
6. 在 UI 與 API 層面，不輸出任何韻律、語氣特徵（呼應 ADR-0003 不做情緒辨識）。

以 *Zellmer*（能否識別）與 *G.T.*（廠商是否控制）的標準來看，這是目前最強的防禦位置。不過 *Basich* 的理論若成立，風險仍然存在（**需律師確認**）。

### 3.4 手動命名「說話者 A＝王經理」

- 命名是**人**把名字寫到逐字稿上，系統沒有用生物特徵去比對資料庫。名字對應只存在「本場會議的標籤表」，**不與任何 embedding 一起保存**。
- 灰色地帶：命名之後，本場後續語句會被自動歸給「王經理」，等於在本場內「確認身分」。依 GDPR Art. 4(14) 文字，保守起見應視為**個資處理**（逐字稿本來就是個資），但我判斷**不構成跨時間可重複使用的生物特徵識別**（**我的解讀，需律師確認**）。
- 與 Otter 案的區別是關鍵：Otter 把名字與聲音 profile 綁在一起，並在**未來會議**重用。ELIVO 絕對不能把「名字＋embedding」存下來。
- UI 文案建議：「只套用在這場會議」。

### 3.5 跨會議自動辨識所需的同意流程（Phase 3，另立 ADR）

- **逐人**、事前、書面（BIPA 可用電子簽章）同意，內容要說明目的、保存期間、銷毀條件。同意者必須是聲紋當事人本人，不能由會議主辦人代為同意。
- 公開保存與銷毀政策：例如停用 12 個月後自動刪除，BIPA 上限為 3 年。當事人可以隨時撤回並刪除。
- **聲紋 template 只存在本機、加密**（依 EDPB 建議），不同步到雲端。
- 依 EDPB 要求，必須提供不用聲紋的同等功能（也就是手動命名）。
- 依地區關閉：伊利諾州、EU 預設不提供，律師核可後才開放。上線前要做 DPIA 與 AI Act 高風險評估。
- **建議從「只有我自己」的聲紋開始**：使用者本人同意，用途是會議室裡辨識「我」，風險最低。

---

## 4. 競品怎麼做說話者標示

| 產品 | 做法 | 跨會議記住聲音？ | 同意／備註 |
|---|---|---|---|
| **Granola** | 預設是 Me／Them（麥克風／系統音訊）。Speaker tags 用 macOS Accessibility 讀 Zoom 桌面版的顯示名稱與 active-speaker 指示，Meet 則靠瀏覽器擴充（[docs](https://docs.granola.ai/help-center/taking-notes/speaker-attribution)、[transcription](https://docs.granola.ai/help-center/taking-notes/transcription)）。手機 app 在面對面會議可分辨說話者 | 文件未提聲紋 | 官方寫明 speaker tags 不會通知其他與會者 |
| **Otter** | 使用者標記幾段文字後，系統學會聲音，之後的會議自動標名；有「Disable Speaker Learning」設定（[Overview](https://help.otter.ai/hc/en-us/articles/21665587209367-Speaker-Identification-Overview)、[Tagging](https://help.otter.ai/hc/en-us/articles/360048465453-Tagging-speaker-names-in-a-conversation)） | **是** | 預設值與同意流程待驗證（頁面 403）；BIPA 請求已存活 |
| **Fireflies** | 透過 bot 取得平台與會者名稱，加上 Speaker Recognition | 起訴狀指稱為是 | 兩件 BIPA 訴訟 |
| **Krisp** | bot-free。自動命名只限 1:1 會議（用行事曆或聯絡人），其他要手動（[Help](https://help.krisp.ai/hc/en-us/articles/8326933081116-AI-Meeting-Assistant-FAQ)） | 待驗證 | — |
| **Notion AI Meeting Notes** | 桌面版：偵測說話者切換，再用行事曆等非音訊資訊命名；**只支援英文**，1:1 效果最好（[Help](https://www.notion.com/help/ai-meeting-notes)） | 未提 | 次處理者不為說話者辨識保留音訊；提供錄音告知選項 |
| **Jamie** | bot-free。「Speaker Memory」跨會議比對同一聲音並連結行事曆名稱，連免費版都有（[blog](https://www.meetjamie.ai/blog/bot-free-ai-note-takers)、[privacy](https://www.meetjamie.ai/privacy-policy)） | **是** | 以客戶受託者身分處理，資料在 Frankfurt；逐人同意流程待驗證 |
| **MacWhisper** | 本機運作。v12 起支援 speaker recognition（WhisperKit 模型）；v15.2（2026-09-23）改用 **Nemotron 3 Diarization**，最多 8 人，可用於即時會議畫面（[9to5Mac](https://9to5mac.com/2026/09/23/macwhisper-update-brings-real-time-meeting-transcripts-improved-speaker-recognition-more/)、[docs](https://docs.macwhisper.com/article/32-automatic-speaker-recognition-in-macwhisper)） | 設定裡的說話者名稱會自動建議；是否比對聲音待驗證 | 本機處理 |
| **Superwhisper** | 「Speaker-Separated Meetings」在**錄完後**才分說話者，Nova（Deepgram 雲端）模型效果最好（[docs](https://superwhisper.com/docs/modes/speaker-separated-meetings)） | 未提 | — |

**觀察**：只有 Otter、Jamie、Fireflies 做跨會議聲紋，而 Otter、Fireflies 都被告了。本機串流 diarization 已有 MacWhisper 以 Nemotron 3 上線，證明 Mac 上可行。Granola 的 Accessibility 路線不需要生物特徵，但依賴會議 app 的 UI，很脆弱，而且不適用於實體會議。

---

## 5. 建議

**首選技術路線**：做一個 **Swift diarizer helper**（與 `apps/capture-mac/systap` 同一套工具鏈），內嵌 **FluidAudio＋Nemotron 3 Diarization**。Python 經由 stdin 送 16 kHz PCM，helper 從 stdout 回傳 `{speaker, start_sample, end_sample, prob}`。Python 端定義一個 `Diarizer` 介面（依 ADR-0002 精神），可換成 `pyannote-offline` 或 `utterance-embedding` 等其他後端。

| 階段 | 內容 | 前提 |
|---|---|---|
| **Phase 1a** | 只對「他人」做會中 A／B／C（暫定＋鎖定）、手動命名只限本場、會後用 community-1 重算（非 ephemeral 模式） | spike 通過；更新隱私告知文案 |
| **Phase 1b** | 會議室模式：麥克風那一路也做，使用者點選哪位是「我」；搭配 AEC | 實測單一麥克風的中文表現 |
| **Phase 2** | 用**非生物特徵**的訊號建議名字：1:1 會議直接用行事曆對方姓名，多人會議由使用者從與會者清單挑選 | — |
| **Phase 3（選配）** | opt-in 聲紋：先做「只有我自己」，再做他人（逐人電子簽署、只存本機、會過期） | 律師意見、DPIA、AI Act 評估、新 ADR |

---

## 6. Spike 計畫（約 5 個工作天，放在 `spikes/diarization/`）

**要比較的三條路線**
- **R1 語句層 embedding 分群**（Python）：每個 VAD 語句算 1 個 embedding（用已快取的 `wespeaker-voxceleb-resnet34-LM`），加上線上凝聚式分群。最容易接進現有引擎，但短句與一句多人是弱點。
- **R2 Nemotron 3 串流**（FluidAudio CLI／Swift）：比較 `low`（1.04 s）與 `fast32`（2.88 s）兩個 preset。
- **R3 離線參考**：pyannote 3.1（已可離線）與 community-1（需補下載），作為會後重算的上限。

**資料**
- AliMeeting eval 的 near／far 子集（公開中文會議；授權待驗證）。
- 自錄 2 場、各 15–20 分鐘，事前取得所有人書面同意：遠端 Zoom 3–4 人（用 systap 擷取）、會議室單一麥克風 3–4 人，內容為中英混說。先用 R3 產生 RTTM 初稿，再人工修正。
- 不用 TTS 合成音檔，因為聲音差異太明顯，量不出真實表現。

**量測項目**
1. DER／JER，分別用 collar 0.25 s 與 0 計算。
2. **每句說話者正確率**：每個 ASR 語句的標籤是否正確（經最佳對應後），這是使用者實際看到的指標。
3. 說話者人數誤差。
4. 標籤延遲（定稿到鎖定）與鎖定後的翻轉率。
5. 開啟 diarization 前後，ASR 首字與定稿延遲的 p50／p95 變化。
6. RSS、CPU%，以及 ANE 使用量（`powermetrics`）。
7. R3 的 RTF（MPS 與 CPU 各測一次）。

**建議門檻（提案，跑完再調整）**：遠端會議的「他人」每句正確率 ≥90%；會議室 ≥80%；翻轉率 ≤5%；ASR 定稿延遲 p95 增加 ≤0.3 s；額外 RSS ≤500 MB。

**日程**
- D1：資料與標註。
- D2：R3 基準（順便確認 community-1 下載，以及 MPS 時間戳問題）。
- D3：R1 接上 `stream_demo.py` 重播。
- D4：R2 與 whisper-server 同時跑，量測資源競爭。
- D5：寫 `RESULTS.md` 與新 ADR 草案（diarization 選型＋「不建立持久聲紋」規格）。

---

## 待驗證清單

- community-1 與 Nemotron 3 在 M1 Pro 上的實際 RTF 與記憶體用量。
- Nemotron 3 串流 preset 在 AliMeeting far 的 DER。
- diart 論文的確切數字，以及它與 pyannote 4.x 的相容性。
- whisper-server 的 word-level 時間戳。
- Apple 是否有官方 diarization API。
- Otter、Krisp、Jamie、MacWhisper 的同意流程細節與聲紋保存方式。
- AliMeeting、3D-Speaker 訓練資料集的授權。
- EU AI Act 高風險義務的適用日期。
- 所有標註「我的解讀」的法律判斷。
