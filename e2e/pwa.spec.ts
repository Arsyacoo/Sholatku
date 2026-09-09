import { test, expect } from '@playwright/test';
import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockApplicationApis(page);
});

test('registers the production service worker with the application scope', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/');
  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, controller: Boolean(navigator.serviceWorker.controller) };
  });
  expect(registration.scope).toBe('http://127.0.0.1:3100/');
  expect((await page.request.get('/sw.js')).status()).toBe(200);
  expect((await page.request.get('/manifest.webmanifest')).status()).toBe(200);
  await assertNoErrors();
});

test('keeps the app shell navigable after going offline', async ({ page, context }) => {
  const assertNoErrors = installConsoleGuards(page, [/ERR_INTERNET_DISCONNECTED/i, /Failed to fetch RSC payload/i]);
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The first page that registers a service worker is uncontrolled. Reload once
  // so the subsequent offline fetch is served by the active worker.
  await page.reload();
  await page.goto('/quran');
  await expect(page.getByRole('button', { name: /Semua Surat/ }).first()).toBeVisible();

  await context.setOffline(true);
  const offlineShell = await page.evaluate(async () => {
    const response = await fetch('/~offline', { cache: 'no-store' });
    return { ok: response.ok, body: await response.text() };
  });
  expect(offlineShell.ok).toBe(true);
  expect(offlineShell.body).toContain('Koneksi internet sedang tidak tersedia');
  await expect(page.getByRole('button', { name: /Semua Surat/ }).first()).toBeVisible();
  await assertNoErrors();
});

test('downloads a Surah into IndexedDB for the offline reader', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/quran/offline');
  const download = page.getByRole('button', { name: 'Download Al-Fatihah untuk offline' });
  await download.click();
  await expect(page.getByText('Tersedia Offline').first()).toBeVisible({ timeout: 15_000 });
  const cached = await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    return databases.some((database) => database.name === 'sholatku');
  });
  expect(cached).toBe(true);

  await assertNoErrors();
});

test('opens a cached Surah reader after an offline reload', async ({ page, context }) => {
  const assertNoErrors = installConsoleGuards(page, [/ERR_INTERNET_DISCONNECTED/i, /ERR_FAILED/i, /Failed to fetch RSC payload/i]);
  await page.goto('/quran/offline');
  await page.getByRole('button', { name: 'Download Al-Fatihah untuk offline' }).click();
  await expect(page.getByText('Tersedia Offline').first()).toBeVisible({ timeout: 15_000 });

  await page.goto('/quran/1');
  await expect(page.getByRole('heading', { name: 'Al-Fatihah' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  // Make the reader prove it can render from IndexedDB rather than from the
  // deterministic online API fixture when the browser is taken offline.
  await page.route('**/api/quran/surah/**', (route) => route.abort());
  await page.evaluate(async () => {
    for (const key of await caches.keys()) {
      if (key.includes('sholatku-api-')) await caches.delete(key);
    }
  });
  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Al-Fatihah' })).toBeVisible();
  const firstAyah = page.locator('#ayah-1');
  await firstAyah.scrollIntoViewIfNeeded();
  await expect(firstAyah).toBeVisible();
  expect((await firstAyah.innerText()).trim().length).toBeGreaterThan(20);
  expect(page.url()).toContain('/quran/1');
  await assertNoErrors();
});

test('shows the intentional offline state for an uncached Surah route', async ({ page, context }) => {
  const assertNoErrors = installConsoleGuards(page, [/ERR_INTERNET_DISCONNECTED/i, /Failed to fetch RSC payload/i]);
  await page.goto('/quran');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto('/quran/114');

  await expect(page.getByRole('heading', { name: 'Koneksi internet sedang tidak tersedia' })).toBeVisible();
  await expect(page.getByText('Mode offline', { exact: false })).toBeVisible();
  await expect(page.getByText('Mencoba memuat', { exact: false })).toHaveCount(0);
  await assertNoErrors();
});

test('clears cached Quran data through the offline manager UI', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/quran/offline');
  await page.getByRole('button', { name: 'Download Al-Fatihah untuk offline' }).click();
  await expect(page.getByText('Tersedia Offline').first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Hapus semua Surah offline' }).click();
  const dialog = page.getByRole('dialog', { name: 'Hapus semua Surah offline?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Hapus Semua' }).click();
  await expect(page.getByRole('button', { name: 'Download Al-Fatihah untuk offline' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hapus semua Surah offline' })).toBeHidden();
  await assertNoErrors();
});

test('keeps metadata search available offline and uses the online ayah boundary', async ({ page, context }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/quran');
  const search = page.getByRole('textbox', { name: 'Cari ayat, surat, atau terjemahan Al-Qur\'an' });
  await search.fill("Ali 'Imran");
  await expect(page.getByText("Ali 'Imran", { exact: false }).first()).toBeVisible();

  await search.fill('sabar');
  await expect(page.getByText('Jadikanlah sabar dan shalat', { exact: false }).first()).toBeVisible();

  await context.setOffline(true);
  await search.fill('imran');
  await expect(page.getByText("Ali 'Imran", { exact: false }).first()).toBeVisible();
  await search.fill('sabar');
  await expect(page.getByText('Pencarian ayat offline belum tersedia.', { exact: true }).first()).toBeVisible();
  await assertNoErrors();
});

test('keeps critical mobile routes within the viewport', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'mobile-only assertion');
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
  ];
  const routes = ['/', '/settings', '/quran', '/quran/2', '/monthly', '/qibla', '/ramadan'];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of routes) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      expect(fits, `${path} overflows horizontally at ${viewport.width}px`).toBe(true);
    }
  }
});
