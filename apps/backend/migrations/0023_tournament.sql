CREATE TABLE IF NOT EXISTS tournament_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
  word_length INTEGER NOT NULL,
  guesses INTEGER NOT NULL,
  won INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tournament_user ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_played_at ON tournament_results(played_at);
