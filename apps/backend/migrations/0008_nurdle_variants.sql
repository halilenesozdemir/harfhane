-- Faz 2: Kelime kaynağını ayırt etmek için source kolonu
-- Mevcut tüm kelimeler Risale-i Nur kökenli, yeni TDK kelimeler 'tdk' olarak işaretlenecek

ALTER TABLE words ADD COLUMN source TEXT NOT NULL DEFAULT 'risale';

-- Migration 0007'de eklenen TDK kelimelerini işaretle
UPDATE words SET source = 'tdk' WHERE word IN (
  -- 4 harfli TDK
  'YAKA', 'KALE', 'MASA', 'KAYA', 'GECE', 'YURT', 'BOYA', 'FARE', 'DERE', 'KARA',
  'YARA', 'TAVA', 'KOVA', 'SOBA', 'LEKE', 'MEZE', 'TANE', 'OCAK', 'YELE', 'DAMA',
  -- 5 harfli TDK
  'DUMAN', 'ÇARŞI', 'FENER', 'NEHİR', 'DENİZ', 'SEBZE', 'MEYVE', 'KÖPRÜ', 'PARÇA', 'GÜNEŞ',
  'BULUT', 'TAŞIT', 'ÇİÇEK', 'HAVUZ', 'KUZEY', 'ÇEVRE', 'ŞEKER', 'ASKER', 'YEMEK', 'KAHVE',
  -- 6 harfli TDK
  'YAĞMUR', 'HAYVAN', 'DOKTOR', 'TOPLAM', 'MEVSİM', 'MUTFAK', 'KAMYON', 'DEVLET', 'KARTAL', 'KÜLTÜR',
  'PEYNİR', 'SÖZLÜK', 'TAKVİM', 'YAZLIK', 'ÇIKMAZ', 'ARALIK', 'YABANI', 'MAKİNE', 'HİKAYE', 'MEYDAN'
);

-- Nurdle 4 harfli listesi
INSERT OR IGNORE INTO word_lists (slug, name, description, word_length, is_public, has_daily)
VALUES (
  'nurdle-4',
  'Nurdle 4 — Risale-i Nur',
  'Risale-i Nur külliyatından derlenen 4 harfli kelimelerle günlük Wordle deneyimi.',
  4,
  1,
  1
);

INSERT OR IGNORE INTO word_list_words (list_id, word_id)
SELECT
  (SELECT id FROM word_lists WHERE slug = 'nurdle-4'),
  w.id
FROM words w
WHERE w.length = 4 AND w.is_active = 1 AND w.source = 'risale';

-- Nurdle 6 harfli listesi
INSERT OR IGNORE INTO word_lists (slug, name, description, word_length, is_public, has_daily)
VALUES (
  'nurdle-6',
  'Nurdle 6 — Risale-i Nur',
  'Risale-i Nur külliyatından derlenen 6 harfli kelimelerle günlük Wordle deneyimi.',
  6,
  1,
  1
);

INSERT OR IGNORE INTO word_list_words (list_id, word_id)
SELECT
  (SELECT id FROM word_lists WHERE slug = 'nurdle-6'),
  w.id
FROM words w
WHERE w.length = 6 AND w.is_active = 1 AND w.source = 'risale';
