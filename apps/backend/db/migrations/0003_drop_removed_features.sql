-- Defer foreign key checks to the end of this migration's transaction. Without
-- this, DROP TABLE words below does an implicit DELETE of every words row, which
-- violates daily_words.word_id REFERENCES words(id) ON DELETE RESTRICT on any
-- database that actually has daily_words rows (an empty test database never
-- exercises this). words is rebuilt with the same ids further down, so by the
-- time this transaction commits the reference is valid again.
PRAGMA defer_foreign_keys = true;

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
-- The rebuild copies into a backup table rather than using ALTER TABLE ... RENAME
-- TO: a RENAME statement forces SQLite to recompile every trigger that mentions
-- the renamed table, against the schema as it stands at that point in the
-- migration, where `words` would be briefly absent — it fails with "no such
-- table: main.words" even though the table is recreated later in the same
-- migration. `daily_words_require_active_word` (0001/0002), the trigger that
-- mentions `words`, is dropped before the rebuild and recreated after instead.
DROP TRIGGER daily_words_require_active_word;

-- DROP TABLE words below also drops the sqlite_sequence row that tracks its
-- AUTOINCREMENT high-water mark. Without saving it first, the high-water mark
-- would reset to MAX(id) among the rows actually copied back below — if any
-- higher id was ever freed (a gap from a prior manual fix or import, even
-- though the app itself never deletes a word row), a future INSERT would
-- reuse that freed id, and an old /api/words/challenge/:wordId link would
-- then resolve to an unrelated word. words_seq_backup survives the DROP
-- TABLE words below, so the real high-water mark is restored afterward.
CREATE TABLE words_seq_backup AS SELECT seq FROM sqlite_sequence WHERE name = 'words';

CREATE TABLE words_backup AS SELECT * FROM words;
DROP TABLE words;

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
  pool TEXT NOT NULL DEFAULT 'daily' CHECK (pool IN ('daily', 'unlimited')),
  CHECK (length = length(word)),
  CHECK (is_active = 0 OR (status = 'approved' AND family_safe = 1))
);

-- Explicit ids preserve daily_words.word_id references; SQLite bumps
-- sqlite_sequence to match the highest id actually inserted, so AUTOINCREMENT
-- continues from where the old table left off.
INSERT INTO words (
  id, word, length, meaning, context, category, source, license,
  status, family_safe, approved_at, is_active, created_at, pool
)
SELECT
  id, word, length, meaning, context, category, source, license,
  status, family_safe, approved_at, is_active, created_at, pool
FROM words_backup;

DROP TABLE words_backup;

-- Restore the AUTOINCREMENT high-water mark saved above. If no row existed yet
-- (an empty database never had a sqlite_sequence row for words), the backup
-- table has no rows and this is a no-op, leaving the mark the INSERT above
-- already set.
UPDATE sqlite_sequence SET seq = (SELECT seq FROM words_seq_backup)
WHERE name = 'words' AND EXISTS (SELECT 1 FROM words_seq_backup);
DROP TABLE words_seq_backup;

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

-- Guard-rail 3: a word already scheduled as a future daily word (today included)
-- cannot be deactivated out from under that schedule. Defense-in-depth below
-- admin-service.ts's toggleWordActive, which pre-checks the same condition and
-- returns a 409 before this trigger would fire; both layers must agree on
-- "today", so this uses date('now', '+3 hours') — the fixed Turkey-day shift
-- getTodayString() applies (packages/shared, GLOSSARY.md "Turkey day"; no DST)
-- — not bare date('now') (plain UTC). Without the shift, during UTC 21:00-23:59
-- (the first hours of the new Turkey day) date('now') still reads yesterday's
-- UTC date while the service's "today" already rolled over: a word scheduled
-- for yesterday's Turkey day would pass the service's 409 pre-check but still
-- match this trigger's stale "today" and RAISE, surfacing a 500 instead.
CREATE TRIGGER words_block_deactivate_scheduled_future
BEFORE UPDATE OF is_active ON words
WHEN NEW.is_active = 0 AND OLD.is_active = 1 AND EXISTS (
  SELECT 1 FROM daily_words WHERE word_id = OLD.id AND date >= date('now', '+3 hours')
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
