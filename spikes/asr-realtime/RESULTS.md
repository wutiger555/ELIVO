# ASR 即時辨識 Spike 結果

> 狀態：進行中（2026-09-29）。真實會議錄音的基準尚未跑，下表只有合成音檔。

## 1. 測試環境

| 項目 | 值 |
|---|---|
| 機型 | MacBook Pro 14"（MacBookPro18,1） |
| 晶片 | Apple M1 Pro：10 核 CPU（8P＋2E）、16 核 GPU |
| 記憶體 | 16 GB（測試時系統已用約 14 GB、swap 約 2.8 GB） |
| macOS | 26.6.2 |
| 引擎 | whisper.cpp 1.9.4（brew，Metal，flash attention），`whisper-server` 常駐 |
| 背景負載 | `fileproviderd`（Box 同步）約 100% CPU、CrowdStrike 約 25% CPU：數字偏保守 |

## 2. 模型來源驗證（Hugging Face，2026-09-29）

| Repo | 結果 |
|---|---|
| `MediaTek-Research/Breeze-ASR-25` | ✅ 官方，Apache-2.0，不需申請存取 |
| `tsuzuri-app/Breeze-ASR-25-ggml` | ✅ 可用。2026-09-28 上傳，下載數仍為 0，但：SHA256 與官方 large-v2 不同（不是改名）；[轉檔腳本](https://github.com/elct9620/tsuzuri/blob/main/scripts/breeze.sh)以 SHA256 鎖定官方 `breeze-asr-25.pt`，可重現；ggml 為純權重格式 |
| `fredchu/breeze-asr-25-whisperkit-coreml` | ✅ 存在，但只有 4-bit palettized（約 1.05 GB），品質待測 |
| `eoleedi/Breeze-ASR-25-mlx` | ✅ 存在（MLX fp16，3.1 GB），未測 |
| `MediaTek-Research/Breeze-ASR-26` | ⚠️ 是**台語** ASR（輸出華語字），不是中英混說後繼版，不適用 |

## 3. 已確認的技術發現

1. **縮小 `audio_ctx` 不可行。** 把 encoder context 依視窗長度縮小（例如 5 秒 → 314）可讓延遲降到 0.2 秒，但 Breeze 與 large-v3-turbo 都輸出亂碼（「of of of…」）。只能用完整 30 秒 context。
2. **whisper-server 要加 `--no-language-probabilities`。** `verbose_json` 預設會另算語言機率，多跑一次 encoder；關掉後視窗延遲從約 1.9 秒降到約 1.1 秒。
3. **q5_0 沒有比 q8_0 快**（Metal 上反量化有成本，慢約 5–10%），只省約 0.6 GB 記憶體。主力用 q8_0。
4. **每次推論有約 1 秒的固定成本**（Breeze q8，3 秒視窗），視窗拉長到 15 秒約 1.7 秒。large-v3-turbo 約 0.75–1.0 秒。
5. Breeze 直接輸出正體中文、數字轉成阿拉伯數字，但**沒有標點**；large-v3-turbo 輸出**簡體**，需經 OpenCC `s2twp`。

## 4. 合成音檔初測（macOS TTS「美佳」，19 秒，僅用於驗證管線）

TTS 發音乾淨、無噪音，MER 不代表真實會議品質；延遲與 RTF 可作參考。

| 模型 | RTF | 3s 視窗 p50 | 5s 視窗 p50 | 10s 視窗 p50 | 15s 視窗 p50 | MER | 術語召回 | RSS |
|---|---|---|---|---|---|---|---|---|
| Breeze q8_0 | 0.102 | 1.07s | 1.12s | 1.39s | 1.69s | 3.7% | 80% | 2.1 GB |
| Breeze q5_0 | 0.107 | 1.19s | 1.24s | 1.50s | 1.75s | 3.7% | 80% | 1.6 GB |
| large-v3-turbo | 0.052 | 0.76s | 0.79s | 0.90s | 0.99s | 3.7% | 100% | 1.9 GB |

Breeze 把「kickoff」辨識成「kick off」，因此術語召回為 80%。

## 5. 待辦

- [ ] 真實中英混說會議錄音（取得同意，3–10 分鐘 × 1–3 段）＋ gold 逐字稿 → Step A 正式數字
- [ ] Step B 即時 demo 的實際首字／確定字延遲
- [ ] Step C 系統音訊
