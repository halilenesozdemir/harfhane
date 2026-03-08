export async function applySchema(db: D1Database): Promise<void> {
  await db.prepare(`CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    meaning TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK(category IN ('isim', 'sıfat', 'fiil')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS daily_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
    date TEXT NOT NULL UNIQUE
  )`).run();
}

export async function seedTestData(db: D1Database): Promise<void> {
  await db.prepare(
    `INSERT INTO words (word, meaning, context, category) VALUES
      ('KİTAP', 'Yazılı eser', 'Bu kitabı okudum.', 'isim'),
      ('KALEM', 'Yazma aleti', 'Kalemi masaya koydu.', 'isim'),
      ('BEYAZ', 'Ak renk', 'Beyaz kağıt aldı.', 'sıfat')`
  ).run();

  await db.prepare(
    `INSERT INTO daily_words (word_id, date)
     SELECT id, '2026-01-01' FROM words WHERE word = 'KİTAP'`
  ).run();

  await db.prepare(
    `INSERT INTO daily_words (word_id, date)
     SELECT id, '2026-01-02' FROM words WHERE word = 'KALEM'`
  ).run();
}
