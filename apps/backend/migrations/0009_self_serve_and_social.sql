-- Faz: Self-serve list creation + social features

-- 1. Add owner to word_lists
ALTER TABLE word_lists ADD COLUMN owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_word_lists_owner ON word_lists(owner_user_id);

-- 2. Social tables
CREATE TABLE IF NOT EXISTS list_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id INTEGER NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, list_id)
);
CREATE INDEX IF NOT EXISTS idx_list_likes_list ON list_likes(list_id);

CREATE TABLE IF NOT EXISTS list_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id INTEGER NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_list_comments_list ON list_comments(list_id);
