import { applyD1Migrations, env } from 'cloudflare:test';

export async function applySchema(db: D1Database): Promise<void> {
  await applyD1Migrations(db, env.TEST_MIGRATIONS);
}

export async function seedTestData(db: D1Database): Promise<void> {
  await db.prepare(
    `INSERT INTO words
      (word, meaning, context, category, length, source, license, status, family_safe, is_active)
     VALUES
      ('KİTAP', 'Yazılı eser', 'Bu kitabı okudum.', 'isim', 5, 'test', 'test', 'approved', 1, 1),
      ('KALEM', 'Yazma aleti', 'Kalemi masaya koydu.', 'isim', 5, 'test', 'test', 'approved', 1, 1),
      ('BEYAZ', 'Ak renk', 'Beyaz kağıt aldı.', 'sıfat', 5, 'test', 'test', 'approved', 1, 1)`
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
     VALUES ('ornek-liste', 'Örnek Liste', 'Test listesi', 5, 1, 1)`
  ).run();

  await db.prepare(
    `INSERT INTO word_list_words (list_id, word_id)
     SELECT wl.id, w.id FROM word_lists wl, words w
     WHERE wl.slug = 'test-list' AND w.word = 'KİTAP'`
  ).run();

  await db.prepare(
    `INSERT INTO word_list_words (list_id, word_id)
     SELECT wl.id, w.id FROM word_lists wl, words w
     WHERE wl.slug = 'ornek-liste' AND w.word IN ('KİTAP', 'KALEM', 'BEYAZ')`
  ).run();

  await db.prepare(
    `INSERT INTO valid_words (word, length, source, license) VALUES
      ('KİTAP', 5, 'test', 'test'), ('KALEM', 5, 'test', 'test'), ('BEYAZ', 5, 'test', 'test')`
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
