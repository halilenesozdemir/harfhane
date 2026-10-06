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

test('(008-AE1) home page hides the unlimited length picker when only one length is playable', async ({ page, api }) => {
  await api.stubPlayableLengths([5]);

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Günlük Oyun' })).toBeVisible();
  await expect(page.getByRole('button', { name: '4 harf', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '5 harf', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '6 harf', exact: true })).not.toBeVisible();
});

test('(008-AE1) home page shows exactly the playable lengths, hiding the others', async ({ page, api }) => {
  await api.stubPlayableLengths([4, 5]);

  await page.goto('/');

  await expect(page.getByRole('button', { name: '4 harf', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '5 harf', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '6 harf', exact: true })).not.toBeVisible();
});

test('(008-AE1) /daily/6 redirects to /daily/5 when 6 is not playable', async ({ page, api }) => {
  await api.stubPlayableLengths([5]);
  await api.stubDailyWord(5, { word: 'KALEM' });

  await page.goto('/daily/6');

  await expect(page).toHaveURL('/daily/5');
});

test('(008-AE1) a delayed playable-lengths response blocks fetching the unconfirmed length before redirecting', async ({ page, api }) => {
  const dailyRequestLengths: number[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/words/daily')) {
      dailyRequestLengths.push(Number(url.searchParams.get('length') ?? '5'));
    }
  });
  await api.stubPlayableLengthsDelayed([5], 500);
  await api.stubDailyWord(5, { word: 'KALEM' });

  await page.goto('/daily/6');
  await page.waitForTimeout(150);
  expect(dailyRequestLengths).toEqual([]);

  await expect(page).toHaveURL('/daily/5', { timeout: 5000 });
  expect(dailyRequestLengths).toEqual([5]);
});

const DEFAULT_LENGTH_CASES = [
  { stub: [4, 5, 6], expectedDefault: 5 },
  { stub: [4, 6], expectedDefault: 4 },
] as const;

for (const { stub, expectedDefault } of DEFAULT_LENGTH_CASES) {
  test(`(008-AE1) clicking Günlük Oyun starts length ${expectedDefault} when playable=[${stub.join(',')}]`, async ({ page, api }) => {
    await api.stubPlayableLengths([...stub]);
    await api.stubDailyWord(expectedDefault, { word: 'KALEM' });

    await page.goto('/');
    await page.getByRole('button', { name: 'Günlük Oyun' }).click();

    await expect(page).toHaveURL(`/daily/${expectedDefault}`);
  });

  test(`(008-AE1) a bare /daily plays length ${expectedDefault} when playable=[${stub.join(',')}]`, async ({ page, api }) => {
    await api.stubPlayableLengths([...stub]);
    await api.stubDailyWord(expectedDefault, { word: 'KALEM' });

    await page.goto('/daily');

    await expect(page.getByTestId('tile')).toHaveCount(6 * expectedDefault);
  });

  test(`(008-AE1) /daily/7 redirects to length ${expectedDefault} when playable=[${stub.join(',')}]`, async ({ page, api }) => {
    await api.stubPlayableLengths([...stub]);
    await api.stubDailyWord(expectedDefault, { word: 'KALEM' });

    await page.goto('/daily/7');

    await expect(page).toHaveURL(`/daily/${expectedDefault}`);
  });
}

test('(008-AE2) a failed lengths request falls back to 5 and still starts the daily game', async ({ page, api }) => {
  await api.stubPlayableLengthsFailure();
  await api.stubDailyWord(5, { word: 'KALEM' });

  await page.goto('/daily/5');

  await expect(page).toHaveURL('/daily/5');
  await expect(page.getByRole('banner').getByText('Günlük')).toBeVisible();
});

test('(008-AE2) a bare /daily with a failing lengths request plays the 5-letter game promptly', async ({ page, api }) => {
  await api.stubPlayableLengthsFailure();
  await api.stubDailyWord(5, { word: 'KALEM' });

  await page.goto('/daily');

  // retry: false must keep the fallback fast; a retrying query would still
  // resolve eventually but well past this short timeout.
  await expect(page.getByTestId('tile')).toHaveCount(6 * 5, { timeout: 3000 });
});
