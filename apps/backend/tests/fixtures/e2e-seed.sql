-- Seed for the `real-backend` Playwright project (Plan 009 U3, R4/AE3).
--
-- Applied to a local-only D1 built from db/migrations (never --remote). Inserts
-- go through the same columns and checks as production data (Invariant 1:
-- status = 'approved', family_safe = 1) and through the daily_words_require_active_word
-- trigger rather than around it.
--
-- `date('now', '+3 hours')` is the same Turkey-day shift the app uses
-- (packages/shared/src/game/time.ts getTodayString, and
-- apps/backend/db/migrations/0003_drop_removed_features.sql's own triggers), so
-- the scheduled date always matches "today" from the running app's point of
-- view, whatever day this is actually run.

INSERT INTO words (word, length, meaning, context, category, source, license, status, family_safe, approved_at, is_active)
VALUES ('KALEM', 5, 'Yazmak için kullanılan araç.', 'Kalemimi çekmeceye koydum.', 'isim', 'curated', 'public-domain', 'approved', 1, datetime('now'), 1);

INSERT INTO daily_words (word_id, date, length)
VALUES ((SELECT id FROM words WHERE word = 'KALEM'), date('now', '+3 hours'), 5);

-- Valid words the real-backend journey needs: the scheduled solution (so a
-- correct guess validates) and one wrong-but-valid word for a non-winning guess.
INSERT INTO valid_words (word, length, source, license) VALUES
  ('KALEM', 5, 'curated', 'public-domain'),
  ('TAVUK', 5, 'curated', 'public-domain');
