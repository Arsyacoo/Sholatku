import { test, expect } from '@playwright/test';
import { clearBrowserStorage, installConsoleGuards, mockApplicationApis } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockApplicationApis(page);
});

test('publishes truthful robots, sitemap, manifest, and route metadata', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);

  const robots = await page.request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain('User-Agent: *');
  expect(robotsText).toContain('Sitemap: /sitemap.xml');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('/quran/1');
  expect(sitemapText).toContain('/quran/114');
  expect(sitemapText).toContain('/download');
  expect((sitemapText.match(/<url>/g) ?? []).length).toBe(120);

  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const manifestJson = await manifest.json();
  expect(manifestJson.name).toBe('Sholatku');
  expect(manifestJson.orientation).toBeUndefined();

  await page.goto('/quran/2');
  await expect(page).toHaveTitle(/Al-Baqarah.*Sholatku/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', '/quran/2');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Baca Surat Al-Baqarah/);

  await page.goto('/download');
  await expect(page).toHaveTitle(/Android Preview \/ Beta.*Sholatku/);
  await expect(page.getByRole('heading', { name: 'Sholatku untuk Android' })).toBeVisible();
  await expect(page.getByText('Direct Preview / Beta', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menunggu publikasi resmi' })).toBeDisabled();
  await expect(page.getByText('dfa487a98dead883d2ef4232c622c13bf1b8a7e55e4c21f5cb8110f35444fe13')).toBeVisible();
  await assertNoErrors();
});

test('keeps critical routes usable in landscape and tablet widths', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  const currentWidth = page.viewportSize()?.width ?? 1280;
  await page.setViewportSize(currentWidth < 500
    ? { width: 844, height: 390 }
    : { width: 1024, height: 768 });

  for (const path of ['/', '/quran', '/monthly', '/qibla', '/ramadan', '/settings']) {
    await page.goto(path);
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(fits, `${path} overflows at landscape/tablet width`).toBe(true);
  }
  await assertNoErrors();
});

test('uses self-hosted build fonts without external stylesheet links', async ({ page }) => {
  const assertNoErrors = installConsoleGuards(page);
  await page.goto('/');
  await expect(page.locator('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/__variable_/);
  await assertNoErrors();
});
