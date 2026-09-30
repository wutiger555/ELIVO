# services/realtime：ELIVO 即時服務

擷取（麥克風、系統音訊）→ VAD → ASR（whisper.cpp＋Breeze-ASR-25）→ 會中持續修正的會議記錄 → SQLite，並以 HTTP／WebSocket 提供給 `apps/web`。
ASR 與會議記錄的實驗過程與數據在 [`spikes/asr-realtime/`](../../spikes/asr-realtime/)。

## 啟動

在 Finder 雙擊 repo 根目錄的 `ELIVO.command`，或在終端機：

```bash
bin/elivo            # 啟動並打開瀏覽器（前端、systap 有改會自動重新建置；已經在跑就直接打開）
bin/elivo demo       # 不用開口：播放 6 分鐘合成會議（兩條音軌）
bin/elivo restart    # 改了後端程式之後
bin/elivo stop
bin/elivo logs       # 服務記錄在 ~/ELIVO-data/logs/service.log
```

第一次安裝：`~/.venvs/elivo-asr/bin/pip install -r requirements.txt`，前端 `cd apps/web && npm install`。

模型放在 `~/.cache/whisper.cpp/`（見 spike 的 README），LLM 金鑰放在 macOS 鑰匙圈（`elivo-ica-api-key`）。

## 資料

- 全部在 `~/ELIVO-data/`（不在 repo、不在雲端同步資料夾）：
  - `elivo.db`：SQLite（WAL），Space／Series／會議／標籤／逐字稿／暫停區間／會議記錄。
  - `spool/`：會議中的音訊暫存。正常結束時刪除；該場選擇保存時轉成 `audio/*.flac`；意外中斷時保留。
- 逐字稿每句定稿、會議記錄每次變更都立即寫入：關掉瀏覽器不影響收音，當機最多損失最後幾秒。
- Ephemeral 模式：逐字稿與音訊不落地，會後只保存確認過的決策與待辦。

## 帳本與主動提示

- **決策帳本**（`GET /api/spaces/{id}/ledger`）：同一個 Space 裡「會後確認過」的決策、待辦、問題、數字。
  資料仍存在各場會議的記錄裡，帳本只是彙整，所以在任何地方修改都會一致。可搜尋、篩選、改狀態、跳回原句。
  例行會議的會前簡報會帶上更早場次還沒完成的待辦與未答問題。
- **主動提示**（`elivo/surfacing.py`）：只在一句說完或會議記錄更新時檢查，除了「與上次決策不同」之外都在本機判斷，不花 LLM 費用。

  | 卡片 | 何時出現 |
  |---|---|
  | 前面提過 | 這句和本場 1 分鐘以前的內容相關 |
  | 上次 | 這句和同一個 Space 帳本裡的有效項目相關 |
  | 與上次不同（數字） | 數字和帳本裡同一項差超過 10% |
  | 與上次決策不同 | 新決策和帳本裡相近的舊決策不同（本機先篩，再請 fast 模型判斷一次） |
  | 還沒回答／還沒有負責人 | 問題 3 分鐘後沒回答且話題已轉走；待辦 3 分鐘後還沒有負責人 |

  醒目卡片（數字、決策不同）每 2 分鐘最多 1 張、每小時最多 8 張，超過就安靜列出。永遠不發聲。

## 會議生命週期

`draft →（開始）live ⇄ paused →（結束）ending → ended →（確認）confirmed`；
上次收音中被中斷的會議在服務啟動時標為 `interrupted`，可以繼續或結束。同一時間只允許一場會議收音。

## 存取規則

- `/api/*`、`/ws/meetings/*`、`/ws/meter` 只接受本機連線。
- 第二螢幕（iPad／手機）掃描 QR code：網址帶一次性配對碼，只能唯讀看配對的那一場；配對 12 小時後失效，可隨時撤銷。

## 測試

```bash
~/.venvs/elivo-asr/bin/python -m pytest -q     # 用假的 ASR 與 LLM；需要 ~/ELIVO-data 的合成測試音檔
```
