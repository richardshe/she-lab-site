-- Spot the Bot - D1 Database Schema
-- This schema stores votes and allows for statistical analysis

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  guess TEXT NOT NULL CHECK(guess IN ('human', 'bot')),
  section TEXT NOT NULL,
  truth_source TEXT NOT NULL CHECK(truth_source IN ('human', 'chatgpt', 'claude', 'gemini')),
  client_id TEXT NOT NULL,
  time_ms INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_item_id ON votes(item_id);
CREATE INDEX IF NOT EXISTS idx_votes_client_id ON votes(client_id);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp);
CREATE INDEX IF NOT EXISTS idx_votes_truth_source ON votes(truth_source);
CREATE INDEX IF NOT EXISTS idx_votes_client_item ON votes(client_id, item_id, timestamp);

-- Optional: Create a view for quick statistics
CREATE VIEW IF NOT EXISTS vote_stats AS
SELECT
  item_id,
  truth_source,
  COUNT(*) as total_votes,
  SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) as bot_guesses,
  SUM(CASE WHEN guess = 'human' THEN 1 ELSE 0 END) as human_guesses,
  ROUND(100.0 * SUM(CASE WHEN guess = 'bot' THEN 1 ELSE 0 END) / COUNT(*), 2) as bot_percent
FROM votes
GROUP BY item_id, truth_source;
