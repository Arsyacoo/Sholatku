import { getAppRuntime } from './runtime';

const MOBILE_API_BASE_ENV = 'NEXT_PUBLIC_MOBILE_API_BASE_URL';

function getMobileApiBaseUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL?.trim();
  return value || undefined;
}

function normalizeApiPath(path: string): string {
  if (!path.trim()) throw new Error('API path tidak boleh kosong.');
  return `/${path.trim().replace(/^\/+/, '')}`;
}

function normalizeMobileApiBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${MOBILE_API_BASE_ENV} harus berupa URL HTTPS yang valid.`);
  }

  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash) {
    throw new Error(`${MOBILE_API_BASE_ENV} harus berupa URL HTTPS tanpa kredensial, query, atau fragment.`);
  }

  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

function isAbsoluteUrl(path: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(path.trim());
}

/**
 * Keeps web API calls same-origin while routing local Capacitor Android assets
 * to the hosted BFF. Absolute provider URLs are deliberately untouched.
 */
export function resolveApiUrl(path: string): string {
  if (isAbsoluteUrl(path)) return path;

  const normalizedPath = normalizeApiPath(path);
  if (getAppRuntime() !== 'android') return normalizedPath;

  const baseUrl = getMobileApiBaseUrl();
  if (!baseUrl) {
    throw new Error(`${MOBILE_API_BASE_ENV} wajib dikonfigurasi untuk runtime Android.`);
  }

  return `${normalizeMobileApiBaseUrl(baseUrl)}${normalizedPath}`;
}
