import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import { adminBulkInsertWords } from '../../src/repositories/admin-repository';

beforeEach(async () => {
  await applySchema(env.DB);
});

describe('adminBulkInsertWords', () => {
  it('stores approved, family-safe rows with non-null source and license when none are given', async () => {
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
});
