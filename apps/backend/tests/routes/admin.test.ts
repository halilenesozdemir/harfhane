import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema } from '../helpers/db';

const ADMIN_SECRET = 'local-test-admin-secret';

beforeEach(async () => {
  await applySchema(env.DB);
});

describe('POST /api/admin/import', () => {
  it('rejects a request without the admin secret', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: [{ word: 'MASAL', meaning: 'Hayali öykü', category: 'isim' }] }),
    });
    expect(res.status).toBe(401);
  });

  it('should reject a request with a wrong admin secret', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': `${ADMIN_SECRET}-wrong` },
      body: JSON.stringify({ words: [{ word: 'MASAL', meaning: 'Hayali öykü', category: 'isim' }] }),
    });
    expect(res.status).toBe(401);
  });

  it('imports words as approved, family-safe rows with default source and license', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({
        words: [
          { word: 'MASAL', meaning: 'Hayali öykü', category: 'isim' },
          { word: 'DERGİ', meaning: 'Süreli yayın', category: 'isim' },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { inserted: number; skipped: number } };
    expect(body.data.inserted).toBe(2);

    const rows = await env.DB
      .prepare('SELECT source, license, status, family_safe FROM words WHERE word IN (?, ?)')
      .bind('MASAL', 'DERGİ')
      .all<{ source: string; license: string; status: string; family_safe: number }>();

    expect(rows.results).toHaveLength(2);
    for (const row of rows.results) {
      expect(row.source).toBe('admin');
      expect(row.license).toBe('owner-curated');
      expect(row.status).toBe('approved');
      expect(row.family_safe).toBe(1);
    }
  });

  it('honors a given source and license over the default', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({
        words: [
          {
            word: 'FİDAN',
            meaning: 'Genç ağaç',
            category: 'isim',
            source: 'review-pipeline',
            license: 'cc-by-sa',
          },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const row = await env.DB
      .prepare('SELECT source, license FROM words WHERE word = ?')
      .bind('FİDAN')
      .first<{ source: string; license: string }>();

    expect(row?.source).toBe('review-pipeline');
    expect(row?.license).toBe('cc-by-sa');
  });
});
