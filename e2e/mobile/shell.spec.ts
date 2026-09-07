import { expect, test } from '@playwright/test';

const STAGING_ORIGIN = 'https://sholatku-staging.vercel.app';

test('boots the local Android shell, uses local storage, and calls the staged BFF', async ({ page }) => {
  const serviceWorkerRequests: string[] = [];
  const apiRequests: string[] = [];

  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'Capacitor', {
      value: {
        isNativePlatform: () => true,
        getPlatform: () => 'android',
      },
      configurable: true,
    });
  });
  page.on('request', (request) => {
    const url = request.url();
    if (new URL(url).pathname === '/sw.js') serviceWorkerRequests.push(url);
    if (url.includes('/api/')) apiRequests.push(url);
  });
  await page.route(`${STAGING_ORIGIN}/api/quran/search**`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:3101' },
      body: JSON.stringify({
        code: 200,
        data: {
          records: [{
            id: '2:153', surahNumber: 2, surahName: 'Al-Baqarah', surahNameArabic: 'البقرة',
            ayahNumber: 153, translation: 'Jadikanlah sabar dan shalat sebagai penolongmu.',
          }],
        },
      }),
    });
  });

  await page.goto('/');
  await expect(page.getByText('Shell Android lokal')).toBeVisible();
  await expect(page.getByTestId('runtime-status')).toHaveText('Android Capacitor');
  await expect(page.getByTestId('local-storage-status')).toHaveText('localStorage dan IndexedDB siap');
  await expect(page.getByRole('list', { name: 'Hasil surat lokal' })).toContainText('Al-Baqarah');

  await page.getByRole('button', { name: 'Cari' }).click();
  await expect(page.getByTestId('online-results')).toContainText('Jadikanlah sabar dan shalat sebagai penolongmu.');

  expect(apiRequests.some((url) => url.startsWith(`${STAGING_ORIGIN}/api/quran/search`))).toBe(true);
  expect(apiRequests.some((url) => url.startsWith('http://127.0.0.1:3101/api/'))).toBe(false);
  expect(serviceWorkerRequests).toEqual([]);
  expect(await page.evaluate(() => Boolean(localStorage.getItem('sholatku-mobile-shell-ready')))).toBe(true);

  const indexedDbRoundTrip = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('sholatku-mobile-e2e', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('values');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('values', 'readwrite');
      transaction.objectStore('values').put('ready', 'status');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    const value = await new Promise<string | undefined>((resolve, reject) => {
      const request = database.transaction('values').objectStore('values').get('status');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    indexedDB.deleteDatabase('sholatku-mobile-e2e');
    return value;
  });
  expect(indexedDbRoundTrip).toBe('ready');
});
