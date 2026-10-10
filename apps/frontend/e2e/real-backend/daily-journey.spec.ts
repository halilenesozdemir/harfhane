import { expect, test } from './support/fixtures';
import { playGuess, tile, waitForBoardReady } from '../support/game';
import { assertNoSeriousA11yViolations } from '../support/axe';

// Keep in sync with REAL_BACKEND_API_PORT in ../../playwright.config.ts and
// scripts/test-e2e-real-backend.mjs (root).
const REAL_BACKEND_API_PORT = 8788;

// The solution is read from the real GET /api/words/daily response rather
// than hardcoded: apps/backend/tests/fixtures/e2e-seed.sql seeds yesterday,
// today and tomorrow's Turkey day so a run straddling the midnight rollover
// still finds a word, and this keeps the guess in sync with whichever day's
// word the backend actually serves.
test('loads the daily game and validates a guess through the real backend (009-AE3)', async ({ page }) => {
  const dailyResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/words/daily') && res.request().method() === 'GET'
  );

  await page.goto('/daily/5');
  await waitForBoardReady(page);

  const dailyResponse = await dailyResponsePromise;
  expect(dailyResponse.ok()).toBe(true);
  const dailyBody = (await dailyResponse.json()) as { data: { word: { word: string } } };
  const solution = dailyBody.data.word.word;

  const validateResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/words/validate') && res.request().method() === 'POST'
  );

  await playGuess(page, solution.split(''));

  const validateResponse = await validateResponsePromise;
  expect(validateResponse.ok()).toBe(true);
  // The real backend never ran through api.stubValidate (or any page.route
  // stub); a future accidental stub would still return a well-formed body,
  // but it could not have come from this real backend's own port.
  expect(new URL(validateResponse.url()).port).toBe(String(REAL_BACKEND_API_PORT));
  const body = (await validateResponse.json()) as { data: { isValid: boolean } };
  expect(body.data.isValid).toBe(true);

  for (let col = 0; col < solution.length; col += 1) {
    await expect(tile(page, solution.length, 0, col)).toHaveAttribute('data-status', 'correct');
  }
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });

  await assertNoSeriousA11yViolations(page);
});
