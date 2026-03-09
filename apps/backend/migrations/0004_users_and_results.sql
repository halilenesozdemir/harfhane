-- Faz 3: Kullanıcı hesapları ve oyun sonuçları

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  word_length INTEGER NOT NULL,
  guesses INTEGER NOT NULL,  -- 0 = kaybedildi, 1-6 = kaç hamlede kazanıldı
  won INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date, word_length)
);

CREATE INDEX idx_results_user ON game_results(user_id);
CREATE INDEX idx_results_date ON game_results(date);
