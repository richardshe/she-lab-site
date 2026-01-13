CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  session_id TEXT,
  guess TEXT NOT NULL,
  section TEXT NOT NULL,
  truth_source TEXT NOT NULL,
  country TEXT,
  colo TEXT,
  guess TEXT NOT NULL,
  section TEXT NOT NULL,
  truth_source TEXT NOT NULL,
  time_ms INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_votes_item_client ON votes (item_id, client_id);
CREATE INDEX IF NOT EXISTS idx_votes_truth_source ON votes (truth_source);
