# 交接：本地開發的下一步（ASR 即時辨識 Spike）

> 狀態：2026-09-29 由雲端工作階段交接給本地（Mac）工作階段
> 對應：[`03-technical-architecture.md`](03-technical-architecture.md) §9 的 S1、S2、S6；[`05-validation-plan.md`](05-validation-plan.md) §4

---

## 1. 目前進度

- ✅ 全盤調查、修訂版計劃、架構、MVP 規格、驗證計畫、合規、風險、ADR 都已完成（全在 `docs/`）。
- ✅ Repo 已初始化，`main` 為主分支。
- ⏭️ **下一步**：在創辦人的 Mac 上實測「本地模型能否做到即時中英混說逐字稿」。
  - 這是 Gate 0 的前提 C2，也是整個產品最大的技術風險。
  - 雲端環境是 Linux，沒有 Apple 晶片與 macOS 音訊，所以這一步必須在本地做。

## 2. 已知的技術判斷（來自調查，尚未在本機實測）

1. **Whisper 不是原生串流模型。** 即時顯示要靠 VAD（Silero）＋滑動視窗重算：
   - 先顯示「暫定字」。
   - 連續兩次結果一致才轉成「確定字」（LocalAgreement 策略）。
   - 預期延遲：暫定字 0.5–1.5 秒、確定字 1.5–3 秒。
2. **原版 Whisper 的中英混說很差**：語言判斷錯亂，在企業中英混說測試中 WER 大於 100%。
3. **首選模型：MediaTek Breeze-ASR-25。** 以 Whisper large-v2 微調、Apache-2.0 授權，中英混說 WER 13.0（原版 Whisper 為 29.5）。
   - Hugging Face 官方：`MediaTek-Research/Breeze-ASR-25`。
   - 社群轉檔（**待驗證是否存在、是否可用**）：
     - `fredchu/breeze-asr-25-whisperkit-coreml`（WhisperKit）
     - `tsuzuri-app/Breeze-ASR-25-ggml`（whisper.cpp）
   - 若社群版不可用，可自行用 whisper.cpp 的轉檔腳本，從官方權重轉成 ggml。
4. **對照組**：
   - `large-v3-turbo`（速度基準）。
   - Apple SpeechAnalyzer（macOS 26 以上，免費；一個 transcriber 只能設一種語言）。
   - 雲端 Soniox（約 US$0.12／小時，自動中英切換；需要 API key，可選）。
5. **Whisper 在靜音或噪音時會「幻覺」出字**，因此一定要先過 VAD。
6. **輸出須為台灣正體中文**：若輸出是簡體，用 OpenCC `s2twp` 轉換。
7. **MVP 建議架構**：本地 ASR ＋ 雲端 LLM 產生卡片（每會議小時約 US$0.18）。16GB 的機器不建議同時跑本地 ASR 和本地 LLM。

## 3. 硬體判斷表（估計值，以實測 RTF 為準）

RTF（real-time factor）＝處理時間 ÷ 音訊長度。滑動視窗會重複計算，所以需要 **RTF < 0.3–0.5** 才算得上「即時」。

| 機型等級 | 建議 |
|---|---|
| 8GB（任何 M 系列） | Breeze 量化版可能太慢 → 先測 `large-v3-turbo`（q5）或 `medium`；中英混說若不夠好，就改用雲端 ASR |
| M1／M2 16GB | Breeze q5_0 或 q8_0（whisper.cpp + Metal）；實測 RTF |
| M1／M2／M3／M4 Pro、Max（16GB 以上） | Breeze fp16 或 q8 應可即時；24GB 以上可再試本地 LLM（Qwen3-4B，MLX） |
| Intel Mac | 不適合本地即時 → 改用雲端 ASR |

查詢硬體的指令：

```bash
sysctl -n machdep.cpu.brand_string
sysctl -n hw.memsize
sw_vers
system_profiler SPHardwareDataType
```

## 4. Spike 任務（建議放在 `spikes/asr-realtime/`）

### Step A：離線基準（半天）

- 準備 1–3 段取得同意的真實會議錄音，須有中英混說，每段 3–10 分鐘。
- 有人工校對逐字稿更好，沒有的話先用 Breeze 的輸出人工修正。
- 對每個模型量測：
  - RTF
  - 首字延遲
  - MER：中文按字計、英文按詞計
  - 術語是否辨識正確
  - CPU、記憶體與溫度
- 產出：`spikes/asr-realtime/RESULTS.md`，附比較表。

### Step B：即時麥克風 demo（1 天）

- 麥克風 → VAD → 滑動視窗 ASR → 本機 WebSocket → 網頁。
  - 網頁上暫定字為灰色，確定字為黑色。
  - 分成兩欄：左側逐字稿，右側預留 Context 區。
- 網頁綁在 `0.0.0.0`，讓同一 Wi-Fi 的 iPad 或手機瀏覽器可以打開，驗證第二螢幕模式。

### Step C：系統音訊（0.5–1 天）

- **最快的做法**：安裝 BlackHole 虛擬音訊裝置，再用多重輸出裝置把 Zoom、Meet 的聲音導進去。
- **正式做法**：寫 Swift 小工具，用 Core Audio process taps（macOS 14.4 以上）擷取系統音訊。之後會成為 `apps/capture-mac/`。
- 麥克風標為「我」，系統音訊標為「他人」。

### Step D：卡片雛形（可選，0.5 天）

- 每 15–20 秒把新增的逐字稿送給雲端 LLM（例如 Claude Haiku 4.5，model id：`claude-haiku-4-5`），抽出以下 JSON，顯示在右欄：
  - 決策
  - 待辦（含 owner）
  - 未回答問題
  - 數字
- 需要 `ANTHROPIC_API_KEY`。

### 產出與決策

- 在 `RESULTS.md` 寫出結論：本機能不能即時跑 Breeze？延遲多少？中英混說品質如何？
- 撰寫 `docs/adr/0006-asr-selection.md` 初版，決定主要與備用 ASR；並更新 `docs/adr/README.md`。

## 5. 注意事項

- 測試錄音與 gold 逐字稿**不要進版控**：放在 `eval/datasets/`，並加入 `.gitignore`。
- 遵守 ADR-0003：
  - 錄音需取得同意。
  - 不做情緒分析。
  - 不建立聲紋。
- 安裝 Homebrew 套件或下載大型模型（數 GB）前，先告知使用者。
