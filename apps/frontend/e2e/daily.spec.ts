import { expect, test } from './support/fixtures';
import { assertNoSeriousA11yViolations } from './support/axe';
import {
  backspaceOnScreen,
  forceClipboardShareFallback,
  getCopiedShareText,
  playGuess,
  submitAndWaitForReveal,
  tile,
  typeOnScreen,
  waitForBoardReady,
} from './support/game';

const DAILY_WORDS: Record<4 | 5 | 6, { solution: string; wrongGuess: string }> = {
  4: { solution: 'MASA', wrongGuess: 'KAPI' },
  5: { solution: 'KALEM', wrongGuess: 'TAVUK' },
  6: { solution: 'KAPLAN', wrongGuess: 'SANDIK' },
};

for (const wordLength of [4, 5, 6] as const) {
  test(`daily mode (${wordLength} letters) can be won (009-AE2)`, async ({ page, api }) => {
    const { solution, wrongGuess } = DAILY_WORDS[wordLength];
    await api.stubDailyWord(wordLength, { word: solution });
    await api.stubValidate(() => true);

    await page.goto(`/daily/${wordLength}`);

    // Type a typo, fix it with on-screen backspace, then submit.
    await typeOnScreen(page, wrongGuess.split(''));
    await backspaceOnScreen(page);
    await typeOnScreen(page, [wrongGuess.slice(-1)]);
    // Key state: a guess sits on the board, unsubmitted — scan before
    // the submit resolves and the board re-renders for the next guess.
    await assertNoSeriousA11yViolations(page);
    await submitAndWaitForReveal(page, wordLength);
    await expect(tile(page, wordLength, 0, 0)).toHaveAttribute('data-status', /correct|present|absent/);

    await playGuess(page, solution.split(''));

    await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
    for (let col = 0; col < wordLength; col += 1) {
      await expect(tile(page, wordLength, 1, col)).toHaveAttribute('data-status', 'correct');
    }
    // Key state: the game-over modal is open on top of the board.
    await assertNoSeriousA11yViolations(page);
  });
}

test('daily mode shows the solution after six wrong guesses', async ({ page, api }) => {
  const solution = 'KALEM';
  const wrongGuesses = ['AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF'];
  await api.stubDailyWord(5, { word: solution });
  await api.stubValidate(() => true);

  await page.goto('/daily/5');

  for (const guess of wrongGuesses) {
    await playGuess(page, guess.split(''));
  }

  await expect(page.getByText(`Kelime: ${solution}`)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Oyun Bitti' })).toBeVisible({ timeout: 10_000 });
});

test('an invalid word shows an error toast instead of being submitted', async ({ page, api }) => {
  await api.stubDailyWord(5, { word: 'KALEM' });
  await api.stubValidate((word) => word !== 'ZZZZZ');

  await page.goto('/daily/5');

  await playGuess(page, 'ZZZZZ'.split(''));

  await expect(page.getByText('Kelime listede yok')).toBeVisible();
  // The rejected guess stays on the board (unsubmitted) so the player can fix it.
  await expect(tile(page, 5, 0, 0)).toHaveAttribute('data-status', 'filled');
});

test('revealing the hint shows a letter pill and marks the board tile', async ({ page, api }) => {
  const solution = 'KALEM';
  await api.stubDailyWord(5, { word: solution });
  await api.stubValidate(() => true);

  await page.goto('/daily/5');

  const hintButton = page.getByRole('button', { name: 'İpucu göster' });
  await expect(hintButton).toBeVisible();
  await hintButton.click();

  await expect(page.getByText(/\d\. harf: [A-ZÇĞİÖŞÜ]/)).toBeVisible();
  const hintedTile = page.locator('[data-hint="true"]');
  await expect(hintedTile).toHaveCount(1);

  // Once a hint is revealed, the pill replaces the button entirely (no second
  // press is possible because there is no button left to press).
  await expect(hintButton).not.toBeVisible();
});

test('the hint only counts submitted guesses, not the unsubmitted current guess', async ({ page, api }) => {
  const solution = 'KALEM';
  await api.stubDailyWord(5, { word: solution });
  await api.stubValidate(() => true);

  await page.goto('/daily/5');
  await waitForBoardReady(page);

  // KAPAK already places K and A correctly, so the real leftmost-unsolved
  // position is L at index 2 before anything else happens.
  await playGuess(page, 'KAPAK'.split(''));

  // Type "KAL" into the next row WITHOUT submitting. A hint computed over
  // guesses + currentGuess would wrongly treat index 2 (L) as solved too and
  // skip ahead to E; the real hint must still land on L.
  await typeOnScreen(page, ['K', 'A', 'L']);

  await page.getByRole('button', { name: 'İpucu göster' }).click();

  await expect(page.getByText('3. harf: L')).toBeVisible();
});

test('a hint revealed in daily mode does not leak into unlimited mode', async ({ page, api }) => {
  await api.stubDailyWord(5, { word: 'KALEM' });
  await api.stubRandomWord(5, [{ word: 'MASAL' }]);
  await api.stubValidate(() => true);

  await page.goto('/daily/5');
  await page.getByRole('button', { name: 'İpucu göster' }).click();
  await expect(page.locator('[data-hint="true"]')).toHaveCount(1);

  await page.goto('/unlimited/5');
  await waitForBoardReady(page);

  await expect(page.locator('[data-hint="true"]')).toHaveCount(0);
});

test('a hint survives a reload without granting a fresh one', async ({ page, api }) => {
  const solution = 'KALEM';
  await api.stubDailyWord(5, { word: solution });
  await api.stubValidate(() => true);

  await page.goto('/daily/5');
  await page.getByRole('button', { name: 'İpucu göster' }).click();

  const pill = page.getByText(/\d\. harf: [A-ZÇĞİÖŞÜ]/);
  const pillTextBefore = await pill.textContent();

  await page.reload();

  await expect(page.getByText(pillTextBefore!)).toBeVisible();
  await expect(page.locator('[data-hint="true"]')).toHaveCount(1);
});

test('share text header ends with "· ipucu" when a hint was revealed (011-AE6)', async ({ page, api }) => {
  const solution = 'KALEM';
  await api.stubDailyWord(5, { word: solution });
  await api.stubValidate(() => true);
  await forceClipboardShareFallback(page);

  await page.goto('/daily/5');
  await page.getByRole('button', { name: 'İpucu göster' }).click();

  await playGuess(page, solution.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /Paylaş/ }).click();
  const copiedText = await getCopiedShareText(page);
  const headerLine = copiedText.split('\n')[0]!;
  expect(headerLine.endsWith('· ipucu')).toBe(true);
});

test('share text header does not mention "ipucu" when the hint was available but never pressed (011-AE6)', async ({ page, api }) => {
  const solution = 'KALEM';
  await api.stubDailyWord(5, { word: solution });
  await api.stubValidate(() => true);
  await forceClipboardShareFallback(page);

  await page.goto('/daily/5');
  // The hint button is visible (available) but deliberately left unpressed:
  // this is what distinguishes GamePage wiring `hintUsed` from `hintAvailable`.
  await expect(page.getByRole('button', { name: 'İpucu göster' })).toBeVisible();

  await playGuess(page, solution.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /Paylaş/ }).click();
  const copiedText = await getCopiedShareText(page);
  const headerLine = copiedText.split('\n')[0]!;
  expect(headerLine).not.toContain('ipucu');
});

test('a finished daily game survives a reload', async ({ page, api }) => {
  const solution = 'MASA';
  await api.stubDailyWord(4, { word: solution });
  await api.stubValidate(() => true);

  await page.goto('/daily/4');
  await playGuess(page, solution.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });

  await page.reload();

  for (let col = 0; col < 4; col += 1) {
    await expect(tile(page, 4, 0, col)).toHaveAttribute('data-status', 'correct');
  }
  // The game-over modal reappears for an already-finished game on mount
  // (useGameModals), proving the restored state is "won", not just the tiles.
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
});
