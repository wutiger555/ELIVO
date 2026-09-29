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

## Step B：即時麥克風 demo

```bash
~/.venvs/elivo-asr/bin/python stream_demo.py --list-devices          # 查裝置編號
~/.venvs/elivo-asr/bin/python stream_demo.py                         # 預設麥克風、Breeze q8
~/.venvs/elivo-asr/bin/python stream_demo.py --model turbo --mic-device 0
~/.venvs/elivo-asr/bin/python stream_demo.py --replay ~/ELIVO-data/eval/datasets/meeting01.m4a --once   # 用錄音重播，量延遲
```

- 開 `http://localhost:8765`；同一個 Wi-Fi 的 iPad 開終端機印出的 `http://<區網 IP>:8765`。
  - 第一次會跳出 macOS 防火牆「允許傳入連線」，要按允許 iPad 才連得到。
  - 第一次用麥克風要允許終端機存取麥克風（系統設定 › 隱私權與安全性 › 麥克風）。
- 介面套用 `design/` 的 ELIVO 設計系統（深色液態玻璃、Ion 強調色、Geist＋Noto Sans TC），由 demo server 直接提供 `/design/*`。
  - 正在說的那一句放大（30px），定稿後縮回歷史大小（18px）；新確認的字逐字浮現，暫定字為灰色，行尾 Ion 游標表示還在聽。
  - 右欄依類型分組（決策／待辦／未回答問題／數字），新出現的項目短暫發光；每項附原文出處。
  - 系統開啟「減少動態效果」時自動關閉動畫。
- 流程：麥克風 → Silero VAD（切語句）→ 每 0.5 秒把整句重送 ASR → LocalAgreement-2（連續兩次一致才確定）→ 靜音 0.6 秒後整句重跑一次定稿。
- 每次執行的延遲紀錄寫在 `~/ELIVO-data/runs/stream-*.jsonl`：
  - 首字延遲：開口 → 第一次出現文字
  - 定稿延遲：停止說話 → 整句定稿
  - 每次推論時間
- 可調參數：`--step`、`--min-silence`、`--max-utt`、`--prompt`（術語）。
- 雜音幻覺過濾：Whisper 自評信心 `avg_logprob < -1.0`，或 `no_speech_prob > 0.5` 且信心 `< -0.5` 的 segment 丟掉；整句能量低於 0.0015 也丟掉。
  - 不用音量當主要條件：原音縮到 3% 仍能正確辨識。
  - 被丟掉的文字記在 `stream-*.jsonl` 的 `dropped`，方便調門檻。

## Step C：系統音訊（Core Audio process tap）

不裝 BlackHole：`systap/` 是一個 Swift 小工具，用 macOS 14.2+ 的 Core Audio process tap 擷取所有系統輸出，轉成 16 kHz mono 寫到 stdout。

```bash
systap/build.sh                                                      # 需要 Xcode Command Line Tools
~/.venvs/elivo-asr/bin/python stream_demo.py --system-device systap  # 麥克風＝我、系統音訊＝他人
```

- 第一次執行，macOS 會對啟動它的 App（終端機）詢問「系統錄音」權限。
  - 權限在：系統設定 › 隱私權與安全性 › 螢幕與系統錄音。
  - 沒有權限時 tap 仍會啟動，但只收到靜音；前 10 秒完全沒聲音時，systap 會提醒一次。
- **請戴耳機**：用喇叭時麥克風會收到對方的聲音，同一句話會以「我」和「他人」各出現一次。正式版要用 `AVAudioEngine` voice processing（AEC）解決。
- 兩路共用一個 whisper-server，同時說話時推論要排隊，延遲會變長。
- 也可以給一般輸入裝置，例如 `--system-device "BlackHole 2ch"`。
- 測試用：`--replay-system <音檔>` 以音檔代替系統音訊。

## 階段二：會中持續修正的會議記錄（Live Minutes）

```bash
~/.venvs/elivo-asr/bin/python stream_demo.py --system-device systap --minutes --glossary 術語表.txt
~/.venvs/elivo-asr/bin/python llm.py --list-ica-models     # 列出 ICA 可用模型
```

- 記錄是一份**有版本的狀態**（`minutes.py`）：決策、待辦、問題、數字各有固定 id（D1、A2…）與狀態；被取代、回答、換負責人時改狀態，不刪除，每次變更寫入 history（時間、依據句子、fast／reflect、理由）。
- **fast**（預設 `claude-haiku-4-5`，每 12 秒、有新句子才跑）只輸出操作 add／update／supersede／resolve／retract，由程式套用。
- **reflect**（預設 `claude-sonnet-4-6`，每 150 秒）重讀全文，輸出修正後的完整記錄與分主題摘要，程式比對差異寫入 history。
  - 整理開始前先讓 fast 追上所有句子，整理期間 fast 只處理之後的新句子，避免兩邊重複新增。
  - 整理期間被 fast 改過的項目不會被覆蓋。
  - 模型額度用完（ICA Frontier Models）時自動改用 fast 的模型。
- `--glossary`：術語表同時給 Whisper（initial prompt）與 LLM（只校正發音明顯相近的錯字）。
- 會議結束（重播完或 Ctrl-C）時跑最後一次整理，輸出 `~/ELIVO-data/runs/minutes-*.md` 與 `.json`。
- 網頁右欄：摘要、決策、待辦、問題、數字；被取代的項目劃線變淡並註明改為哪一項；更新的項目發光並顯示最近一次變更；點時間碼跳回逐字稿；點項目展開修改紀錄。
- LLM 供應商在 `llm.py`（ADR-0002）：`ica`（IBM Consulting Advantage，schema 放 prompt、Pydantic 驗證）或 `anthropic`（structured outputs）。金鑰從鑰匙圈讀取。
- 依 ADR-0003：prompt 明確禁止判斷情緒、態度或參與度。逐字稿會送到雲端 LLM，錄音同意書要涵蓋這一點。

### 驗證：中途推翻決議的合成會議

```bash
~/.venvs/elivo-asr/bin/python synth_meeting.py meeting-reversal          # 產生「我／他人」兩軌
D=~/ELIVO-data/eval/datasets/synthetic
~/.venvs/elivo-asr/bin/python stream_demo.py --minutes --once --reflect-interval 45 \
  --glossary fixtures/meeting-reversal.glossary.txt \
  --replay $D/meeting-reversal-me.wav --replay-system $D/meeting-reversal-other.wav
~/.venvs/elivo-asr/bin/python eval_minutes.py meeting-reversal           # 對照 fixtures/*.expect.json
```
