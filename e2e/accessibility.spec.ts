import { test, expect } from '@playwright/test';
import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockApplicationApis(page);
});

test('mobile zoom remains available and location dialog has focus containment', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/');

  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport ?? '').not.toMatch(/maximum-scale\s*=\s*1/i);
  expect(viewport ?? '').not.toMatch(/user-scalable\s*=\s*no/i);

  const trigger = page.getByRole('button', { name: 'Ubah lokasi saat ini' });
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Pilih Lokasi Wilayah' });
  await expect(dialog).toBeVisible();

  const search = dialog.getByPlaceholder('Ketik nama kota, kabupaten, atau provinsi...');
  await expect(search).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Gunakan Lokasi Otomatis (GPS)' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Tutup' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await assertNoErrors();
});
