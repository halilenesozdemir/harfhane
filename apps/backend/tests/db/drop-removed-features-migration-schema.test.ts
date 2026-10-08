import { describe, it, expect } from 'vitest';
import { applyD1Migrations, env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';

// These tests target the rebuild of `words` in 0003_drop_removed_features.sql
// specifically. tests/db/drop-removed-features-migration.test.ts checks the
// dropped/kept tables and the two indexes exist by name, and the triggers'
// behavior, but it never compares the rebuilt table's full column set,
// CHECKs, DEFAULTs or AUTOINCREMENT against what it should be — a mutant that
// silently drops a column from the INSERT...SELECT, loosens a CHECK, changes
// a DEFAULT, narrows an index, or drops AUTOINCREMENT would still pass it.

const WORDS_TABLE_SQL =
  "CREATE TABLE words (\n" +
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
  "  word TEXT NOT NULL UNIQUE,\n" +
  "  length INTEGER NOT NULL,\n" +
  "  meaning TEXT NOT NULL DEFAULT '',\n" +
  "  context TEXT NOT NULL DEFAULT '',\n" +
  "  category TEXT CHECK (category IS NULL OR category IN ('isim', 'sıfat', 'fiil')),\n" +
  "  source TEXT NOT NULL,\n" +
  "  license TEXT NOT NULL,\n" +
  "  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),\n" +
  "  family_safe INTEGER NOT NULL DEFAULT 0 CHECK (family_safe IN (0, 1)),\n" +
  "  approved_at TEXT,\n" +
  "  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),\n" +
  "  created_at TEXT NOT NULL DEFAULT (datetime('now')),\n" +
  "  pool TEXT NOT NULL DEFAULT 'daily' CHECK (pool IN ('daily', 'unlimited')),\n" +
  "  CHECK (length = length(word)),\n" +
  "  CHECK (is_active = 0 OR (status = 'approved' AND family_safe = 1))\n" +
  ')';

const IDX_LENGTH_ACTIVE_SQL = 'CREATE INDEX idx_words_length_active ON words (length, is_active)';
const IDX_STATUS_SQL = 'CREATE INDEX idx_words_status ON words (status)';

const DAILY_WORDS_REQUIRE_ACTIVE_WORD_SQL =
  "CREATE TRIGGER daily_words_require_active_word\n" +
  "BEFORE INSERT ON daily_words\n" +
  "WHEN NOT EXISTS (\n" +
  "  SELECT 1 FROM words\n" +
  "  WHERE id = NEW.word_id AND is_active = 1 AND status = 'approved' AND family_safe = 1 AND pool = 'daily'\n" +
  ")\n" +
  "BEGIN\n" +
  "  SELECT RAISE(ABORT, 'daily word must be an approved, family-safe, active, daily-pool word');\n" +
  'END';

const DAILY_WORDS_REQUIRE_ACTIVE_WORD_ON_UPDATE_SQL =
  "CREATE TRIGGER daily_words_require_active_word_on_update\n" +
  "BEFORE UPDATE OF word_id ON daily_words\n" +
  "WHEN NOT EXISTS (\n" +
  "  SELECT 1 FROM words\n" +
  "  WHERE id = NEW.word_id AND is_active = 1 AND status = 'approved' AND family_safe = 1 AND pool = 'daily'\n" +
  ")\n" +
  "BEGIN\n" +
  "  SELECT RAISE(ABORT, 'daily word must be an approved, family-safe, active, daily-pool word');\n" +
  'END';

const WORDS_BLOCK_DEACTIVATE_SCHEDULED_FUTURE_SQL =
  "CREATE TRIGGER words_block_deactivate_scheduled_future\n" +
  "BEFORE UPDATE OF is_active ON words\n" +
  "WHEN NEW.is_active = 0 AND OLD.is_active = 1 AND EXISTS (\n" +
  "  SELECT 1 FROM daily_words WHERE word_id = OLD.id AND date >= date('now', '+3 hours')\n" +
  ")\n" +
  "BEGIN\n" +
  "  SELECT RAISE(ABORT, 'cannot deactivate a word scheduled as a future daily word');\n" +
  'END';

const WORDS_BLOCK_ACTIVATE_REJECTED_SQL =
  "CREATE TRIGGER words_block_activate_rejected\n" +
  "BEFORE UPDATE OF is_active ON words\n" +
  "WHEN NEW.is_active = 1 AND OLD.status = 'rejected'\n" +
  "BEGIN\n" +
  "  SELECT RAISE(ABORT, 'cannot activate a rejected word');\n" +
  'END';

async function getSql(type: string, name: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT sql FROM sqlite_master WHERE type = ? AND name = ?')
    .bind(type, name)
    .first<{ sql: string }>();
  return row?.sql ?? null;
}

describe('0003 rebuilt words table schema', () => {
  it('should recreate the words table with every column, CHECK, DEFAULT and AUTOINCREMENT unchanged', async () => {
    await applySchema(env.DB);
    expect(await getSql('table', 'words')).toBe(WORDS_TABLE_SQL);
  });

  it('should keep idx_words_length_active indexing both length and is_active, not length alone', async () => {
    await applySchema(env.DB);
    expect(await getSql('index', 'idx_words_length_active')).toBe(IDX_LENGTH_ACTIVE_SQL);
  });

  it('should keep idx_words_status unchanged', async () => {
    await applySchema(env.DB);
    expect(await getSql('index', 'idx_words_status')).toBe(IDX_STATUS_SQL);
  });

  it('should recreate daily_words_require_active_word unchanged', async () => {
    await applySchema(env.DB);
    expect(await getSql('trigger', 'daily_words_require_active_word')).toBe(DAILY_WORDS_REQUIRE_ACTIVE_WORD_SQL);
  });

  it('should recreate daily_words_require_active_word_on_update unchanged', async () => {
    await applySchema(env.DB);
    expect(await getSql('trigger', 'daily_words_require_active_word_on_update')).toBe(
      DAILY_WORDS_REQUIRE_ACTIVE_WORD_ON_UPDATE_SQL
    );
  });

  it('should pin words_block_deactivate_scheduled_future to the Turkey-day shift and OLD.is_active/id clauses', async () => {
    await applySchema(env.DB);
    expect(await getSql('trigger', 'words_block_deactivate_scheduled_future')).toBe(
      WORDS_BLOCK_DEACTIVATE_SCHEDULED_FUTURE_SQL
    );
  });

  it('should pin words_block_activate_rejected to the OLD.status clause unchanged', async () => {
    await applySchema(env.DB);
    expect(await getSql('trigger', 'words_block_activate_rejected')).toBe(WORDS_BLOCK_ACTIVATE_REJECTED_SQL);
  });
});

describe('0003 cleans up its own scratch tables', () => {
  it('should leave no words_backup or words_seq_backup table behind', async () => {
    await applySchema(env.DB);
    const names = (
      await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all<{ name: string }>()
    ).results.map((r) => r.name);

    expect(names).not.toContain('words_backup');
    expect(names).not.toContain('words_seq_backup');
  });
});

interface FullWordRow {
  id: number;
  word: string;
  length: number;
  meaning: string;
  context: string;
  category: string | null;
  source: string;
  license: string;
  status: string;
  family_safe: number;
  approved_at: string | null;
  is_active: number;
  created_at: string;
  pool: string;
}

const FULL_ROW_COLUMNS =
  'id, word, length, meaning, context, category, source, license, status, family_safe, approved_at, is_active, created_at, pool';

describe('0003 rebuild preserves every column of a fully-populated row', () => {
  it('should carry every non-default column through the rebuild unchanged', async () => {
    const migrations = env.TEST_MIGRATIONS;
    if (migrations.length < 3) throw new Error('expected at least 3 migration files');
    const [m1, m2, m3] = [migrations[0]!, migrations[1]!, migrations[2]!];
    await applyD1Migrations(env.DB, [m1, m2]);

    await env.DB.prepare(
      `INSERT INTO words
        (word, length, meaning, context, category, source, license, status, family_safe, approved_at, is_active, created_at, pool)
       VALUES
        ('ÖRNEK', 5, 'tam anlam', 'tam bağlam', 'sıfat', 'review-pipeline', 'cc-by-sa', 'approved', 1, '2026-02-02T10:00:00.000Z', 1, '2026-01-01T00:00:00.000Z', 'unlimited')`
    ).run();

    const before = await env.DB.prepare(`SELECT ${FULL_ROW_COLUMNS} FROM words WHERE word = 'ÖRNEK'`).first<FullWordRow>();
    if (!before) throw new Error('seed row not found before migration');

    await applyD1Migrations(env.DB, [m3]);

    const after = await env.DB.prepare(`SELECT ${FULL_ROW_COLUMNS} FROM words WHERE word = 'ÖRNEK'`).first<FullWordRow>();
    expect(after).toEqual(before);
  });
});

describe('0003 rebuild keeps the CHECK and DEFAULT behavior of the original words table', () => {
  it('should still reject a row whose length does not match length(word)', async () => {
    await applySchema(env.DB);
    await expect(
      env.DB.prepare(
        `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
         VALUES ('KISAX', 10, 'test', 'test', 'approved', 1, 1, 'daily')`
      ).run()
    ).rejects.toThrow();
  });

  it('should still reject a category outside isim/sıfat/fiil', async () => {
    await applySchema(env.DB);
    await expect(
      env.DB.prepare(
        `INSERT INTO words (word, length, category, source, license, status, family_safe, is_active, pool)
         VALUES ('KATEG', 5, 'zarf', 'test', 'test', 'approved', 1, 1, 'daily')`
      ).run()
    ).rejects.toThrow();
  });

  it('should still default status to draft, not approved, when none is given', async () => {
    await applySchema(env.DB);
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, family_safe, is_active, pool)
       VALUES ('VARSA', 5, 'test', 'test', 0, 0, 'daily')`
    ).run();
    const row = await env.DB.prepare(`SELECT status FROM words WHERE word = 'VARSA'`).first<{ status: string }>();
    expect(row?.status).toBe('draft');
  });
});

describe('0003 preserves sqlite_sequence across the words rebuild', () => {
  it('should not reuse an id freed by a row removed before the migration ran', async () => {
    const migrations = env.TEST_MIGRATIONS;
    if (migrations.length < 3) throw new Error('expected at least 3 migration files');
    const [m1, m2, m3] = [migrations[0]!, migrations[1]!, migrations[2]!];
    await applyD1Migrations(env.DB, [m1, m2]);

    const highId = await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('YUKSK', 5, 'test', 'test', 'approved', 1, 1, 'daily')
       RETURNING id`
    ).first<{ id: number }>();
    if (!highId) throw new Error('seed insert failed');

    // Directly delete it (bypassing the app's "words are never deleted" rule) to simulate
    // a gap left by a prior manual fix or import, which the app itself would never create
    // but which the rebuild must still not break: the freed id must stay freed.
    await env.DB.prepare('DELETE FROM words WHERE id = ?').bind(highId.id).run();

    await applyD1Migrations(env.DB, [m3]);

    const newWord = await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('YENIS', 5, 'test', 'test', 'approved', 1, 1, 'daily')
       RETURNING id`
    ).first<{ id: number }>();

    expect(newWord?.id).toBeGreaterThan(highId.id);
  });
});
