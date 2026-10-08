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

  it('should return 401 when the admin secret is wrong', async () => {
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

  it('should accept an unlimited-pool word when meaning and context are empty', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({
        words: [{ word: 'TOPLU', category: 'isim', pool: 'unlimited' }],
      }),
    });

    expect(res.status).toBe(200);
    const row = await env.DB
      .prepare('SELECT pool, meaning, context FROM words WHERE word = ?')
      .bind('TOPLU')
      .first<{ pool: string; meaning: string; context: string }>();

    expect(row?.pool).toBe('unlimited');
    expect(row?.meaning).toBe('');
    expect(row?.context).toBe('');
  });

  it('should default to the daily pool when none is given', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ words: [{ word: 'SEHER', category: 'isim' }] }),
    });

    expect(res.status).toBe(200);
    const row = await env.DB
      .prepare('SELECT pool FROM words WHERE word = ?')
      .bind('SEHER')
      .first<{ pool: string }>();
    expect(row?.pool).toBe('daily');
  });
});

describe('POST /api/admin/words', () => {
  it('should accept a daily-pool word when meaning and context are empty', async () => {
    const res = await SELF.fetch('http://example.com/api/admin/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ word: 'YAZIT', category: 'isim' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { word: string; meaning: string } };
    expect(body.data.word).toBe('YAZIT');
    expect(body.data.meaning).toBe('');
  });
});

describe('POST /api/admin/daily', () => {
  it('should return 409 when scheduling an unlimited-pool word', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('OYUNA', 5, 'test', 'test', 'approved', 1, 1, 'unlimited')`
    ).run();
    const wordRow = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('OYUNA').first<{ id: number }>();

    const res = await SELF.fetch('http://example.com/api/admin/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ word_id: wordRow?.id, date: '2026-05-01' }),
    });

    expect(res.status).toBe(409);
  });

  it('should return 201 when scheduling a daily-pool word', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('OYUNB', 5, 'test', 'test', 'approved', 1, 1, 'daily')`
    ).run();
    const wordRow = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('OYUNB').first<{ id: number }>();

    const res = await SELF.fetch('http://example.com/api/admin/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ word_id: wordRow?.id, date: '2026-05-02' }),
    });

    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/admin/words/:id', () => {
  it('should return 409 instead of a 500 when deactivating a word scheduled as a future daily word', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('OYUNC', 5, 'test', 'test', 'approved', 1, 1, 'daily')`
    ).run();
    const wordRow = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('OYUNC').first<{ id: number }>();
    await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(wordRow?.id, '2999-01-01')
      .run();

    const res = await SELF.fetch(`http://example.com/api/admin/words/${wordRow?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ is_active: false }),
    });

    expect(res.status).toBe(409);
  });

  it('should return 409 instead of a 500 when activating a word whose status is rejected', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('OYUND', 5, 'test', 'test', 'rejected', 0, 0, 'daily')`
    ).run();
    const wordRow = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('OYUND').first<{ id: number }>();

    const res = await SELF.fetch(`http://example.com/api/admin/words/${wordRow?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ is_active: true }),
    });

    expect(res.status).toBe(409);
  });

  it('should return 200 when deactivating a word with no future schedule', async () => {
    await env.DB.prepare(
      `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
       VALUES ('OYUNE', 5, 'test', 'test', 'approved', 1, 1, 'daily')`
    ).run();
    const wordRow = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('OYUNE').first<{ id: number }>();

    const res = await SELF.fetch(`http://example.com/api/admin/words/${wordRow?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET },
      body: JSON.stringify({ is_active: false }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { is_active: number } };
    expect(body.data.is_active).toBe(0);
  });
});
