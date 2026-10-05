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
  return page.locator('[data-status]').nth(row * wordLength + col);
}

// useGameState blocks the next submit while the previous guess's tiles are
// still revealing (wordLength * 100 + 500ms, see hooks/useGameState.ts).
export async function waitForReveal(page: Page, wordLength: number): Promise<void> {
  await page.waitForTimeout(wordLength * 100 + 600);
}

export async function playGuess(page: Page, letters: string[]): Promise<void> {
  await typeOnScreen(page, letters);
  await submitOnScreen(page);
  await waitForReveal(page, letters.length);
}

// The board (and its window keydown listener) only mounts once the splash
// screen finishes, ~1.9s after navigation; wait for it before dispatching
// raw keyboard events, which skip Playwright's click-target auto-waiting.
export async function waitForBoardReady(page: Page): Promise<void> {
  await keyButton(page, 'ENTER').waitFor({ state: 'visible' });
}
