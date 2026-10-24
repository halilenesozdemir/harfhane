import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema } from '../helpers/db';

beforeEach(async () => {
  await applySchema(env.DB);
});

async function postFeedback(body: Record<string, unknown>) {
  return SELF.fetch('http://example.com/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/feedback word_report validation', () => {
  it('should accept an unlimited word_report without puzzle_date (013-R2)', async () => {
    const res = await postFeedback({
      kind: 'word_report',
      message: 'Bu kelime bende hiç karşılaşmadı.',
      app_platform: 'android',
      mode: 'unlimited',
      word_length: 5,
      reported_word: 'KALEM',
    });

    expect(res.status).toBe(201);
  });

  it('should reject a daily word_report without puzzle_date', async () => {
    const res = await postFeedback({
      kind: 'word_report',
      message: 'x',
      app_platform: 'android',
      mode: 'daily',
      word_length: 5,
      reported_word: 'KALEM',
    });

    expect(res.status).toBe(422);
  });

  it('should reject an unlimited word_report missing reported_word or word_length', async () => {
    const res = await postFeedback({
      kind: 'word_report',
      message: 'x',
      app_platform: 'android',
      mode: 'unlimited',
    });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/feedback app_version validation', () => {
  it('should reject an app_version containing markup', async () => {
    const res = await postFeedback({
      kind: 'general',
      message: 'x',
      app_platform: 'android',
      app_version: '<img src=x onerror=alert(1)>',
    });

    expect(res.status).toBe(422);
  });

  it('should accept a well-formed semver-like app_version', async () => {
    const res = await postFeedback({
      kind: 'general',
      message: 'x',
      app_platform: 'android',
      app_version: '1.4.2+build.7',
    });

    expect(res.status).toBe(201);
  });
});
