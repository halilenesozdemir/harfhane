-- Harfhane baseline schema (2026-10-04). Replaces the legacy migration history.

CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  length INTEGER NOT NULL,
  meaning TEXT NOT NULL DEFAULT '',
  context TEXT NOT NULL DEFAULT '',
  category TEXT CHECK (category IS NULL OR category IN ('isim', 'sıfat', 'fiil')),
  source TEXT NOT NULL,
  license TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  family_safe INTEGER NOT NULL DEFAULT 0 CHECK (family_safe IN (0, 1)),
  approved_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (length = length(word)),
  CHECK (is_active = 0 OR source = 'user' OR (status = 'approved' AND family_safe = 1))
);
CREATE INDEX idx_words_length_active ON words (length, is_active);
CREATE INDEX idx_words_status ON words (status);

CREATE TABLE valid_words (
  word TEXT NOT NULL PRIMARY KEY,
  length INTEGER NOT NULL,
  source TEXT NOT NULL,
  license TEXT NOT NULL
);
CREATE INDEX idx_valid_words_length ON valid_words (length);

CREATE TABLE daily_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words (id) ON DELETE RESTRICT,
  date TEXT NOT NULL,
  length INTEGER NOT NULL DEFAULT 5,
  UNIQUE (date, length)
);
CREATE INDEX idx_daily_words_date_length ON daily_words (date, length);

CREATE TRIGGER daily_words_require_active_word
BEFORE INSERT ON daily_words
WHEN NOT EXISTS (
  SELECT 1 FROM words
  WHERE id = NEW.word_id AND is_active = 1 AND status = 'approved' AND family_safe = 1
)
BEGIN
  SELECT RAISE(ABORT, 'daily word must be an approved, family-safe, active word');
END;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  google_id TEXT,
  email_notifications INTEGER NOT NULL DEFAULT 1,
  freeze_tokens INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;

CREATE TABLE word_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  word_length INTEGER NOT NULL DEFAULT 5,
  is_public INTEGER DEFAULT 0,
  has_daily INTEGER NOT NULL DEFAULT 0,
  owner_user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_word_lists_owner ON word_lists (owner_user_id);

CREATE TABLE word_list_words (
  list_id INTEGER NOT NULL REFERENCES word_lists (id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words (id) ON DELETE RESTRICT,
  PRIMARY KEY (list_id, word_id)
);
CREATE INDEX idx_word_list_words_list ON word_list_words (list_id);

CREATE TABLE list_likes (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  list_id INTEGER NOT NULL REFERENCES word_lists (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, list_id)
);
CREATE INDEX idx_list_likes_list ON list_likes (list_id);

CREATE TABLE list_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  list_id INTEGER NOT NULL REFERENCES word_lists (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_list_comments_list ON list_comments (list_id);

CREATE TABLE game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  word_length INTEGER NOT NULL,
  guesses INTEGER NOT NULL,
  won INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'daily',
  word_id INTEGER REFERENCES words (id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, date, word_length)
);
CREATE INDEX idx_results_user ON game_results (user_id);
CREATE INDEX idx_results_date ON game_results (date);

CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE user_xp (
  user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_badges (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges (id),
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);
CREATE INDEX idx_user_badges_user ON user_badges (user_id);

CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions (user_id);

CREATE TABLE streak_freezes (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  frozen_date TEXT NOT NULL,
  PRIMARY KEY (user_id, frozen_date)
);

CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);

CREATE TABLE tournament_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words (id) ON DELETE RESTRICT,
  word_length INTEGER NOT NULL,
  guesses INTEGER NOT NULL,
  won INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tournament_user ON tournament_results (user_id);
CREATE INDEX idx_tournament_played_at ON tournament_results (played_at);

CREATE TABLE duels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words (id) ON DELETE RESTRICT,
  challenger_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenger_guesses INTEGER NOT NULL,
  challenger_won INTEGER NOT NULL DEFAULT 0,
  opponent_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  opponent_guesses INTEGER,
  opponent_won INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (word_id, challenger_id)
);
