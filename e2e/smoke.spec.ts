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
