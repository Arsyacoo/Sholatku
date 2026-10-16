import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.arsyacoo.sholatku',
  appName: 'Sholatku',
  webDir: 'dist-mobile',
  // The WebView origin is https://localhost, so identify the app to third-party APIs (Nominatim usage policy).
  appendUserAgent: 'Sholatku (+https://github.com/Arsyacoo/Sholatku)',
};

export default config;
