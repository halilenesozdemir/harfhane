import { describe, it, expect } from 'vitest';
import { applyD1Migrations, env } from 'cloudflare:test';

// Deliberately does not use tests/helpers/db.ts's applySchema(), which applies
// 0001+0002+0003 together against an empty database. That never exercises the
// DROP TABLE words statement in 0003 against a words row that daily_words.word_id
// still references (words.id ... ON DELETE RESTRICT): an empty database has no
// daily_words rows to violate that constraint against. Applying 0001 and 0002
// first, seeding data that mirrors every real database's shape, and only then
// applying 0003 is what catches a "FOREIGN KEY constraint failed" regression in
// the rebuild of `words`.
describe('0003 migration applied against a database that already has data', () => {
  it('should keep ids, pool values and daily_words references intact, and leave no dangling foreign key, when 0003 runs on seeded data', async () => {
    const migrations = env.TEST_MIGRATIONS;
    if (migrations.length < 3) throw new Error('expected at least 3 migration files');
    const [m1, m2, m3] = [migrations[0]!, migrations[1]!, migrations[2]!];
    await applyD1Migrations(env.DB, [m1, m2]);

    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('GUNES', 5, 'test', 'test', 'approved', 1, 1, 'daily')`
    ).run();
    const word = await env.DB.prepare(`SELECT id FROM words WHERE word = 'GUNES'`).first<{ id: number }>();
    if (!word) throw new Error('seed word not found');
    await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(word.id, '2026-05-10')
      .run();

    // A row in one of the tables 0003 drops, to prove the drop still runs cleanly
    // against non-empty removed-feature tables too.
    await env.DB.prepare(
      `INSERT INTO users (email, username, password_hash) VALUES ('a@example.com', 'abc', 'hash')`
    ).run();

    await applyD1Migrations(env.DB, [m3]);

    const fkViolations = await env.DB.prepare('PRAGMA foreign_key_check').all();
    expect(fkViolations.results).toEqual([]);

    const wordRow = await env.DB.prepare('SELECT id, pool, status FROM words WHERE word = ?')
      .bind('GUNES')
      .first<{ id: number; pool: string; status: string }>();
    expect(wordRow?.id).toBe(word.id);
    expect(wordRow?.pool).toBe('daily');
    expect(wordRow?.status).toBe('approved');

    const dailyRow = await env.DB.prepare('SELECT word_id FROM daily_words WHERE date = ?')
      .bind('2026-05-10')
      .first<{ word_id: number }>();
    expect(dailyRow?.word_id).toBe(word.id);

    const usersStillExists = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'`
    ).first();
    expect(usersStillExists).toBeNull();
  });
});
