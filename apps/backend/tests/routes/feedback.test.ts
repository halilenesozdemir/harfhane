import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData } from '../helpers/db';

beforeEach(async () => {
  await applySchema(env.DB);
});

async function postFeedback(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return SELF.fetch('http://example.com/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/feedback', () => {
  it('should store a general feedback row and return 201 (013-AE1)', async () => {
    const res = await postFeedback({ kind: 'general', message: 'Harika oyun!', app_platform: 'web' });
    expect(res.status).toBe(201);

    const body = (await res.json()) as { data: { feedback: { id: number } } };
    const row = await env.DB.prepare('SELECT message FROM feedback WHERE id = ?').bind(body.data.feedback.id).first();
    expect(row).not.toBeNull();
  });

  it('should accept a matching daily word_report and reject a mismatching one (013-AE3)', async () => {
    await seedTestData(env.DB);
    const matchInput = {
      kind: 'word_report',
      message: 'bu kelime tekrar çıktı',
      app_platform: 'android',
      mode: 'daily',
      word_length: 5,
      puzzle_date: '2026-01-02',
      reported_word: 'KALEM',
    };
    const okRes = await postFeedback(matchInput);
    expect(okRes.status).toBe(201);

    const mismatchRes = await postFeedback({ ...matchInput, reported_word: 'MASAL' });
    expect(mismatchRes.status).toBe(422);

    const rows = await env.DB.prepare('SELECT reported_word FROM feedback').all<{ reported_word: string }>();
    expect(rows.results.map((r) => r.reported_word)).toEqual(['KALEM']);
  });

  it('should return 422 for a future puzzle_date without storing anything (013-AE4)', async () => {
    await seedTestData(env.DB);
    const res = await postFeedback({
      kind: 'word_report',
      message: 'yarının kelimesi ne',
      app_platform: 'android',
      mode: 'daily',
      word_length: 5,
      puzzle_date: '2099-01-01',
      reported_word: 'KALEM',
    });

    expect(res.status).toBe(422);
    expect((await env.DB.prepare('SELECT id FROM feedback').all()).results).toHaveLength(0);
  });

  it('should rate limit the 6th request from the same IP within the window (013-AE5)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const res = await postFeedback(
        { kind: 'general', message: `deneme ${i}`, app_platform: 'web' },
        { 'CF-Connecting-IP': '203.0.113.9' }
      );
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
  });
});
