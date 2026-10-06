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
