import { expect, test } from './support/fixtures';
import { playGuess, tile, waitForBoardReady } from '../support/game';

// Matches apps/backend/tests/fixtures/e2e-seed.sql, which schedules this word
// as today's 5-letter daily word against the real local D1.
const SOLUTION = 'KALEM';

test('loads the daily game and validates a guess through the real backend (009-AE3)', async ({ page }) => {
  await page.goto('/daily/5');
  await waitForBoardReady(page);

  const validateResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/words/validate') && res.request().method() === 'POST'
  );

  await playGuess(page, SOLUTION.split(''));

  const validateResponse = await validateResponsePromise;
  expect(validateResponse.ok()).toBe(true);
  const body = (await validateResponse.json()) as { data: { isValid: boolean } };
  expect(body.data.isValid).toBe(true);

  for (let col = 0; col < SOLUTION.length; col += 1) {
    await expect(tile(page, SOLUTION.length, 0, col)).toHaveAttribute('data-status', 'correct');
  }
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
});
