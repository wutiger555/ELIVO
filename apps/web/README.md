# apps/web：ELIVO 網頁介面

React＋TypeScript＋Vite，元件與 tokens 直接用 [`design/`](../../design/)（ELIVO 設計系統）。資料來自 [`services/realtime`](../../services/realtime/)。

```bash
npm install
npm run dev      # http://localhost:5173，API／WebSocket 轉給 localhost:8765
npm run build    # 輸出 dist/，由 services/realtime 在 http://localhost:8765 直接提供（第二螢幕也用這個）
```

## 畫面

| 路徑 | 畫面 |
|---|---|
| `#/` | 會議庫：Space → 例行會議、標籤、搜尋（標題與逐字稿）、未正常結束的會議提醒；Space／例行會議的改名、術語表、刪除 |
| `#/new` | 新會議：名稱、分類、音源與音量測試、標準／Ephemeral、是否保存錄音、術語表、告知文字、會前簡報（例行會議上一場的決策與待辦） |
| `#/m/:id` | 會議：尚未開始 → 開始；收音中／暫停 → 即時逐字稿＋會議記錄、暫停／繼續／結束、第二螢幕 QR code；整理中；待確認 → 30 秒確認；已確認 → 會後檢視、匯出 Markdown、刪除。會中與會後都能：修正或刪除逐字稿句子、新增／編輯／刪除記錄項目、修改會議名稱／分類／標籤 |
| `#/view/:token` | 第二螢幕（手機／iPad 掃 QR code）：唯讀，只看配對的那一場 |
