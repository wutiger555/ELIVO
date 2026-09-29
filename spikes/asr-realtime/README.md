# Spike：即時中英混說 ASR（本地 Mac）

對應 [`docs/08-handoff-local-dev.md`](../../docs/08-handoff-local-dev.md) §4。結果寫在 [`RESULTS.md`](RESULTS.md)。

## 環境

- 引擎：whisper.cpp 1.9.4（brew `whisper-cpp`，Metal），透過 `whisper-server` 常駐載入模型。
- 模型與測試資料**不放 repo**（repo 位於 Box 同步資料夾）：
  - 模型：`ELIVO_MODEL_DIR`，預設 `~/.cache/whisper.cpp/`
  - 測試資料與執行結果：`ELIVO_DATA_DIR`，預設 `~/ELIVO-data/`

```bash
brew install whisper-cpp macmon ffmpeg
python3.12 -m venv ~/.venvs/elivo-asr
~/.venvs/elivo-asr/bin/pip install -r requirements.txt
```

模型（放到 `~/.cache/whisper.cpp/`）：

| 檔案 | 來源 | 大小 |
|---|---|---|
| `ggml-breeze-asr-25-q8_0.bin` | [`tsuzuri-app/Breeze-ASR-25-ggml`](https://huggingface.co/tsuzuri-app/Breeze-ASR-25-ggml) | 1.66 GB |
| `ggml-breeze-asr-25-q5_0.bin` | 同上 | 1.08 GB |
| `ggml-large-v3-turbo.bin`（對照組） | [`ggerganov/whisper.cpp`](https://huggingface.co/ggerganov/whisper.cpp) | 1.62 GB |
| `silero_vad.onnx`（即時 demo 的 VAD） | [`snakers4/silero-vad`](https://github.com/snakers4/silero-vad) | 2.3 MB |

下載後請比對 Hugging Face 上的 SHA256。

## 測試資料

```text
~/ELIVO-data/eval/datasets/
  glossary.txt          # 術語表，一行一個（選用）
  meeting01.m4a         # 任何 ffmpeg 讀得到的格式
  meeting01.ref.txt     # 人工校對逐字稿（選用；有才算 MER）
```

- **錄音須取得所有與會者同意**（ADR-0003）；不做情緒分析、不建立聲紋。
- gold 逐字稿數字一律寫阿拉伯數字（「820 萬」），否則 MER 會把寫法差異算成錯誤。
- 沒有 gold 時：先跑一次，把 `runs/.../<檔名>.breeze-q8.txt` 人工修正後存成 `.ref.txt`。

## Step A：離線基準

```bash
cd spikes/asr-realtime
~/.venvs/elivo-asr/bin/python bench_offline.py                      # 全部模型 × 全部音檔
~/.venvs/elivo-asr/bin/python bench_offline.py --models breeze-q8 --files meeting01
```

輸出在 `~/ELIVO-data/runs/bench-<時間>/`：`results.md`（比較表）、`results.json`、各模型逐字稿。

量測項目：

- **RTF**：整段轉寫時間 ÷ 音訊長度。
- **視窗延遲**：3／5／10／15／20 秒視窗各取樣數次的 p50／p95，這才是即時模式的瓶頸（Whisper 每次都把輸入補到 30 秒）。
- **MER** 與術語召回率。
- whisper-server 的 CPU 與 RSS，以及 CPU／GPU 溫度與功耗（macmon）。

跑之前請關掉其他吃資源的程式；Box／OneDrive 同步（`fileproviderd`）也會影響數字。
