import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getDailyPrayer } from '@/app/api/prayer-times/route';
import { GET as getMonthlyPrayer } from '@/app/api/prayer-times/monthly/route';
import { GET as getSurahList } from '@/app/api/quran/surah/route';
import { GET as getSurahDetail } from '@/app/api/quran/surah/[id]/route';
import nextConfig from '../next.config.js';

function request(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

function providerResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('public API hardening', () => {
  it('accepts valid Jakarta prayer coordinates', async () => {
    const fetchMock = vi.fn().mockResolvedValue(providerResponse({ code: 200, data: { timings: {} } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await getDailyPrayer(request('/api/prayer-times?lat=-6.1754&lon=106.8272&method=20&school=0'));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['lat=hello&lon=106', 'lat'],
    ['lat=91&lon=106', 'lat'],
    ['lat=-6&lon=-181', 'lon'],
    ['lat=-6&lon=106&method=999', 'method'],
    ['lat=-6&lon=106&school=2', 'school'],
    ['lat=-6&lon=106&timestamp=nope', 'timestamp'],
  ])('rejects invalid prayer input %s before provider work', async (query, field) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await getDailyPrayer(request(`/api/prayer-times?${query}`));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ error: 'INVALID_INPUT' });
    expect(body.message).toContain(field);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['month=0', 'month=13', 'month=1.5', 'year=1899', 'year=hello'])
    ('rejects invalid monthly input %s before provider work', async (query) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await getMonthlyPrayer(request(`/api/prayer-times/monthly?${query}`));

      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

  it.each(['0', '115', '1abc', '-1'])('rejects invalid Surah id %s', async (id) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await getSurahDetail(request(`/api/quran/surah/${id}`), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates provider data before returning a Surah', async () => {
    const ayat = Array.from({ length: 7 }, (_, index) => ({
      nomorAyat: index + 1,
      teksArab: `arab ${index + 1}`,
      teksLatin: `latin ${index + 1}`,
      teksIndonesia: `terjemahan ${index + 1}`,
      audio: { '05': `https://audio.example/${index + 1}.mp3` },
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(providerResponse({
      code: 200,
      data: { ayat, deskripsi: '<p>Pembukaan</p>', audioFull: {} },
    })));

    const response = await getSurahDetail(request('/api/quran/surah/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.ayahs).toHaveLength(7);
  });

  it('rejects an oversized Quran search query', async () => {
    const response = await getSurahList(request(`/api/quran/surah?q=${'a'.repeat(101)}`));

    expect(response.status).toBe(400);
  });

  it('sanitizes provider failures without leaking internal details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret-provider-url/socket')));

    const prayerResponse = await getDailyPrayer(request('/api/prayer-times?lat=-6&lon=106'));
    const prayerText = await prayerResponse.text();
    const quranResponse = await getSurahDetail(request('/api/quran/surah/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    const quranText = await quranResponse.text();

    expect(prayerResponse.status).toBe(502);
    expect(quranResponse.status).toBe(502);
    expect(prayerText).not.toContain('secret-provider-url');
    expect(quranText).not.toContain('secret-provider-url');
    expect(prayerText).not.toContain('details');
    expect(quranText).not.toContain('details');
  });

  it('configures representative security and service-worker headers', async () => {
    const rules = await nextConfig.headers?.();
    const globalHeaders = Object.fromEntries(rules?.find((rule) => rule.source === '/:path*')?.headers
      .map(({ key, value }) => [key, value]) || []);
    const workerHeaders = Object.fromEntries(rules?.find((rule) => rule.source === '/sw.js')?.headers
      .map(({ key, value }) => [key, value]) || []);

    expect(globalHeaders).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    });
    expect(globalHeaders['Permissions-Policy']).toContain('geolocation=(self)');
    expect(workerHeaders).toMatchObject({
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    });
  });
});
