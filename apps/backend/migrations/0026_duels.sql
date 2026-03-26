CREATE TABLE IF NOT EXISTS duels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
  challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenger_guesses INTEGER NOT NULL,
  challenger_won INTEGER NOT NULL DEFAULT 0,
  opponent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  opponent_guesses INTEGER,
  opponent_won INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(word_id, challenger_id)
);
