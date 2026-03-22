-- Deactivate all 7-letter words
UPDATE words SET is_active = 0 WHERE length(word) = 7;

-- Remove scheduled daily entries for 7-letter words
DELETE FROM daily_words WHERE word_id IN (SELECT id FROM words WHERE length(word) = 7);
