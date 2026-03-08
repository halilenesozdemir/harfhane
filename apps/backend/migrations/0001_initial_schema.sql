-- Faz 1: Initial schema

CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK(category IN ('isim', 'sıfat', 'fiil')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
  date TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_active ON words(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_words_date ON daily_words(date);
