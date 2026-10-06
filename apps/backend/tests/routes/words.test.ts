import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData } from '../helpers/db';

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
});

describe('GET /api/words/daily', () => {
  it('returns 200 with daily word for a valid date', async () => {
    const res = await SELF.fetch('http://example.com/api/words/daily?date=2026-01-01');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { word: { word: string }; gameNumber: number; date: string } };
    expect(body.data.word.word).toBe('KİTAP');
    expect(body.data.gameNumber).toBe(1);
    expect(body.data.date).toBe('2026-01-01');
  });

  it('returns 404 when no word scheduled for date', async () => {
    const res = await SELF.fetch('http://example.com/api/words/daily?date=2025-06-01');
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 with BAD_REQUEST for an invalid date format', async () => {
    const res = await SELF.fetch('http://example.com/api/words/daily?date=notadate');
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
  });
});

describe('GET /api/words/random', () => {
  it('returns 200 with a word entry', async () => {
    const res = await SELF.fetch('http://example.com/api/words/random');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { word: { word: string; meaning: string } } };
    expect(body.data.word.word).toBeDefined();
    expect(body.data.word.meaning).toBeDefined();
  });

  it('should serve an unlimited-pool word when no daily-pool word exists for that length (008-AE3)', async () => {
    await env.DB
      .prepare(
        `INSERT INTO words (word, meaning, context, category, length, source, license, status, family_safe, is_active, pool)
         VALUES ('KAPLAN', '', '', 'isim', 6, 'test', 'test', 'approved', 1, 1, 'unlimited')`
      )
      .run();

    const autoFillRes = await SELF.fetch('http://example.com/api/admin/daily/auto-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': 'local-test-admin-secret' },
      body: JSON.stringify({ days: 5 }),
    });
    expect(autoFillRes.status).toBe(200);

    const scheduledRow = await env.DB
      .prepare('SELECT COUNT(*) as count FROM daily_words WHERE length = 6')
      .first<{ count: number }>();
    expect(scheduledRow?.count).toBe(0);

    const randomRes = await SELF.fetch('http://example.com/api/words/random?length=6');
    expect(randomRes.status).toBe(200);
    const body = (await randomRes.json()) as { data: { word: { word: string } } };
    expect(body.data.word.word).toBe('KAPLAN');
  });
});

describe('POST /api/words/validate', () => {
  it('returns isValid true for a known word', async () => {
    const res = await SELF.fetch('http://example.com/api/words/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'KİTAP' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { isValid: boolean } };
    expect(body.data.isValid).toBe(true);
  });

  it('returns isValid false for an unknown word', async () => {
    const res = await SELF.fetch('http://example.com/api/words/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'YOKTUR' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { isValid: boolean } };
    expect(body.data.isValid).toBe(false);
  });

  it('returns 422 with VALIDATION_ERROR for missing word field', async () => {
    const res = await SELF.fetch('http://example.com/api/words/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/words/lengths', () => {
  it('should return the PLAYABLE_WORD_LENGTHS var when it is set', async () => {
    const res = await SELF.fetch('http://example.com/api/words/lengths');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { lengths: number[] } };
    // vitest.config.ts binds "6,5", which differs from the [5] default, so this proves the var is read.
    expect(body.data.lengths).toEqual([5, 6]);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await SELF.fetch('http://example.com/api/unknown');
    expect(res.status).toBe(404);
  });
});
