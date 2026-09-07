const CAPACITOR_ANDROID_ORIGIN = 'https://localhost';

export function getCapacitorCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  if (origin !== CAPACITOR_ANDROID_ORIGIN) return headers;

  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return headers;
}
