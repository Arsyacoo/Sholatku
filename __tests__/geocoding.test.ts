import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CITY_SEARCH_CACHE_LIMIT,
  CITY_SEARCH_DEBOUNCE_MS,
  CITY_SEARCH_MIN_LENGTH,
  normalizeCityQuery,
  reverseGeocode,
  searchCities,
} from '@/lib/location/geocoding';
import { NetworkRequestError } from '@/lib/network/fetch';
import { LatestRequestController } from '@/lib/network/latest-request';

function nominatimResult(id: number, overrides: Record<string, unknown> = {}) {
  return {
    place_id: id,
    display_name: `Remote City ${id}, Province, Indonesia`,
    lat: '-6.2',
    lon: '106.8',
    address: { city: `Remote City ${id}`, state: 'Province', country: 'Indonesia' },
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('geocoding hardening', () => {
  it('uses a provider-friendly debounce and ignores short queries', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(CITY_SEARCH_DEBOUNCE_MS).toBe(400);
    expect(CITY_SEARCH_MIN_LENGTH).toBe(3);
    await expect(searchCities(' a ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes repeated queries and reuses the memory cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([nominatimResult(101)]), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    expect(normalizeCityQuery('  ZZ Cache   Place  ')).toBe('zz cache place');
    const first = await searchCities('  ZZ Cache   Place  ');
    const second = await searchCities('zz cache place');

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed result coordinates and preserves validated timezone metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
      nominatimResult(201, { lat: '91' }),
      nominatimResult(202, { lon: '-181' }),
      nominatimResult(203, { display_name: '' }),
      nominatimResult(204, { extratags: { timezone: 'Asia/Makassar' } }),
    ]))));

    const results = await searchCities('zz validated place');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: 'osm-204', timezone: 'Asia/Makassar' });
  });

  it('does not infer a remote city timezone from the browser', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify([nominatimResult(301)]))
    ));

    const [result] = await searchCities('zz timezone unknown');

    expect(result.timezone).toBeUndefined();
  });

  it('keeps timeout and caller cancellation distinguishable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(
      new NetworkRequestError('timeout', 'Network request timed out.')
    ));
    await expect(searchCities('zz timeout place')).rejects.toMatchObject({ kind: 'timeout' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(
      new NetworkRequestError('aborted', 'Network request was cancelled.')
    ));
    await expect(searchCities('zz aborted place')).rejects.toMatchObject({ kind: 'aborted' });
  });

  it('keeps only the latest search result when an old response resolves late', async () => {
    const responses = new Map<string, (response: Response) => void>();
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) =>
      new Promise<Response>((resolve) => responses.set(String(input), resolve))
    ));
    const requests = new LatestRequestController();
    let accepted = '';
    const run = async (query: string) => {
      const request = requests.begin();
      const result = await searchCities(query, { signal: request.signal });
      if (request.isCurrent()) accepted = result[0]?.name || '';
      requests.finish(request);
    };

    const oldRun = run('zz old remote');
    const newRun = run('zz new remote');
    const entries = [...responses.entries()];
    entries[1][1](new Response(JSON.stringify([nominatimResult(402)])));
    await newRun;
    entries[0][1](new Response(JSON.stringify([nominatimResult(401)])));
    await oldRun;

    expect(accepted).toBe('Remote City 402');
  });

  it('bounds the repeated-query cache', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const id = Number(new URL(String(input)).searchParams.get('q')?.split(' ').pop()) + 500;
      return Promise.resolve(new Response(JSON.stringify([nominatimResult(id)])));
    });
    vi.stubGlobal('fetch', fetchMock);
    const queries = Array.from(
      { length: CITY_SEARCH_CACHE_LIMIT + 1 },
      (_, index) => `zz bounded remote ${index}`
    );

    for (const query of queries) await searchCities(query);
    await searchCities(queries[0]);

    expect(fetchMock).toHaveBeenCalledTimes(CITY_SEARCH_CACHE_LIMIT + 2);
  });

  it('rejects invalid reverse-geocoding coordinates before network work', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(reverseGeocode(91, 106)).rejects.toThrow('Invalid geocoding coordinates.');
    await expect(reverseGeocode(-6, -181)).rejects.toThrow('Invalid geocoding coordinates.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
