import { expect, test } from './support/fixtures';
import { keyButton, playGuess, tile } from './support/game';

test('unlimited mode can be won and "new word" starts a fresh game', async ({ page, api }) => {
  await api.stubRandomWord(5, [{ word: 'KALEM' }, { word: 'MASAL' }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/5');

  await playGuess(page, 'KALEM'.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });

  await keyButton(page, 'Tekrar Oyna').click();

  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).not.toBeVisible();
  await expect(tile(page, 5, 0, 0)).toHaveAttribute('data-status', 'empty');

  await playGuess(page, 'MASAL'.split(''));
  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
});
