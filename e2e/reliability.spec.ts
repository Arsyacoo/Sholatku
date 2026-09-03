import { test, expect } from '@playwright/test';
import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockApplicationApis(page);
});

test('renders the locally calculated schedule when both prayer providers fail', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  let localProviderCalls = 0;
  let directProviderCalls = 0;

  // Register these after the shared fixtures so the failure handlers take
  // precedence. The app must then exercise its local solar-math fallback.
  await page.route('**/api/prayer-times**', async (route) => {
    localProviderCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 503, message: 'fixture provider unavailable' }),
    });
  });
  await page.route('https://api.aladhan.com/**', async (route) => {
    directProviderCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 503, message: 'fixture provider unavailable' }),
    });
  });

  await page.goto('/');
  await expect(page.getByText('Jadwal Sholat Hari Ini', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Subuh', { exact: true })).toBeVisible();
  await expect(page.getByText('Jadwal sholat belum dapat dimuat.', { exact: true })).toHaveCount(0);
  expect(localProviderCalls).toBeGreaterThan(0);
  expect(directProviderCalls).toBeGreaterThan(0);

  await assertNoErrors();
});
