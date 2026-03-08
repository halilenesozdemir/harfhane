-- Faz 2: Variable word length support

-- Add length column to words (auto-populated from word text)
ALTER TABLE words ADD COLUMN length INTEGER NOT NULL DEFAULT 5;
UPDATE words SET length = LENGTH(word);
CREATE INDEX IF NOT EXISTS idx_words_length ON words(length, is_active);

-- Recreate daily_words with (date, length) unique constraint
-- SQLite does not support DROP CONSTRAINT, so we recreate the table
PRAGMA foreign_keys=OFF;

CREATE TABLE daily_words_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
  date TEXT NOT NULL,
  length INTEGER NOT NULL DEFAULT 5,
  UNIQUE(date, length)
);

INSERT INTO daily_words_new (id, word_id, date, length)
  SELECT dw.id, dw.word_id, dw.date, w.length
  FROM daily_words dw
  JOIN words w ON w.id = dw.word_id;

DROP TABLE daily_words;
ALTER TABLE daily_words_new RENAME TO daily_words;

CREATE INDEX IF NOT EXISTS idx_daily_words_date ON daily_words(date);
CREATE INDEX IF NOT EXISTS idx_daily_words_date_length ON daily_words(date, length);

PRAGMA foreign_keys=ON;
