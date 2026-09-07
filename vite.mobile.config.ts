import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, repositoryRoot, '');
  const apiBaseUrl = environment.NEXT_PUBLIC_MOBILE_API_BASE_URL ?? '';

  return {
    root: `${repositoryRoot}mobile`,
    plugins: [react()],
    define: {
      'process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL': JSON.stringify(apiBaseUrl),
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
