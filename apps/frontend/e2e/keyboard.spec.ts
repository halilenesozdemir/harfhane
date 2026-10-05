import { expect, test } from './support/fixtures';
import {
  keyButton,
  playGuess,
  pressPhysicalKey,
  submitAndWaitForReveal,
  tile,
  typeOnScreen,
  waitForBoardReady,
} from './support/game';

test('on-screen keyboard distinguishes İ (dotted) from I (dotless)', async ({ page, api }) => {
  const solution = 'KAPI';
  await api.stubRandomWord(4, [{ word: solution }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/4');
  await waitForBoardReady(page);

  await typeOnScreen(page, ['K', 'A', 'P']);
  await keyButton(page, 'İ').click();
  await submitAndWaitForReveal(page, 4);

  const dottedTile = tile(page, 4, 0, 3);
  await expect(dottedTile).toHaveText('İ');
  await expect(dottedTile).not.toHaveAttribute('data-status', 'correct');

  await playGuess(page, solution.split(''));

  const dotlessTile = tile(page, 4, 1, 3);
  await expect(dotlessTile).toHaveText('I');
  await expect(dotlessTile).toHaveAttribute('data-status', 'correct');
});

test('the physical keyboard types letters, backspace, enter and both İ/ı forms', async ({ page, api }) => {
  // Contains both the dotless (ı→I) and dotted (i→İ) forms so one guess
  // exercises both physical-key mappings in @harfhane/shared's normalizeChar.
  const solution = 'KAPIİ';
  await api.stubRandomWord(5, [{ word: solution }]);
  await api.stubValidate(() => true);

  await page.goto('/unlimited/5');
  await waitForBoardReady(page);

  await page.keyboard.press('z');
  await page.keyboard.press('Backspace');

  await page.keyboard.press('k');
  await page.keyboard.press('a');
  await page.keyboard.press('p');
  await pressPhysicalKey(page, 'ı');
  await pressPhysicalKey(page, 'i');

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/words/validate') && res.request().method() === 'POST'
    ),
    page.keyboard.press('Enter'),
  ]);
  await response.finished();

  await expect(page.getByRole('heading', { name: 'Tebrikler!' })).toBeVisible({ timeout: 10_000 });
});
