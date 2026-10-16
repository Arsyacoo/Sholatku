import { defineConfig } from 'vitest/config';
import path from 'path';

// Fixtures build local-time Dates for Asia/Jakarta schedules; pin TZ so CI (UTC) matches dev machines.
process.env.TZ = 'Asia/Jakarta';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', '**/.git/**', '**/.next/**', 'e2e/**', 'test-results/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
