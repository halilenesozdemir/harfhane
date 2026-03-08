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

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await SELF.fetch('http://example.com/api/unknown');
    expect(res.status).toBe(404);
  });
});
