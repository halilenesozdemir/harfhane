-- Faz 2: Nurdle slug — Risale-i Nur kelimeleri bir word_list olarak tanımlanıyor

-- has_daily kolonu: slug oyununun günlük moda sahip olup olmadığını belirtir
ALTER TABLE word_lists ADD COLUMN has_daily INTEGER NOT NULL DEFAULT 0;

-- Nurdle word list oluştur
INSERT OR IGNORE INTO word_lists (slug, name, description, word_length, is_public, has_daily)
VALUES (
  'nurdle',
  'Nurdle — Risale-i Nur',
  'Risale-i Nur külliyatından derlenen 5 harfli kelimelerle günlük Wordle deneyimi.',
  5,
  1,
  1
);

-- Mevcut 5 harfli aktif kelimeleri nurdle listesiyle ilişkilendir
INSERT OR IGNORE INTO word_list_words (list_id, word_id)
SELECT
  (SELECT id FROM word_lists WHERE slug = 'nurdle'),
  w.id
FROM words w
WHERE w.length = 5 AND w.is_active = 1;
