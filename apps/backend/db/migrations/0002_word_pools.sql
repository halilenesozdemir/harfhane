-- Add word pools (daily vs unlimited) and tighten the daily-word trigger accordingly.

ALTER TABLE words ADD COLUMN pool TEXT NOT NULL DEFAULT 'daily' CHECK (pool IN ('daily', 'unlimited'));

DROP TRIGGER daily_words_require_active_word;

CREATE TRIGGER daily_words_require_active_word
BEFORE INSERT ON daily_words
WHEN NOT EXISTS (
  SELECT 1 FROM words
  WHERE id = NEW.word_id AND is_active = 1 AND status = 'approved' AND family_safe = 1 AND pool = 'daily'
)
BEGIN
  SELECT RAISE(ABORT, 'daily word must be an approved, family-safe, active, daily-pool word');
END;
