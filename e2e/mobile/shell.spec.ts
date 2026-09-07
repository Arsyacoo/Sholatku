import { expect, test } from '@playwright/test';

import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from '../helpers';

test('renders the real mobile shell routes and keeps API traffic on staging origin', async ({ page }) => {
  const serviceWorkerRequests: string[] = [];
  const apiRequests: string[] = [];

  await clearBrowserStorage(page);
  await page.addInitScript(() => {
    const capacitorMock = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
    };

    Object.defineProperty(globalThis, 'Capacitor', {
      configurable: true,
      enumerable: true,
      get: () => capacitorMock,
      set: () => undefined,
    });
  });

  const assertNoConsoleErrors = installConsoleGuards(page);

  page.on('request', (request) => {
    const url = request.url();
    if (new URL(url).pathname === '/sw.js') serviceWorkerRequests.push(url);
    if (url.includes('/api/')) apiRequests.push(url);
  });

  await mockApplicationApis(page);

  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Hari Ini' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Jadwal Sholat Hari Ini' })).toBeVisible();
  await expect(page.getByTestId('prayer-schedule-list')).toBeVisible();
  await expect(page.getByText('Jakarta, DKI Jakarta')).toBeVisible();

  await page.getByRole('link', { name: "Al-Qur'an" }).click();
  await expect(page).toHaveURL(/\/quran$/);
  await expect(page.getByRole('link', { name: "Al-Qur'an" })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByLabel("Cari ayat, surat, atau terjemahan Al-Qur'an")).toBeVisible();

  await page.getByLabel("Cari ayat, surat, atau terjemahan Al-Qur'an").fill('sabar');
  await expect(page.getByRole('heading', { name: 'Hasil pencarian' })).toBeVisible();
  await expect(page.getByText('Jadikanlah sabar dan shalat sebagai penolongmu.')).toBeVisible();
  await page.getByRole('link', { name: 'Buka Al-Baqarah ayat 153' }).click();
  await expect(page).toHaveURL(/\/quran\/2\?ayah=153$/);
  await expect(page.getByRole('heading', { name: 'Al-Baqarah' })).toBeVisible();
  await expect(page.locator('#ayah-153')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/quran(\?q=sabar)?$/);
  await expect(page.getByRole('link', { name: "Al-Qur'an" })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Bulanan' }).click();
  await expect(page).toHaveURL(/\/monthly$/);
  await expect(page.getByRole('heading', { name: 'Jadwal Sholat Bulanan' })).toBeVisible();
  await expect(page.locator('table')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bulanan' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Kiblat', exact: true }).click();
  await expect(page).toHaveURL(/\/qibla$/);
  await expect(page.getByRole('heading', { name: 'Kompas Arah Kiblat' })).toBeVisible();
  await expect(page.getByText("Jarak ke Ka'bah")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kiblat', exact: true })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: /Setelan|Pengaturan/ }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible();
  await expect(page.getByText('Metode Hisab / Perhitungan')).toBeVisible();
  await expect(page.getByText('Tema Tampilan')).toBeVisible();
  await expect(page.getByRole('link', { name: /Setelan|Pengaturan/ })).toHaveAttribute('aria-current', 'page');

  await page.goto('/ramadan');
  await expect(page).toHaveURL(/\/ramadan$/);
  await expect(page.getByRole('heading', { name: 'Imsakiyah' })).toBeVisible();
  await expect(page.getByText('Imsak dihitung')).toBeVisible();

  await page.getByRole('link', { name: 'Hari Ini' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Jadwal Sholat Hari Ini' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hari Ini' })).toHaveAttribute('aria-current', 'page');

  expect(apiRequests.some((url) => url.includes('/api/prayer-times'))).toBe(true);
  expect(apiRequests.some((url) => url.includes('/api/quran/search'))).toBe(true);
  expect(apiRequests.some((url) => url.includes('/api/quran/surah/2'))).toBe(true);
  expect(serviceWorkerRequests).toEqual([]);

  await assertNoConsoleErrors();
});
