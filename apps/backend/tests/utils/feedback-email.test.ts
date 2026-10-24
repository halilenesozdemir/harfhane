import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendFeedbackEmail } from '../../src/utils/feedback-email';
import type { FeedbackRow } from '../../src/repositories/feedback-repository';

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 1,
    created_at: '2026-10-24T00:00:00.000Z',
    kind: 'general',
    message: 'msg',
    contact: null,
    app_platform: 'android',
    app_version: null,
    mode: null,
    word_length: null,
    puzzle_date: null,
    reported_word: null,
    status: 'new',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendFeedbackEmail HTML escaping', () => {
  it('should escape an <a href=...> payload in message, reported_word and app_version', async () => {
    const payload = '<a href="https://evil.example">click</a>';
    let capturedHtml = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as { html: string };
        capturedHtml = body.html;
        return new Response(null, { status: 200 });
      })
    );

    const row = makeRow({
      kind: 'word_report',
      message: payload,
      mode: 'daily',
      word_length: 5,
      puzzle_date: '2026-10-23',
      reported_word: payload,
      contact: payload,
    });

    await sendFeedbackEmail('test-key', 'owner@example.com', row);

    expect(capturedHtml).not.toContain('<a href="https://evil.example">');
    expect(capturedHtml).not.toContain('<a ');
    expect(capturedHtml).toContain('&lt;a href=');
  });

  it('should escape a markup payload in app_version even without word_report fields', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    let capturedHtml = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as { html: string };
        capturedHtml = body.html;
        return new Response(null, { status: 200 });
      })
    );

    const row = makeRow({ app_version: payload });

    await sendFeedbackEmail('test-key', 'owner@example.com', row);

    expect(capturedHtml).not.toContain('<img ');
    expect(capturedHtml).toContain('&lt;img');
  });
});
