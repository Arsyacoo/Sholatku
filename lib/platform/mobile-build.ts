const MOBILE_API_BASE_ENV = 'NEXT_PUBLIC_MOBILE_API_BASE_URL';
export const MOBILE_PRODUCTION_MODE = 'mobile-production';
export const MOBILE_INTERNAL_MODE = 'mobile-internal';
export const MOBILE_DIRECT_PREVIEW_MODE = 'mobile-direct-preview';
export const MOBILE_STAGING_HOST = 'sholatku-staging.vercel.app';

function normalizeConfiguredUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${MOBILE_API_BASE_ENV} harus berupa URL HTTPS yang valid.`);
  }

  if (
    url.protocol !== 'https:' ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${MOBILE_API_BASE_ENV} harus berupa URL HTTPS tanpa kredensial, query, atau fragment.`);
  }

  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

/**
 * Keeps the existing mobile mode usable for staging while making a
 * production build fail closed until a real production BFF is supplied.
 */
export function resolveMobileBuildApiBaseUrl(mode: string, configuredValue?: string): string {
  const value = configuredValue?.trim() || '';

  if (mode === MOBILE_INTERNAL_MODE || mode === MOBILE_DIRECT_PREVIEW_MODE) {
    if (!value) {
      const buildLabel = mode === MOBILE_DIRECT_PREVIEW_MODE ? 'mobile direct preview' : 'mobile internal';
      throw new Error(`${MOBILE_API_BASE_ENV} wajib dikonfigurasi untuk ${buildLabel} build.`);
    }

    const normalized = normalizeConfiguredUrl(value);
    if (new URL(normalized).hostname !== MOBILE_STAGING_HOST) {
      const buildLabel = mode === MOBILE_DIRECT_PREVIEW_MODE ? 'direct preview' : 'internal';
      throw new Error(`Mobile ${buildLabel} build harus menggunakan staging BFF yang terdokumentasi.`);
    }
    return normalized;
  }

  if (mode !== MOBILE_PRODUCTION_MODE) return value;
  if (!value) {
    throw new Error(`${MOBILE_API_BASE_ENV} wajib dikonfigurasi untuk mobile production build.`);
  }

  const normalized = normalizeConfiguredUrl(value);
  if (new URL(normalized).hostname === MOBILE_STAGING_HOST) {
    throw new Error('Mobile production build tidak boleh menggunakan staging BFF.');
  }

  return normalized;
}
