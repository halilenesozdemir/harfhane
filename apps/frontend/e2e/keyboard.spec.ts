import { expect, test } from './support/fixtures';
import {
  keyButton,
  playGuess,
  pressPhysicalKey,
  submitOnScreen,
  tile,
  typeOnScreen,
  waitForBoardReady,
  waitForReveal,
} from './support/game';

test('on-screen keyboard distinguishes İ (dotted) from I (dotless)', async ({ page, api }) => {
  const solution = 'KAPI';
  await api.stubRandomWord(4, [{ word: solution }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/4');
  await waitForBoardReady(page);

  await typeOnScreen(page, ['K', 'A', 'P']);
  await keyButton(page, 'İ').click();
  await submitOnScreen(page);
  await waitForReveal(page, 4);

  const dottedTile = tile(page, 4, 0, 3);
  await expect(dottedTile).toHaveText('İ');
  await expect(dottedTile).not.toHaveAttribute('data-status', 'correct');

  await playGuess(page, solution.split(''));

  const dotlessTile = tile(page, 4, 1, 3);
  await expect(dotlessTile).toHaveText('I');
  await expect(dotlessTile).toHaveAttribute('data-status', 'correct');
});

test('the physical keyboard types letters, backspace, enter and Turkish characters', async ({ page, api }) => {
  const solution = 'ÇİÇEK';
  await api.stubRandomWord(5, [{ word: solution }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/5');
  await waitForBoardReady(page);

  await page.keyboard.press('z');
  await page.keyboard.press('Backspace');

  await pressPhysicalKey(page, 'ç');
  await pressPhysicalKey(page, 'i');
  await pressPhysicalKey(page, 'ç');
  await page.keyboard.press('e');
  await page.keyboard.press('k');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
});
