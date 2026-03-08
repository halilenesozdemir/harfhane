-- Faz 2: Custom word lists with slug-based sharing

CREATE TABLE word_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  word_length INTEGER NOT NULL DEFAULT 5,
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE word_list_words (
  list_id INTEGER NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
  PRIMARY KEY (list_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_word_lists_slug ON word_lists(slug);
CREATE INDEX IF NOT EXISTS idx_word_list_words_list ON word_list_words(list_id);
