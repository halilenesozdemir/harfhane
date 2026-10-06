import type { Locator, Page } from '@playwright/test';

export function keyButton(page: Page, label: string): Locator {
  return page.getByRole('button', { name: label, exact: true });
}

export async function typeOnScreen(page: Page, letters: string[]): Promise<void> {
  for (const letter of letters) {
    await keyButton(page, letter).click();
  }
}

export async function submitOnScreen(page: Page): Promise<void> {
  await keyButton(page, 'ENTER').click();
}

export async function backspaceOnScreen(page: Page): Promise<void> {
  await keyButton(page, 'BACKSPACE').click();
}

// The window keydown listener (useGameState) is what a real keyboard drives;
// dispatching the event directly exercises that exact path for Turkish
// letters Playwright's own key-press layout cannot type (ı, ş, ğ, ö, ç, İ).
export async function pressPhysicalKey(page: Page, keyValue: string): Promise<void> {
  await page.evaluate((value) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: value }));
  }, keyValue);
}

export function tile(page: Page, wordLength: number, row: number, col: number): Locator {
  return page.getByTestId('tile').nth(row * wordLength + col);
}

// useGameState blocks the next submit until the tile-reveal timer clears
// (wordLength * 100 + 500ms after the guess is evaluated, see
// hooks/useGameState.ts). That timer only starts once /words/validate
// resolves, so waiting on the response first removes the race with
// network latency before adding the fixed animation margin.
export async function waitForReveal(page: Page, wordLength: number): Promise<void> {
  await page.waitForTimeout(wordLength * 100 + 600);
}

export async function submitAndWaitForReveal(page: Page, wordLength: number): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/words/validate') && res.request().method() === 'POST'
    ),
    submitOnScreen(page),
  ]);
  await response.finished();
  await waitForReveal(page, wordLength);
}

export async function playGuess(page: Page, letters: string[]): Promise<void> {
  await typeOnScreen(page, letters);
  await submitAndWaitForReveal(page, letters.length);
}

// The board (and its window keydown listener) only mounts once the splash
// screen finishes (capped at ~600ms after navigation, R6); wait for it
// before dispatching raw keyboard events, which skip Playwright's
// click-target auto-waiting.
export async function waitForBoardReady(page: Page): Promise<void> {
  await keyButton(page, 'ENTER').waitFor({ state: 'visible' });
}

// Forces useShare's clipboard fallback path: deletes navigator.share so the
// headless browser's inconsistent Web Share availability cannot make a
// share-text assertion flaky, and records whatever gets copied on window.
// Call before page.goto().
export async function forceClipboardShareFallback(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: (text: string) => {
          (window as unknown as { __copiedText: string }).__copiedText = text;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
}

export async function getCopiedShareText(page: Page): Promise<string> {
  await page.waitForFunction(() => (window as unknown as { __copiedText?: string }).__copiedText);
  return page.evaluate(() => (window as unknown as { __copiedText: string }).__copiedText);
}
