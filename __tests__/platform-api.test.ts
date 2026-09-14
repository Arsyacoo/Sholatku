import { afterEach, describe, expect, it } from 'vitest';
import { resolveApiUrl } from '@/lib/platform/api';
import { getAppRuntime, isNativeRuntime, isPwaRuntimeEnabled } from '@/lib/platform/runtime';
import capacitorConfig from '../capacitor.config';
import { resolveMobileBuildApiBaseUrl } from '@/lib/platform/mobile-build';

type GlobalWithCapacitor = typeof globalThis & {
  Capacitor?: {
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
  };
};

const originalApiBase = process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL;

function setAndroidRuntime(): void {
  (globalThis as GlobalWithCapacitor).Capacitor = {
    getPlatform: () => 'android',
    isNativePlatform: () => true,
  };
}

afterEach(() => {
  delete (globalThis as GlobalWithCapacitor).Capacitor;
  if (originalApiBase === undefined) delete process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL;
  else process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL = originalApiBase;
});

describe('platform runtime and hosted API resolver', () => {
  it('keeps production mobile builds fail-closed until a non-staging HTTPS BFF is supplied', () => {
    expect(() => resolveMobileBuildApiBaseUrl('mobile-production')).toThrow(
      'NEXT_PUBLIC_MOBILE_API_BASE_URL wajib dikonfigurasi untuk mobile production build.'
    );
    expect(() => resolveMobileBuildApiBaseUrl('mobile-production', 'https://sholatku-staging.vercel.app')).toThrow(
      'Mobile production build tidak boleh menggunakan staging BFF.'
    );
    expect(resolveMobileBuildApiBaseUrl('mobile-production', 'https://api.sholatku.example///')).toBe(
      'https://api.sholatku.example'
    );
  });

  it('requires the named internal build to use the documented staging BFF', () => {
    expect(resolveMobileBuildApiBaseUrl('mobile-internal', 'https://sholatku-staging.vercel.app///')).toBe(
      'https://sholatku-staging.vercel.app'
    );
    expect(() => resolveMobileBuildApiBaseUrl('mobile-internal')).toThrow(
      'NEXT_PUBLIC_MOBILE_API_BASE_URL wajib dikonfigurasi untuk mobile internal build.'
    );
    expect(() => resolveMobileBuildApiBaseUrl('mobile-internal', 'https://api.example.com')).toThrow(
      'Mobile internal build harus menggunakan staging BFF yang terdokumentasi.'
    );
  });

  it('keeps web calls relative and PWA-enabled', () => {
    expect(getAppRuntime()).toBe('web');
    expect(isNativeRuntime()).toBe(false);
    expect(isPwaRuntimeEnabled()).toBe(true);
    expect(resolveApiUrl('/api/quran/search?q=sabar')).toBe('/api/quran/search?q=sabar');
  });

  it('routes Android calls to the hosted staging BFF', () => {
    setAndroidRuntime();
    process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL = 'https://sholatku-staging.vercel.app';

    expect(getAppRuntime()).toBe('android');
    expect(isNativeRuntime()).toBe(true);
    expect(isPwaRuntimeEnabled()).toBe(false);
    expect(resolveApiUrl('/api/quran/surah/1')).toBe(
      'https://sholatku-staging.vercel.app/api/quran/surah/1'
    );
  });

  it('normalizes mobile API base and request slashes', () => {
    setAndroidRuntime();
    process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL = 'https://sholatku-staging.vercel.app///';

    expect(resolveApiUrl('///api/prayer-times?lat=-6.2')).toBe(
      'https://sholatku-staging.vercel.app/api/prayer-times?lat=-6.2'
    );
  });

  it('does not rewrite absolute provider URLs', () => {
    setAndroidRuntime();
    expect(resolveApiUrl('https://api.aladhan.com/v1/timings/1')).toBe(
      'https://api.aladhan.com/v1/timings/1'
    );
  });

  it('fails explicitly when the Android API base is missing', () => {
    setAndroidRuntime();
    delete process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL;

    expect(() => resolveApiUrl('/api/quran/search?q=sabar')).toThrow(
      'NEXT_PUBLIC_MOBILE_API_BASE_URL wajib dikonfigurasi untuk runtime Android.'
    );
  });

  it('keeps Capacitor on the local static shell rather than a hosted wrapper', () => {
    expect(capacitorConfig.appId).toBe('io.github.arsyacoo.sholatku');
    expect(capacitorConfig.appName).toBe('Sholatku');
    expect(capacitorConfig.webDir).toBe('dist-mobile');
    expect(capacitorConfig.server?.url).toBeUndefined();
  });
});
