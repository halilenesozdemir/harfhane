-- Faz 2: TDK validation tablosu
-- Sadece tahmin validasyonu için kullanılır — cevap havuzu değil.
-- Oyuncunun girdiği herhangi bir geçerli Türkçe kelime bu tabloda aranır.

CREATE TABLE IF NOT EXISTS tdk_words (
  word   TEXT    NOT NULL PRIMARY KEY,
  length INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tdk_words_length ON tdk_words(length);
