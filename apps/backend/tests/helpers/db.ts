export async function applySchema(db: D1Database): Promise<void> {
  await db.prepare(`CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    meaning TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK(category IN ('isim', 'sıfat', 'fiil')),
    length INTEGER NOT NULL DEFAULT 5,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS daily_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
    date TEXT NOT NULL,
    length INTEGER NOT NULL DEFAULT 5,
    UNIQUE(date, length)
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS word_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    word_length INTEGER NOT NULL DEFAULT 5,
    is_public INTEGER DEFAULT 0,
    has_daily INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS word_list_words (
    list_id INTEGER NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
    PRIMARY KEY (list_id, word_id)
  )`).run();
}

export async function seedTestData(db: D1Database): Promise<void> {
  await db.prepare(
    `INSERT INTO words (word, meaning, context, category, length) VALUES
      ('KİTAP', 'Yazılı eser', 'Bu kitabı okudum.', 'isim', 5),
      ('KALEM', 'Yazma aleti', 'Kalemi masaya koydu.', 'isim', 5),
      ('BEYAZ', 'Ak renk', 'Beyaz kağıt aldı.', 'sıfat', 5)`
  ).run();

  await db.prepare(
    `INSERT INTO daily_words (word_id, date, length)
     SELECT id, '2026-01-01', 5 FROM words WHERE word = 'KİTAP'`
  ).run();

  await db.prepare(
    `INSERT INTO daily_words (word_id, date, length)
     SELECT id, '2026-01-02', 5 FROM words WHERE word = 'KALEM'`
  ).run();

  // Test word list: test-list (has_daily=0), nurdle (has_daily=1)
  await db.prepare(
    `INSERT INTO word_lists (slug, name, description, word_length, is_public, has_daily)
     VALUES ('test-list', 'Test Listesi', 'Test açıklaması', 5, 1, 0)`
  ).run();

  await db.prepare(
    `INSERT INTO word_lists (slug, name, description, word_length, is_public, has_daily)
     VALUES ('nurdle', 'Nurdle — Risale-i Nur', 'Test nurdle', 5, 1, 1)`
  ).run();

  await db.prepare(
    `INSERT INTO word_list_words (list_id, word_id)
     SELECT wl.id, w.id FROM word_lists wl, words w
     WHERE wl.slug = 'test-list' AND w.word = 'KİTAP'`
  ).run();

  await db.prepare(
    `INSERT INTO word_list_words (list_id, word_id)
     SELECT wl.id, w.id FROM word_lists wl, words w
     WHERE wl.slug = 'nurdle' AND w.word IN ('KİTAP', 'KALEM', 'BEYAZ')`
  ).run();
}
