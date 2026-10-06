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
    `INSERT INTO valid_words (word, length, source, license) VALUES
      ('KİTAP', 5, 'test', 'test'), ('KALEM', 5, 'test', 'test'), ('BEYAZ', 5, 'test', 'test')`
  ).run();
}
