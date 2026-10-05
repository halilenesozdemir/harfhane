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
    await use(page);
  },
  api: async ({ page }, use) => {
    await use({
      stubDailyWord: (wordLength, stub, gameNumber) => stubDailyWord(page, wordLength, stub, gameNumber),
      stubRandomWord: (wordLength, stubs) => stubRandomWord(page, wordLength, stubs),
      stubValidate: (isValidWord) => stubValidate(page, isValidWord),
    });
  },
});

export { expect };
