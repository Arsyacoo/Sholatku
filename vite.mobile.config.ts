import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {
  MOBILE_INTERNAL_MODE,
  MOBILE_PRODUCTION_MODE,
  resolveMobileBuildApiBaseUrl,
} from './lib/platform/mobile-build';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, repositoryRoot, '');
  const apiBaseUrl = resolveMobileBuildApiBaseUrl(
    mode,
    environment.NEXT_PUBLIC_MOBILE_API_BASE_URL
  );
  const buildChannel = mode === MOBILE_PRODUCTION_MODE
    ? 'production'
    : mode === MOBILE_INTERNAL_MODE
      ? 'internal-staging'
      : 'staging';
  const enableNativeReminderQa =
    mode !== MOBILE_PRODUCTION_MODE &&
    (mode === 'mobile-qa' ||
    environment.NEXT_PUBLIC_NATIVE_REMINDER_QA === 'true' ||
    process.env.NEXT_PUBLIC_NATIVE_REMINDER_QA === 'true');

  return {
    root: `${repositoryRoot}mobile`,
    plugins: [react()],
    define: {
      'process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'process.env.NEXT_PUBLIC_MOBILE_BUILD_CHANNEL': JSON.stringify(buildChannel),
      'process.env.NEXT_PUBLIC_NATIVE_REMINDER_QA': JSON.stringify(enableNativeReminderQa),
      __SHOLATKU_NATIVE_REMINDER_QA__: JSON.stringify(enableNativeReminderQa),
    },
    resolve: {
      alias: [
        {
          find: '@/components/layout/Footer',
          replacement: `${repositoryRoot}mobile/src/adapters/noop-footer.tsx`,
        },
        {
          find: 'next/link',
          replacement: `${repositoryRoot}mobile/src/adapters/next-link.tsx`,
        },
        {
          find: 'next/navigation',
          replacement: `${repositoryRoot}mobile/src/adapters/next-navigation.ts`,
        },
        {
          find: '@',
          replacement: repositoryRoot,
        },
      ],
    },
    build: {
      outDir: `${repositoryRoot}dist-mobile`,
      emptyOutDir: true,
    },
  };
});
