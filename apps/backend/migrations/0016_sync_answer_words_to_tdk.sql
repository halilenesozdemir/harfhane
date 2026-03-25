-- Cevap havuzundaki tüm kelimeleri tdk_words'e ekle (validation için)
INSERT OR IGNORE INTO tdk_words (word, length)
SELECT word, length FROM words WHERE is_active = 1;

-- Manuel ekleme: kaynak listede olmayan ama TDK'da geçerli yaygın kelimeler
INSERT OR IGNORE INTO tdk_words (word, length) VALUES
('SELA', 4),
('ŞELA', 4),
('NALA', 4),
('DELA', 4),
('KELA', 4),
('HELA', 4),
('BELA', 4),
('TELA', 4),
('RELA', 4),
('MELA', 4),
('PELA', 4),
('VELA', 4),
('ZELA', 4);
