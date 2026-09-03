import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as searchRoute } from '@/app/api/quran/search/route';

function request(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/quran/search${query}`);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('online Quran search route', () => {
  it('uses one upstream search request and returns bounded records', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 200,
      data: {
        matches: Array.from({ length: 45 }, (_, index) => ({
          number: index + 1,
          text: `Ayat sabar ${index + 1}`,
          numberInSurah: index + 1,
          surah: { number: 2 },
        })),
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await searchRoute(request('?q=sabar&limit=20'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.records).toHaveLength(20);
    expect(body.data.totalMatches).toBe(45);
    expect(body.data.hasMore).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/search/sabar/all/id.indonesian');
  });

  it('rejects invalid query and pagination before provider work', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect((await searchRoute(request(`?q=${'x'.repeat(101)}`))).status).toBe(400);
    expect((await searchRoute(request('?q=sabar&limit=nope'))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an unavailable state for provider failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('provider details')));

    const response = await searchRoute(request('?q=sabar'));
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).not.toContain('provider details');
    expect(text).not.toContain('Tidak ditemukan');
  });
});
