import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/mobile',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3101',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview:mobile -- --port 3101',
    url: 'http://127.0.0.1:3101',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
