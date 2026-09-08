import { test, expect } from '@playwright/test';
import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockApplicationApis(page);
});

test('critical routes render meaningful application states', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  const routes: Array<{ path: string; text: string }> = [
    { path: '/', text: 'Jadwal Sholat Hari Ini' },
    { path: '/quran', text: 'Semua Surat' },
    { path: '/quran/2', text: 'Al-Baqarah' },
    { path: '/monthly', text: 'Jadwal Sholat Bulanan' },
    { path: '/qibla', text: 'Kompas Arah Kiblat' },
    { path: '/ramadan', text: 'Imsakiyah' },
    { path: '/settings', text: 'Pengaturan' },
    { path: '/~offline', text: 'Koneksi internet sedang tidak tersedia' },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator('main').getByText(route.text, { exact: false }).first()).toBeVisible();
  }

  await assertNoErrors();
});

test('Settings shared Select is keyboard reachable and selectable', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/settings');

  const trigger = page.getByRole('button', { name: 'Pengingat Subuh' });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox', { name: 'Pengingat Subuh' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Nonaktif' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('Tepat waktu');
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox', { name: 'Pengingat Subuh' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox', { name: 'Pengingat Subuh' })).toBeHidden();
  await assertNoErrors();
});

test('keeps notification settings honest and touch-friendly', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/settings');

  await expect(page.getByRole('heading', { name: 'Pengingat Waktu Sholat', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Status notifikasi', exact: true })).toBeVisible();
  const toggle = page.getByRole('switch', { name: 'Aktifkan pengingat waktu sholat' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toHaveCSS('min-height', '44px');
  await expect(page.getByText('Pengingat belum diaktifkan.')).toBeVisible();
  await expect(page.getByText('exact alarm', { exact: false })).toHaveCount(0);

  await assertNoErrors();
});

test('opens a direct Quran ayah reference from global search', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/quran');

  const search = page.getByRole('textbox', { name: 'Cari ayat, surat, atau terjemahan Al-Qur\'an' });
  await search.fill('2:255');

  const result = page.getByRole('link', { name: 'Buka Al-Baqarah ayat 255' });
  await expect(result).toBeVisible();
  await result.click();

  await expect(page).toHaveURL(/\/quran\/2\?ayah=255$/);
  await expect(page.getByRole('heading', { name: 'Al-Baqarah' })).toBeVisible();
  const targetAyah = page.locator('#ayah-255');
  await expect(targetAyah).toBeVisible();
  await expect(targetAyah).toHaveClass(/border-primary-500/);
  await assertNoErrors();
});
