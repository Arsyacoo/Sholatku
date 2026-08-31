/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig, SerwistPlugin } from 'serwist';
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const cacheableResponses = new CacheableResponsePlugin({ statuses: [200] });
const CACHE_VERSION = 'v1';
let serwist: Serwist;

const navigationFallback: SerwistPlugin = {
  handlerDidError: async () => {
    const fallback = await serwist.matchPrecache('/~offline');
    return fallback ?? Response.error();
  },
};

serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin &&
        request.method === 'GET' &&
        (request.mode === 'navigate' || request.destination === 'document'),
      handler: new NetworkFirst({
        cacheName: `sholatku-pages-${CACHE_VERSION}`,
        networkTimeoutSeconds: 4,
        plugins: [
          cacheableResponses,
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24,
            purgeOnQuotaError: true,
          }),
          navigationFallback,
        ],
      }),
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        request.method === 'GET' &&
        (url.pathname.startsWith('/api/prayer-times') ||
          url.pathname.startsWith('/api/quran/surah')),
      handler: new NetworkFirst({
        cacheName: `sholatku-api-${CACHE_VERSION}`,
        networkTimeoutSeconds: 5,
        plugins: [
          cacheableResponses,
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        request.method === 'GET' &&
        (url.pathname.startsWith('/_next/static/') ||
          url.pathname.startsWith('/_next/image') ||
          request.destination === 'image'),
      handler: new CacheFirst({
        cacheName: `sholatku-static-${CACHE_VERSION}`,
        plugins: [
          cacheableResponses,
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin &&
        request.method === 'GET' &&
        (request.destination === 'style' || request.destination === 'font'),
      handler: new StaleWhileRevalidate({
        cacheName: `sholatku-styles-${CACHE_VERSION}`,
        plugins: [
          cacheableResponses,
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 30,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) =>
        request.method === 'GET' &&
        request.destination === 'font' &&
        new URL(request.url).origin === 'https://fonts.gstatic.com',
      handler: new CacheFirst({
        cacheName: `sholatku-fonts-${CACHE_VERSION}`,
        plugins: [
          cacheableResponses,
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
