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
--
-- Seeded words come from seed/execute time, but the journey's HTTP request
-- lands 10-60s later; a run that straddles the Turkey-day midnight rollover
-- between the two would otherwise find no daily word for "today". Seeding
-- yesterday, today and tomorrow's Turkey day each covers whichever day the
-- request actually lands on. Tomorrow's row is never served early regardless:
-- getDailyWord (apps/backend/src/services/word-service.ts) throws NOT_FOUND
-- for any date after the server's own "today", so GET /words/daily can only
-- ever return today's or an earlier row, never tomorrow's.
INSERT INTO words (word, length, meaning, context, category, source, license, status, family_safe, approved_at, is_active)
VALUES
  ('MASAL', 5, 'Hayal ürünü anlatılan kısa öykü.', 'Dedem bana her gece bir masal okurdu.', 'isim', 'curated', 'public-domain', 'approved', 1, datetime('now'), 1),
  ('KALEM', 5, 'Yazmak için kullanılan araç.', 'Kalemimi çekmeceye koydum.', 'isim', 'curated', 'public-domain', 'approved', 1, datetime('now'), 1),
  ('KAPAK', 5, 'Bir kabı örten parça.', 'Tencerenin kapağını kapat.', 'isim', 'curated', 'public-domain', 'approved', 1, datetime('now'), 1);

INSERT INTO daily_words (word_id, date, length) VALUES
  ((SELECT id FROM words WHERE word = 'MASAL'), date('now', '-1 day', '+3 hours'), 5),
  ((SELECT id FROM words WHERE word = 'KALEM'), date('now', '+3 hours'), 5),
  ((SELECT id FROM words WHERE word = 'KAPAK'), date('now', '+1 day', '+3 hours'), 5);

-- Valid words the real-backend journey needs: today's solution (KALEM, so a
-- correct guess validates), the adjacent scheduled days' solutions, and one
-- wrong-but-valid word for a non-winning guess.
INSERT INTO valid_words (word, length, source, license) VALUES
  ('MASAL', 5, 'curated', 'public-domain'),
  ('KALEM', 5, 'curated', 'public-domain'),
  ('KAPAK', 5, 'curated', 'public-domain'),
  ('TAVUK', 5, 'curated', 'public-domain');
