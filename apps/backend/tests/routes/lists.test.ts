import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData } from '../helpers/db';

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
});

describe('GET /api/lists/:slug/daily', () => {
  it('returns 200 with deterministic daily word', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/nurdle/daily?date=2026-01-01');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { word: { word: string }; gameNumber: number; date: string } };
    expect(body.data.word.word).toBeDefined();
    expect(body.data.gameNumber).toBe(1);
    expect(body.data.date).toBe('2026-01-01');
  });

  it('returns same word for same date', async () => {
    const res1 = await SELF.fetch('http://example.com/api/lists/nurdle/daily?date=2026-01-05');
    const res2 = await SELF.fetch('http://example.com/api/lists/nurdle/daily?date=2026-01-05');
    const body1 = await res1.json() as { data: { word: { word: string } } };
    const body2 = await res2.json() as { data: { word: { word: string } } };
    expect(body1.data.word.word).toBe(body2.data.word.word);
  });

  it('returns 400 for invalid date format', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/nurdle/daily?date=notadate');
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 for unknown slug', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/bilinmeyen/daily?date=2026-01-01');
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/lists/:slug/validate', () => {
  it('returns isValid true for word in list', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/test-list/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'kitap' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { isValid: boolean } };
    expect(body.data.isValid).toBe(true);
  });

  it('returns isValid false for word not in list or tdk', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/test-list/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'YOKTUR' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { isValid: boolean } };
    expect(body.data.isValid).toBe(false);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/bilinmeyen/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'kitap' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 422 for missing word body', async () => {
    const res = await SELF.fetch('http://example.com/api/lists/test-list/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });
});
