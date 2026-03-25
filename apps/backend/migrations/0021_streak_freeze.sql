ALTER TABLE users ADD COLUMN freeze_tokens INTEGER NOT NULL DEFAULT 1;

CREATE TABLE streak_freezes (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frozen_date TEXT    NOT NULL,
  PRIMARY KEY (user_id, frozen_date)
);
