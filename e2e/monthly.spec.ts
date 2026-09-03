import { test, expect, type Route } from '@playwright/test';
import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from './helpers';

type MonthlyFixtureOptions = {
  fajr?: string;
  days?: number;
};

function monthlyFixture(url: URL, options: MonthlyFixtureOptions = {}) {
  const year = Number(url.searchParams.get('year')) || 2026;
  const month = Number(url.searchParams.get('month')) || 9;
  const days = options.days ?? new Date(year, month, 0).getDate();
  const fajr = options.fajr ?? '04:30';

  return {
    code: 200,
    data: Array.from({ length: days }, (_, index) => ({
      timings: {
        Fajr: fajr,
        Sunrise: '05:45',
        Dhuhr: '12:00',
        Asr: '15:20',
        Maghrib: '18:00',
        Isha: '19:15',
        Imsak: '04:20',
      },
      date: {
        gregorian: { date: `${String(index + 1).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}` },
        hijri: { day: String(index + 1), month: { en: 'Safar', ar: 'صفر' }, year: '1448' },
      },
      meta: {
        timezone: 'Asia/Jakarta',
        offset: 7,
        latitude: -6.1754,
        longitude: 106.8272,
        method: { name: 'Kemenag RI' },
      },
    })),
  };
}

async function fulfillMonthly(route: Route, payload: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockApplicationApis(page);
});

test('reloads the monthly schedule when settings or location changes', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  const monthlyRequests: URL[] = [];

  await page.route('**/api/prayer-times/monthly**', async (route) => {
    const url = new URL(route.request().url());
    monthlyRequests.push(url);
    await fulfillMonthly(route, monthlyFixture(url));
  });

  await page.goto('/monthly');
  await expect(page.getByRole('heading', { name: 'Jadwal Sholat Bulanan' })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toContainText('04:30');

  const settings = {
    method: '3',
    madhab: 'shafii',
    adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    timeFormat24h: true,
    theme: 'system',
    enableNotifications: false,
    notifyBeforeMinutes: 0,
    adhanSound: 'beep',
  };
  await page.evaluate((nextSettings) => {
    window.dispatchEvent(new CustomEvent('sholatku:settings-changed', { detail: nextSettings }));
  }, settings);
  await expect.poll(() => monthlyRequests.at(-1)?.searchParams.get('method')).toBe('3');

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('sholatku:settings-changed', {
      detail: {
        method: '3',
        madhab: 'hanafi',
        adjustments: { fajr: 1, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
        timeFormat24h: true,
        theme: 'system',
        enableNotifications: false,
        notifyBeforeMinutes: 0,
        adhanSound: 'beep',
      },
    }));
  });
  await expect.poll(() => monthlyRequests.some((request) => request.searchParams.get('school') === '1')).toBe(true);
  await expect(page.locator('tbody tr').first()).toContainText('04:31');

  await page.getByRole('button', { name: 'Jakarta, DKI Jakarta' }).click();
  const dialog = page.getByRole('dialog', { name: 'Pilih Lokasi Wilayah' });
  await dialog.getByRole('textbox').fill('Denpasar');
  await expect(dialog.getByRole('button', { name: /Denpasar/ }).first()).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole('button', { name: /Denpasar/ }).first().click();
  await expect(page.getByRole('button', { name: 'Denpasar, Bali' })).toBeVisible();
  // The service worker may own later API requests, so verify the observable
  // result as well as the location control itself rather than relying only on
  // page-level network interception.
  await expect(page.locator('tbody tr').first()).not.toContainText('04:31');

  await assertNoErrors();
});

test('keeps the newest monthly response when requests resolve out of order', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  const monthlyRequests: URL[] = [];

  await page.route('**/api/prayer-times/monthly**', async (route) => {
    const url = new URL(route.request().url());
    monthlyRequests.push(url);
    const method = url.searchParams.get('method');
    if (method === '3') await new Promise((resolve) => setTimeout(resolve, 300));
    await fulfillMonthly(route, monthlyFixture(url, { fajr: method === '4' ? '04:44' : method === '3' ? '04:33' : '04:30' }));
  });

  await page.goto('/monthly');
  await expect(page.locator('tbody tr').first()).toContainText('04:30');

  const dispatchSettings = async (method: '3' | '4') => page.evaluate((nextMethod) => {
    window.dispatchEvent(new CustomEvent('sholatku:settings-changed', {
      detail: {
        method: nextMethod,
        madhab: 'shafii',
        adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
        timeFormat24h: true,
        theme: 'system',
        enableNotifications: false,
        notifyBeforeMinutes: 0,
        adhanSound: 'beep',
      },
    }));
  }, method);

  await dispatchSettings('3');
  await dispatchSettings('4');
  await expect.poll(() => monthlyRequests.at(-1)?.searchParams.get('method')).toBe('4');
  await expect(page.locator('tbody tr').first()).toContainText('04:44');
  await assertNoErrors();
});

test('supports month rollover from December to January', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/monthly');

  const today = new Date();
  const nextMonthButton = page.getByRole('button', { name: 'Bulan berikutnya' });
  const previousMonthButton = page.getByRole('button', { name: 'Bulan sebelumnya' });
  for (let month = today.getMonth() + 1; month < 12; month += 1) {
    await nextMonthButton.click();
  }
  await expect(page.getByRole('heading', { name: `Desember ${today.getFullYear()}` })).toBeVisible();
  await nextMonthButton.click();
  await expect(page.getByRole('heading', { name: `Januari ${today.getFullYear() + 1}` })).toBeVisible();
  await previousMonthButton.click();
  await expect(page.getByRole('heading', { name: `Desember ${today.getFullYear()}` })).toBeVisible();

  await assertNoErrors();
});

test('shows an actionable error state when offline calculation is unavailable', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page, [/Failed to fetch monthly prayer schedule/, /Failed to load resource: the server responded with a status of 502/]);
  await page.addInitScript(() => {
    window.localStorage.setItem('sholatku_user_location_v1', JSON.stringify({
      city: 'Longyearbyen',
      province: 'Svalbard',
      country: 'Norway',
      latitude: 90,
      longitude: 0,
      timezone: 'UTC',
      isAutoDetected: false,
      displayName: 'Longyearbyen, Svalbard',
    }));
  });
  await page.route('**/api/prayer-times/monthly**', async (route) => {
    await fulfillMonthly(route, { code: 503, message: 'fixture provider unavailable' });
  });
  await page.route('https://api.aladhan.com/**', async (route) => {
    await fulfillMonthly(route, { code: 503, message: 'fixture provider unavailable' });
  });

  await page.goto('/monthly');
  const nextMonthButton = page.getByRole('button', { name: 'Bulan berikutnya' });
  const today = new Date();
  const monthsUntilDecember = (12 - (today.getMonth() + 1) + 12) % 12;
  for (let index = 0; index < monthsUntilDecember; index += 1) {
    await nextMonthButton.click();
  }
  const errorAlert = page.locator('[role="alert"]').filter({ hasText: 'Jadwal bulanan belum dapat dimuat.' });
  await expect(errorAlert).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Coba Lagi' }).click();
  await expect(errorAlert).toBeVisible();
  await assertNoErrors();
});
