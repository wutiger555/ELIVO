# ADR-0006：主要與備用 ASR 選擇

- **狀態**：Proposed（2026-09-29 初版；依據合成音檔與本機效能實測，**真實中英混說會議錄音的 MER 尚未量測**，量測後改為 Accepted 或修訂）
- **依據**：[`spikes/asr-realtime/RESULTS.md`](../../spikes/asr-realtime/RESULTS.md)、[`08-handoff-local-dev.md`](../08-handoff-local-dev.md)、[`research/B-technical-feasibility.md`](../research/B-technical-feasibility.md)

## 背景

- ASR 是 Gate 0 前提 C2，也是產品最大的技術風險：必須即時、中英混說、輸出台灣正體中文。
- 公開 benchmark 沒有「串流 × zh-TW 中英混說」的數據，只能自己量。
- 本機實測環境：MacBook Pro M1 Pro（16 核 GPU）、16 GB、macOS 26.6；whisper.cpp 1.9.4（Metal）。
- ADR-0002 要求 ASR 走供應商抽象層，所以本決策可以隨實測結果替換，不影響業務邏輯。

## 實測摘要（合成音檔，詳見 RESULTS.md）

| 項目 | Breeze-ASR-25 q8_0 | large-v3-turbo |
|---|---|---|
| 離線 RTF | 0.10 | 0.05 |
| 單次推論（3–15 秒視窗） | 1.07–1.69 s | 0.76–0.99 s |
| 串流首字延遲 p50 | 1.74 s | 1.30 s |
| 串流定稿延遲 p50 | 2.13 s | 1.82 s |
| 記憶體（RSS） | 2.1 GB | 1.9 GB |
| 輸出 | 正體、數字轉阿拉伯數字、無標點 | **簡體**（需 OpenCC `s2twp`）、有標點 |

關鍵限制：

- Whisper 每次推論都把輸入補到 30 秒，約 1 秒的固定成本無法靠縮小 `audio_ctx` 省掉（會輸出亂碼）。
- 因此暫定字的延遲下限約 1.2–1.5 秒。

## 決策（提案）

1. **主要（本地）**：Breeze-ASR-25 **q8_0**，whisper.cpp（Metal），常駐 `whisper-server`；Silero VAD 切句，滑動視窗加 LocalAgreement-2 產生暫定字與確定字。
   - 理由：台灣中英混說有最充分的公開證據（CSZS WER 13.0 vs Whisper 29.5）；直接輸出正體；在 M1 Pro 16 GB 上定稿延遲 p50 約 2.1 秒，符合交接文件 1.5–3 秒的預期；$0／小時，音訊不離開裝置。
   - 不用 q5_0：在 Metal 上沒有比較快，只省 0.6 GB。
2. **本地備用（速度優先、低階機型）**：large-v3-turbo。延遲約少 0.3–0.4 秒，但原版 Whisper 系列在真實中英混說的品質風險高，需要真實錄音確認後才能當主力。
3. **雲端備用**：Soniox `stt-rt`（約 US$0.12／小時，自動中英切換、含 diarization）。用於：
   - 8 GB 機型與 Intel Mac；
   - 使用者選擇「最低延遲」時；
   - 本地 ASR 過熱或降頻時的後備。
   - 繁體輸出與 zh-TW 中英混說品質待 S1 bake-off 驗證。
4. **系統音訊擷取**：Core Audio process tap（Swift，`systap` 原型），不依賴 BlackHole 等虛擬驅動。

## 後果

- ✅ 預設本地處理，符合信任設計：音訊不上雲、無 ASR 成本。
- ✅ 同一套引擎可離線重播，直接成為 eval harness 的基礎。
- ⚠️ 首字延遲約 1.7 秒，未達架構文件「partial < 1 秒」的目標，需要後續優化（見下）。
- ⚠️ 本地 ASR 會持續占用 GPU，16 GB 機型不建議再同時跑本地 LLM，卡片先用雲端 Claude Haiku 4.5。
- ⚠️ 兩路（我／他人）共用一個推論引擎時，同時說話會排隊，定稿 p95 升到約 4.9 秒。
- ⚠️ 使用喇叭時麥克風會收到對方聲音，需要 AEC（`AVAudioEngine` voice processing）。

## 改為 Accepted 前必須補的證據

- [ ] 真實中英混說會議錄音（取得同意）的 MER、術語召回：Breeze q8 vs large-v3-turbo。目標是遠端會議 MER ≤ 12%。
- [ ] 30–60 分鐘連續串流的溫度、功耗與降頻。
- [ ] 真人麥克風與 Zoom／Meet／Teams 實際會議的延遲。
- [ ] Soniox 串流在同一組錄音的 MER、延遲與繁體輸出（S1 bake-off）。

## 後續可評估的延遲優化

- WhisperKit 搭配 Breeze CoreML 走 ANE（`fredchu/breeze-asr-25-whisperkit-coreml`，4-bit palettized，需驗證量化後的品質），可能降低固定推論成本，也是 Swift helper 的正式路線。
- whisper.cpp 的 CoreML encoder（ANE），需要自行從官方權重轉檔。
- 雙模型：turbo 產生暫定字、Breeze 產生確定字（UI 可能出現「字改掉」的閃動，需評估）。
- Apple SpeechAnalyzer（免費、低延遲，但一個 transcriber 只能設一種語言）作為基準。

## 替代方案

- **只用雲端 ASR**：延遲可能較低、整合較簡單，但每小時有成本，且音訊離開裝置，與信任定位衝突；保留作為備用。
- **BlackHole 虛擬音訊裝置**：需要安裝驅動與管理員權限，公司管理的電腦可能不允許；process tap 已證明可行，因此不採用。
