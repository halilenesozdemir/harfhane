import { expect, test } from './support/fixtures';

test('home page loads with daily and unlimited mode entry points', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'HARFHANE' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Günlük Oyun' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sınırsız Mod' })).toBeVisible();
});

for (const legacyPath of ['/lists', '/play/eski-liste', '/tournament']) {
  test(`${legacyPath} redirects home`, async ({ page }) => {
    await page.goto(legacyPath);

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'HARFHANE' })).toBeVisible();
  });
}

// AE1: with only length 5 playable, the home page offers no length picker
// and /daily/6 redirects to /daily/5.
test('home page hides the unlimited length picker when only one length is playable', async ({ page, api }) => {
  await api.stubPlayableLengths([5]);

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Günlük Oyun' })).toBeVisible();
  await expect(page.getByRole('button', { name: '4 harf' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '6 harf' })).not.toBeVisible();
});

test('/daily/6 redirects to /daily/5 when 6 is not playable', async ({ page, api }) => {
  await api.stubPlayableLengths([5]);
  await api.stubDailyWord(5, { word: 'KALEM' });

  await page.goto('/daily/6');

  await expect(page).toHaveURL('/daily/5');
});

// AE2: when the lengths request fails, clients fall back to [5] and still start a game.
test('a failed lengths request falls back to 5 and still starts the daily game', async ({ page, api }) => {
  await api.stubPlayableLengthsFailure();
  await api.stubDailyWord(5, { word: 'KALEM' });

  await page.goto('/daily/5');

  await expect(page).toHaveURL('/daily/5');
  await expect(page.getByRole('banner').getByText('Günlük')).toBeVisible();
});
