# ADR-0005：Decision Ledger 先用 Postgres 關聯表（KG-lite）

- **狀態**：Accepted（2026-09-29）

## 背景
原計劃提到 Knowledge Graph / dynamic context graph。Temporal KG（Zep / Graphiti）適合「決策 X 被 Y 取代」這類時間有效性問題，但會增加系統複雜度與延遲不確定性。

## 決策
以 Postgres 表格實作：`entities`（含 aliases）、`decisions`（`valid_from` / `valid_to` / `superseded_by` / evidence）、`facts`（key / value / unit / as_of）、`action_items`、`entity_mentions`。只有在多跳查詢被證明必要時才導入 Graphiti 類 temporal KG。

## 後果
- ✅ 「與 8/12 決策衝突」「數字差 18%」成為可測試的查詢，而非 LLM 自由發揮。
- ✅ 單一資料庫、權限模型一致、易於刪除連動。
- ⚠️ 複雜關係推理能力有限（Phase 3 再評估）。
