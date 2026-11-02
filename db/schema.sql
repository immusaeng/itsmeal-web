CREATE TABLE IF NOT EXISTS inquiries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org        TEXT NOT NULL,
  name       TEXT,
  phone      TEXT NOT NULL,
  size       TEXT,
  memo       TEXT,
  ip_hash    TEXT,
  mail_sent  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiries_ip_created ON inquiries (ip_hash, created_at);
