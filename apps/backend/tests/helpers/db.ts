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

  await db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    google_id TEXT,
    freeze_tokens INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS game_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    word_length INTEGER NOT NULL,
    guesses INTEGER NOT NULL,
    won INTEGER NOT NULL DEFAULT 0,
    mode TEXT NOT NULL DEFAULT 'daily',
    word_id INTEGER REFERENCES words(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date, word_length)
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS streak_freezes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frozen_date TEXT NOT NULL,
    PRIMARY KEY (user_id, frozen_date)
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS user_xp (
    user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS user_badges (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id),
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, badge_id)
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS tournament_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
    word_length INTEGER NOT NULL,
    guesses INTEGER NOT NULL,
    won INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    played_at TEXT DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS tdk_words (
    word TEXT NOT NULL PRIMARY KEY,
    length INTEGER NOT NULL
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

  await db.prepare(
    `INSERT INTO tdk_words (word, length) VALUES
      ('KİTAP', 5), ('KALEM', 5), ('BEYAZ', 5)`
  ).run();

  await db.prepare(
    `INSERT INTO badges (slug, name, description, icon) VALUES
      ('first-step', 'İlk Adım', 'İlk oyununu tamamla', 'Star'),
      ('sharpshooter', 'Keskin Nişancı', '1. tahminde kazan', 'Target'),
      ('on-fire', 'Ateş', '7 günlük seri yap', 'Flame'),
      ('word-master', 'Söz Ustası', '50 oyun tamamla', 'BookOpen'),
      ('perfect-run', 'Mükemmel Seri', '10 oyunu arka arkaya kazan', 'Trophy'),
      ('lexicon', 'Lügat', '100 oyun tamamla', 'Library'),
      ('legend', 'Efsane', 'Level 5''e ulaş', 'Crown')`
  ).run();
}

export async function createTestUser(
  db: D1Database,
  username = 'testuser',
  email = 'test@test.com'
): Promise<{ id: number; email: string; username: string; passwordHash: string }> {
  const passwordHash = 'testhash:testhash';
  const row = await db
    .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?) RETURNING id, email, username')
    .bind(email, username, passwordHash)
    .first<{ id: number; email: string; username: string }>();
  if (!row) throw new Error('Failed to create test user');
  return { ...row, passwordHash };
}
