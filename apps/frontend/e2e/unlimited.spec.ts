import { expect, test } from './support/fixtures';
import { assertNoSeriousA11yViolations } from './support/axe';
import { forceClipboardShareFallback, getCopiedShareText, keyButton, playGuess, tile, waitForBoardReady } from './support/game';

test('unlimited mode can be won and "new word" starts a fresh game (009-AE2)', async ({ page, api }) => {
  await api.stubRandomWord(5, [{ word: 'KALEM' }, { word: 'MASAL' }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/5');
  await waitForBoardReady(page);
  await assertNoSeriousA11yViolations(page);

  await playGuess(page, 'KALEM'.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
  // Key state: the unlimited game-over modal, which (unlike the daily one)
  // also renders the "Yeni kelime" button.
  await assertNoSeriousA11yViolations(page);

  await keyButton(page, 'Yeni kelime').click();

  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).not.toBeVisible();
  await expect(tile(page, 5, 0, 0)).toHaveAttribute('data-status', 'empty');

  await playGuess(page, 'MASAL'.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
});

test('unlimited mode shows no hint button (FREE_UNLIMITED_HINTS = 0)', async ({ page, api }) => {
  await api.stubRandomWord(5, [{ word: 'KALEM' }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/5');
  await waitForBoardReady(page);

  await expect(page.getByRole('button', { name: 'İpucu göster' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'İpucu kullanıldı' })).not.toBeVisible();
});

test('share text footer reads "İpucusuz" in unlimited mode (011-AE6)', async ({ page, api }) => {
  await api.stubRandomWord(5, [{ word: 'KALEM' }]);
  await api.stubValidate(() => true);
  await forceClipboardShareFallback(page);

  await page.goto('/unlimited/5');
  await waitForBoardReady(page);

  await playGuess(page, 'KALEM'.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /Sonucu paylaş/ }).click();
  const copiedText = await getCopiedShareText(page);
  const lines = copiedText.split('\n');
  expect(lines[lines.length - 2]).toBe('İpucusuz');
});
