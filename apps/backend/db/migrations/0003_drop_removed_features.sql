-- Drop schema left over from features removed for the MVP scope cut
-- (docs/decisions/2026-10-05-mvp-scope-cut.md): accounts/auth/profile, XP/badges/
-- streak-freeze/leaderboard, push/email, custom word lists, tournaments and duels.
-- No remaining backend route/service/repository, script, cron or test touches any
-- of these tables (verified by code search before writing this migration) — only
-- 0001_baseline.sql still declared them.
--
-- Dropped in child-before-parent order so a foreign key reference is never left
-- dangling mid-migration, regardless of whether foreign_keys enforcement is on.
DROP TABLE list_comments;
DROP TABLE list_likes;
DROP TABLE word_list_words;
DROP TABLE word_lists;
DROP TABLE user_badges;
DROP TABLE badges;
DROP TABLE user_xp;
DROP TABLE push_subscriptions;
DROP TABLE streak_freezes;
DROP TABLE password_reset_tokens;
DROP TABLE game_results;
DROP TABLE tournament_results;
DROP TABLE duels;
DROP TABLE users;

-- Guard-rail 1: drop the `source = 'user'` escape from the `words` CHECK. It let an
-- unmoderated word reach players once custom word lists let users mark their own
-- words active; lists are gone, so every active word must now be approved and
-- family-safe regardless of source (Invariant 1). SQLite cannot ALTER a CHECK
-- constraint in place, so the table is rebuilt.
--
-- `daily_words_require_active_word` (0001/0002) is dropped before the rebuild and
-- recreated after: leaving it in place while `words` is dropped and recreated
-- below makes the later ALTER TABLE ... RENAME TO fail with "no such table:
-- main.words" — that statement forces SQLite to recompile every trigger that
-- mentions the renamed table's old or new name, and it does so against the
-- schema as it stands mid-migration, where `words` is briefly absent.
DROP TRIGGER daily_words_require_active_word;

CREATE TABLE words_new (
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
  pool TEXT NOT NULL DEFAULT 'daily' CHECK (pool IN ('daily', 'unlimited')),
  CHECK (length = length(word)),
  CHECK (is_active = 0 OR (status = 'approved' AND family_safe = 1))
);

INSERT INTO words_new (
  id, word, length, meaning, context, category, source, license,
  status, family_safe, approved_at, is_active, created_at, pool
)
SELECT
  id, word, length, meaning, context, category, source, license,
  status, family_safe, approved_at, is_active, created_at, pool
FROM words;

DROP TABLE words;
ALTER TABLE words_new RENAME TO words;

CREATE INDEX idx_words_length_active ON words (length, is_active);
CREATE INDEX idx_words_status ON words (status);

-- Recreated with the same condition as 0002; only its target table changed underneath it.
CREATE TRIGGER daily_words_require_active_word
BEFORE INSERT ON daily_words
WHEN NOT EXISTS (
  SELECT 1 FROM words
  WHERE id = NEW.word_id AND is_active = 1 AND status = 'approved' AND family_safe = 1 AND pool = 'daily'
)
BEGIN
  SELECT RAISE(ABORT, 'daily word must be an approved, family-safe, active, daily-pool word');
END;

-- Guard-rail 2: mirror the insert-time check on UPDATE, so reassigning word_id on
-- an existing daily_words row cannot bypass it.
CREATE TRIGGER daily_words_require_active_word_on_update
BEFORE UPDATE OF word_id ON daily_words
WHEN NOT EXISTS (
  SELECT 1 FROM words
  WHERE id = NEW.word_id AND is_active = 1 AND status = 'approved' AND family_safe = 1 AND pool = 'daily'
)
BEGIN
  SELECT RAISE(ABORT, 'daily word must be an approved, family-safe, active, daily-pool word');
END;

-- Guard-rail 3: a word already scheduled as a future daily word cannot be
-- deactivated out from under that schedule.
CREATE TRIGGER words_block_deactivate_scheduled_future
BEFORE UPDATE OF is_active ON words
WHEN NEW.is_active = 0 AND OLD.is_active = 1 AND EXISTS (
  SELECT 1 FROM daily_words WHERE word_id = OLD.id AND date >= date('now')
)
BEGIN
  SELECT RAISE(ABORT, 'cannot deactivate a word scheduled as a future daily word');
END;

-- Guard-rail 4: a rejected word can never be activated directly; it must be
-- re-approved (status changed off 'rejected') first.
CREATE TRIGGER words_block_activate_rejected
BEFORE UPDATE OF is_active ON words
WHEN NEW.is_active = 1 AND OLD.status = 'rejected'
BEGIN
  SELECT RAISE(ABORT, 'cannot activate a rejected word');
END;
