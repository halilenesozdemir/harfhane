import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import {
  adminBulkInsertWords,
  adminFindWordById,
  adminScheduleDailyWord,
} from '../../src/repositories/admin-repository';

beforeEach(async () => {
  await applySchema(env.DB);
});

describe('adminBulkInsertWords', () => {
  it('stores approved, family-safe rows with non-null source and license when none are given (006-AE1)', async () => {
    const result = await adminBulkInsertWords(env.DB, [
      { word: 'MASAL', meaning: 'Hayali öykü', context: 'Masal okudu.', category: 'isim' },
      { word: 'DERGİ', meaning: 'Süreli yayın', context: 'Dergi aldı.', category: 'isim' },
    ]);

    expect(result.inserted).toBe(2);

    const rows = await env.DB
      .prepare('SELECT word, source, license, status, family_safe FROM words WHERE word IN (?, ?)')
      .bind('MASAL', 'DERGİ')
      .all<{ word: string; source: string; license: string; status: string; family_safe: number }>();

    expect(rows.results).toHaveLength(2);
    for (const row of rows.results) {
      expect(row.source).toBe('admin');
      expect(row.license).toBe('owner-curated');
      expect(row.status).toBe('approved');
      expect(row.family_safe).toBe(1);
    }
  });

  it('uses the given source and license instead of the default', async () => {
    const result = await adminBulkInsertWords(env.DB, [
      {
        word: 'FİDAN',
        meaning: 'Genç ağaç',
        context: 'Fidan dikti.',
        category: 'isim',
        source: 'review-pipeline',
        license: 'cc-by-sa',
      },
    ]);

    expect(result.inserted).toBe(1);

    const row = await env.DB
      .prepare('SELECT source, license FROM words WHERE word = ?')
      .bind('FİDAN')
      .first<{ source: string; license: string }>();

    expect(row?.source).toBe('review-pipeline');
    expect(row?.license).toBe('cc-by-sa');
  });

  it('skips a word that already exists instead of inserting a duplicate', async () => {
    const word = { word: 'KİTAP', meaning: 'Yazılı eser', context: 'Kitabı okudu.', category: 'isim' };
    await adminBulkInsertWords(env.DB, [word]);

    const result = await adminBulkInsertWords(env.DB, [word]);

    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('should default to the daily pool when no pool is given', async () => {
    await adminBulkInsertWords(env.DB, [
      { word: 'ORMAN', meaning: '', context: '', category: 'isim' },
    ]);

    const row = await env.DB
      .prepare('SELECT pool FROM words WHERE word = ?')
      .bind('ORMAN')
      .first<{ pool: string }>();

    expect(row?.pool).toBe('daily');
  });

  it('should store the given pool and allow empty meaning when pool is unlimited', async () => {
    const result = await adminBulkInsertWords(env.DB, [
      { word: 'TEPSİ', meaning: '', context: '', category: 'isim', pool: 'unlimited' },
    ]);

    expect(result.inserted).toBe(1);
    const row = await env.DB
      .prepare('SELECT pool, meaning FROM words WHERE word = ?')
      .bind('TEPSİ')
      .first<{ pool: string; meaning: string }>();

    expect(row?.pool).toBe('unlimited');
    expect(row?.meaning).toBe('');
  });
});

describe('adminScheduleDailyWord', () => {
  async function insertWord(pool: 'daily' | 'unlimited'): Promise<number> {
    const result = await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('BALON', 5, 'test', 'test', 'approved', 1, 1, ?)
       RETURNING id`
    )
      .bind(pool)
      .first<{ id: number }>();
    if (!result) throw new Error('insert failed');
    return result.id;
  }

  it('should schedule the word when it is daily-pool', async () => {
    const id = await insertWord('daily');
    await expect(adminScheduleDailyWord(env.DB, id, '2026-04-01', 5)).resolves.toBeTypeOf('number');
  });

  it('should reject scheduling when the word is unlimited-pool', async () => {
    const id = await insertWord('unlimited');
    await expect(adminScheduleDailyWord(env.DB, id, '2026-04-02', 5)).rejects.toThrow();
  });
});

describe('adminFindWordById', () => {
  it('should include the word pool when finding a word by id', async () => {
    const id = await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('SEPET', 5, 'test', 'test', 'approved', 1, 1, 'unlimited')
       RETURNING id`
    ).first<{ id: number }>();
    if (!id) throw new Error('insert failed');

    const word = await adminFindWordById(env.DB, id.id);
    expect(word?.pool).toBe('unlimited');
  });
});
