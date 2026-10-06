import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const HAS_SEEN_HELP_KEY = 'harfhane:has-seen-help';

// Fixed to a Turkey-time midday so getTodayString() (UTC+3) never flips
// mid-test, while real timers (splash screen, modal delays) keep ticking.
const FROZEN_TIME = new Date('2026-06-15T09:00:00.000Z');

interface WordStub {
  word: string;
  meaning?: string;
  context?: string;
  category?: 'isim' | 'sıfat' | 'fiil';
}

function toWordEntry(stub: WordStub): Record<string, unknown> {
  return {
    word: stub.word,
    meaning: stub.meaning ?? `${stub.word} anlamı`,
    context: stub.context ?? `${stub.word} bir örnek cümlede geçer.`,
    category: stub.category ?? 'isim',
  };
}

export interface ApiStub {
  stubDailyWord(wordLength: number, stub: WordStub, gameNumber?: number): Promise<void>;
  stubRandomWord(wordLength: number, stubs: WordStub[]): Promise<void>;
  stubValidate(isValidWord: (word: string) => boolean): Promise<void>;
  stubPlayableLengths(lengths: number[]): Promise<void>;
  stubPlayableLengthsFailure(): Promise<void>;
  stubPlayableLengthsDelayed(lengths: number[], delayMs: number): Promise<void>;
}

// Default: every scheduled length is playable, matching the world before
// Plan 008 R1 so existing specs that navigate directly to /daily/4, /daily/6
// or /unlimited/4 keep working without each one stubbing this endpoint.
const DEFAULT_PLAYABLE_LENGTHS = [4, 5, 6];

async function stubPlayableLengths(page: Page, lengths: number[]): Promise<void> {
  await page.route('**/api/words/lengths', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { lengths } }),
    });
  });
}

async function stubPlayableLengthsFailure(page: Page): Promise<void> {
  await page.route('**/api/words/lengths', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }),
    });
  });
}

// Proves the app waits for the real answer instead of guessing: the
// response is delayed so a test can assert nothing was fetched for a
// not-yet-confirmed length before it arrives.
async function stubPlayableLengthsDelayed(page: Page, lengths: number[], delayMs: number): Promise<void> {
  await page.route('**/api/words/lengths', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { lengths } }),
    });
  });
}

async function stubDailyWord(
  page: Page,
  wordLength: number,
  stub: WordStub,
  gameNumber = 42
): Promise<void> {
  await page.route('**/api/words/daily**', async (route) => {
    const url = new URL(route.request().url());
    const requestedLength = Number(url.searchParams.get('length') ?? '5');
    if (requestedLength !== wordLength) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { word: toWordEntry(stub), gameNumber, date: '2026-06-15' } }),
    });
  });
}

async function stubRandomWord(page: Page, wordLength: number, stubs: WordStub[]): Promise<void> {
  let callCount = 0;
  await page.route('**/api/words/random**', async (route) => {
    const url = new URL(route.request().url());
    const requestedLength = Number(url.searchParams.get('length') ?? '5');
    if (requestedLength !== wordLength) {
      await route.fallback();
      return;
    }
    const stub = stubs[Math.min(callCount, stubs.length - 1)]!;
    callCount += 1;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { word: toWordEntry(stub), wordId: callCount } }),
    });
  });
}

async function stubValidate(page: Page, isValidWord: (word: string) => boolean): Promise<void> {
  await page.route('**/api/words/validate', async (route) => {
    const { word } = route.request().postDataJSON() as { word: string };
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { isValid: isValidWord(word) } }),
    });
  });
}

export const test = base.extend<{ api: ApiStub }>({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(key, JSON.stringify(true));
      },
      { key: HAS_SEEN_HELP_KEY }
    );
    await page.clock.setFixedTime(FROZEN_TIME);
    // Safety net: any /api call a test didn't explicitly stub fails fast
    // instead of falling through vite preview's proxy to a real backend.
    // Routes registered later (the api.stubX calls below) take priority.
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'not_stubbed', message: 'e2e: unstubbed request' } }),
      });
    });
    // Default playable-lengths stub (every scheduled length), registered
    // after the catch-all so it wins; a test can still override it later
    // with api.stubPlayableLengths / stubPlayableLengthsFailure.
    await stubPlayableLengths(page, DEFAULT_PLAYABLE_LENGTHS);
    await use(page);
  },
  api: async ({ page }, use) => {
    await use({
      stubDailyWord: (wordLength, stub, gameNumber) => stubDailyWord(page, wordLength, stub, gameNumber),
      stubRandomWord: (wordLength, stubs) => stubRandomWord(page, wordLength, stubs),
      stubValidate: (isValidWord) => stubValidate(page, isValidWord),
      stubPlayableLengths: (lengths) => stubPlayableLengths(page, lengths),
      stubPlayableLengthsFailure: () => stubPlayableLengthsFailure(page),
      stubPlayableLengthsDelayed: (lengths, delayMs) => stubPlayableLengthsDelayed(page, lengths, delayMs),
    });
  },
});

export { expect };
