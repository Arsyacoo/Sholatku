import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { getCapacitorCorsHeaders } from '@/lib/api/cors';
import { middleware } from '../middleware';

describe('Capacitor Android CORS policy', () => {
  it('allows only the default Capacitor Android origin', () => {
    const headers = getCapacitorCorsHeaders('https://localhost');
    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://localhost');
    expect(headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(headers.get('Vary')).toBe('Origin');
  });

  it('does not open the API to arbitrary browser origins', () => {
    expect(getCapacitorCorsHeaders('https://example.com').get('Access-Control-Allow-Origin')).toBeNull();
    expect(getCapacitorCorsHeaders(null).get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('answers allowed preflight requests without reaching a route handler', () => {
    const response = middleware(new NextRequest('https://sholatku-staging.vercel.app/api/quran/search', {
      method: 'OPTIONS',
      headers: { origin: 'https://localhost' },
    }));
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost');
  });
});
