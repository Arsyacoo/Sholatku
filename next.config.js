const withSerwistInit = require('@serwist/next').default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [
    { url: '/~offline', revision: 'offline-v1' },
    { url: '/manifest.webmanifest', revision: 'manifest-v1' },
    { url: '/icon.svg', revision: 'icon-v1' },
    { url: '/icon-192.png', revision: 'icon-v1' },
    { url: '/icon-512.png', revision: 'icon-v1' },
    { url: '/icon-maskable-192.png', revision: 'icon-maskable-v1' },
    { url: '/icon-maskable-512.png', revision: 'icon-maskable-v1' },
  ],
})(nextConfig);
