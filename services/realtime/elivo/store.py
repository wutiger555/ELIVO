"""會議資料庫（SQLite，本機 ~/ELIVO-data/elivo.db）。

組織方式：Space（客戶／專案）→ Series（例行會議，可選）→ Meeting；另有自由標籤。
- 逐字稿每一句、會議記錄每一次變更都立即寫入，意外中斷最多損失最後幾秒。
- Ephemeral 模式的會議不寫入逐字稿，只在確認後保存決策與待辦（見 session.py）。
- 刪除 Space 時，底下的 Series 一起刪除，會議保留但不再歸屬（space_id／series_id 設為 NULL）。
"""
import json
import secrets
import sqlite3
import threading
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  glossary TEXT NOT NULL DEFAULT '',
  created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  space_id TEXT REFERENCES spaces(id) ON DELETE SET NULL,
  series_id TEXT REFERENCES series(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,             -- draft / live / paused / ending / ended / confirmed / interrupted
  mode TEXT NOT NULL DEFAULT 'standard',   -- standard / ephemeral
  keep_audio INTEGER NOT NULL DEFAULT 0,
  glossary TEXT NOT NULL DEFAULT '',
  sources TEXT NOT NULL DEFAULT '[]',      -- [{"speaker": "我", "device": ...}]
  created_at REAL NOT NULL,
  started_at REAL,
  ended_at REAL,
  duration_s REAL NOT NULL DEFAULT 0,      -- 實際收音時間（不含暫停）
  minutes TEXT,                            -- MinutesEngine.export() 的 JSON
  stats TEXT
);
CREATE TABLE IF NOT EXISTS meeting_tags (
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (meeting_id, tag)
);
CREATE TABLE IF NOT EXISTS utterances (
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  speaker TEXT NOT NULL,
  t REAL NOT NULL,
  text TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (meeting_id, id)
);
CREATE TABLE IF NOT EXISTS pauses (
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  start_t REAL NOT NULL,
  end_t REAL
);
CREATE INDEX IF NOT EXISTS meetings_space ON meetings(space_id, created_at);
CREATE INDEX IF NOT EXISTS meetings_series ON meetings(series_id, created_at);
"""

MEETING_FIELDS = ("title", "space_id", "series_id", "mode", "keep_audio", "glossary", "sources", "status",
                  "started_at", "ended_at", "duration_s", "minutes", "stats")
JSON_FIELDS = ("sources", "minutes", "stats")


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(5)}"


class Store:
    def __init__(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")    # 當機時已寫入的資料不會損毀
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(SCHEMA)
        self.lock = threading.Lock()

    def _q(self, sql, args=()):
        with self.lock:
            return self.db.execute(sql, args).fetchall()

    def _x(self, sql, args=()):
        with self.lock:
            self.db.execute(sql, args)

    # ---- Space ----

    def spaces(self) -> list[dict]:
        spaces = [dict(r) for r in self._q("SELECT * FROM spaces ORDER BY created_at")]
        series = [dict(r) for r in self._q("SELECT * FROM series ORDER BY created_at")]
        counts = {r["space_id"]: r["n"] for r in self._q("SELECT space_id, COUNT(*) n FROM meetings GROUP BY space_id")}
        scounts = {r["series_id"]: r["n"] for r in self._q("SELECT series_id, COUNT(*) n FROM meetings GROUP BY series_id")}
        for s in spaces:
            s["meeting_count"] = counts.get(s["id"], 0)
            s["series"] = [{**x, "meeting_count": scounts.get(x["id"], 0)} for x in series if x["space_id"] == s["id"]]
        return spaces

    def space(self, space_id: str) -> dict | None:
        r = self._q("SELECT * FROM spaces WHERE id=?", (space_id,))
        return dict(r[0]) if r else None

    def create_space(self, name: str, glossary: str = "") -> dict:
        sid = new_id("sp")
        self._x("INSERT INTO spaces(id, name, glossary, created_at) VALUES (?,?,?,?)", (sid, name, glossary, time.time()))
        return self.space(sid)

    def update_space(self, space_id: str, **fields) -> dict | None:
        for k in ("name", "glossary"):
            if k in fields:
                self._x(f"UPDATE spaces SET {k}=? WHERE id=?", (fields[k], space_id))
        return self.space(space_id)

    def delete_space(self, space_id: str):
        self._x("DELETE FROM spaces WHERE id=?", (space_id,))

    # ---- Series ----

    def series(self, series_id: str) -> dict | None:
        r = self._q("SELECT * FROM series WHERE id=?", (series_id,))
        return dict(r[0]) if r else None

    def create_series(self, space_id: str, name: str) -> dict:
        sid = new_id("sr")
        self._x("INSERT INTO series(id, space_id, name, created_at) VALUES (?,?,?,?)", (sid, space_id, name, time.time()))
        return self.series(sid)

    def update_series(self, series_id: str, name: str) -> dict | None:
        self._x("UPDATE series SET name=? WHERE id=?", (name, series_id))
        return self.series(series_id)

    def delete_series(self, series_id: str):
        self._x("DELETE FROM series WHERE id=?", (series_id,))

    # ---- Meeting ----

    def _meeting_row(self, r) -> dict:
        m = dict(r)
        for k in JSON_FIELDS:
            m[k] = json.loads(m[k]) if m[k] else None
        m["keep_audio"] = bool(m["keep_audio"])
        m["tags"] = [x["tag"] for x in self._q("SELECT tag FROM meeting_tags WHERE meeting_id=? ORDER BY tag", (m["id"],))]
        return m

    def meeting(self, meeting_id: str) -> dict | None:
        r = self._q("SELECT * FROM meetings WHERE id=?", (meeting_id,))
        return self._meeting_row(r[0]) if r else None

    def meetings(self, space_id=None, series_id=None, tag=None, q=None, status=None) -> list[dict]:
        sql, args = "SELECT m.* FROM meetings m", []
        where = []
        if tag:
            sql += " JOIN meeting_tags t ON t.meeting_id = m.id AND t.tag = ?"
            args.append(tag)
        if space_id:
            where.append("m.space_id = ?"); args.append(space_id)
        if series_id:
            where.append("m.series_id = ?"); args.append(series_id)
        if status:
            where.append("m.status = ?"); args.append(status)
        if q:
            # 標題或逐字稿內容
            where.append("(m.title LIKE ? OR EXISTS (SELECT 1 FROM utterances u WHERE u.meeting_id = m.id AND u.deleted = 0 AND u.text LIKE ?))")
            args += [f"%{q}%", f"%{q}%"]
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY COALESCE(m.started_at, m.created_at) DESC"
        return [self._meeting_row(r) for r in self._q(sql, args)]

    def create_meeting(self, title: str, space_id=None, series_id=None, mode="standard", keep_audio=False,
                       glossary="", sources=None, tags=()) -> dict:
        mid = new_id("m")
        self._x(
            "INSERT INTO meetings(id, space_id, series_id, title, status, mode, keep_audio, glossary, sources, created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?)",
            (mid, space_id, series_id, title, "draft", mode, int(keep_audio), glossary, json.dumps(sources or [], ensure_ascii=False), time.time()),
        )
        self.set_tags(mid, tags)
        return self.meeting(mid)

    def update_meeting(self, meeting_id: str, **fields) -> dict | None:
        for k, v in fields.items():
            if k == "tags":
                self.set_tags(meeting_id, v)
                continue
            if k not in MEETING_FIELDS:
                raise ValueError(f"不能修改欄位 {k}")
            if k in JSON_FIELDS and v is not None:
                v = json.dumps(v, ensure_ascii=False)
            if k == "keep_audio":
                v = int(v)
            self._x(f"UPDATE meetings SET {k}=? WHERE id=?", (v, meeting_id))
        return self.meeting(meeting_id)

    def set_tags(self, meeting_id: str, tags):
        self._x("DELETE FROM meeting_tags WHERE meeting_id=?", (meeting_id,))
        for t in dict.fromkeys(t.strip().lstrip("#") for t in tags if t.strip()):
            self._x("INSERT INTO meeting_tags(meeting_id, tag) VALUES (?,?)", (meeting_id, t))

    def tags(self) -> list[dict]:
        return [dict(r) for r in self._q("SELECT tag, COUNT(*) n FROM meeting_tags GROUP BY tag ORDER BY n DESC, tag")]

    def delete_meeting(self, meeting_id: str):
        self._x("DELETE FROM meetings WHERE id=?", (meeting_id,))

    def last_in_series(self, series_id: str, before_id: str | None = None) -> dict | None:
        """同一個 Series 裡最近一場已結束的會議（會前簡報用）。"""
        rows = self._q(
            "SELECT * FROM meetings WHERE series_id=? AND status IN ('ended','confirmed') AND id != ? ORDER BY started_at DESC LIMIT 1",
            (series_id, before_id or ""),
        )
        return self._meeting_row(rows[0]) if rows else None

    # ---- 逐字稿與暫停 ----

    def upsert_utterance(self, meeting_id: str, uid: str, speaker: str, t: float, text: str):
        self._x(
            "INSERT INTO utterances(meeting_id, id, speaker, t, text) VALUES (?,?,?,?,?)"
            " ON CONFLICT(meeting_id, id) DO UPDATE SET text=excluded.text",
            (meeting_id, uid, speaker, t, text),
        )

    def utterances(self, meeting_id: str, include_deleted=False) -> list[dict]:
        sql = "SELECT id, speaker, t, text, deleted FROM utterances WHERE meeting_id=?"
        if not include_deleted:
            sql += " AND deleted=0"
        return [dict(r) for r in self._q(sql + " ORDER BY t, rowid", (meeting_id,))]

    def delete_utterances(self, meeting_id: str):
        self._x("DELETE FROM utterances WHERE meeting_id=?", (meeting_id,))

    def add_pause(self, meeting_id: str, start_t: float):
        self._x("INSERT INTO pauses(meeting_id, start_t) VALUES (?,?)", (meeting_id, start_t))

    def end_pause(self, meeting_id: str, end_t: float):
        self._x("UPDATE pauses SET end_t=? WHERE meeting_id=? AND end_t IS NULL", (end_t, meeting_id))

    def pauses(self, meeting_id: str) -> list[dict]:
        return [dict(r) for r in self._q("SELECT start_t, end_t FROM pauses WHERE meeting_id=? ORDER BY start_t", (meeting_id,))]

    def mark_interrupted(self) -> list[str]:
        """服務啟動時：上次收音中或整理中被中斷的會議標為 interrupted，讓使用者決定繼續或結束。
        已暫停的會議維持 paused（服務正常關閉時會先暫停進行中的會議）。"""
        rows = self._q("SELECT id FROM meetings WHERE status IN ('live','ending')")
        for r in rows:
            self._x("UPDATE meetings SET status='interrupted' WHERE id=?", (r["id"],))
        return [r["id"] for r in rows]
