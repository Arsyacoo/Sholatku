import { UserLocation, CitySearchResult } from '@/types';
import { POPULAR_CITIES, searchLocalCities } from './cities-id';
import {
  fetchJsonWithTimeout,
  isNetworkRequestError,
  NETWORK_TIMEOUTS,
} from '../network/fetch';
import { isValidTimeZone } from '../time/timezone';

interface GeocodingRequestOptions {
  signal?: AbortSignal;
}

export const CITY_SEARCH_MIN_LENGTH = 3;
export const CITY_SEARCH_DEBOUNCE_MS = 400;
export const CITY_SEARCH_CACHE_LIMIT = 25;

const searchCache = new Map<string, CitySearchResult[]>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 160) : undefined;
}

function coordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function assertCoordinates(latitude: number, longitude: number): void {
  if (coordinate(latitude, -90, 90) === null || coordinate(longitude, -180, 180) === null) {
    throw new RangeError('Invalid geocoding coordinates.');
  }
}

function addressOf(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function timezoneOf(value: unknown): string | undefined {
  if (!isObject(value)) return undefined;
  const timezone = value.timezone;
  return isValidTimeZone(timezone) ? timezone : undefined;
}

function cacheResults(query: string, results: CitySearchResult[]): CitySearchResult[] {
  if (searchCache.has(query)) searchCache.delete(query);
  searchCache.set(query, results);
  while (searchCache.size > CITY_SEARCH_CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value;
    if (oldest === undefined) break;
    searchCache.delete(oldest);
  }
  return results;
}

export function normalizeCityQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
}

function parseSearchResult(value: unknown): CitySearchResult | null {
  if (!isObject(value)) return null;
  const displayName = optionalText(value.display_name);
  const latitude = coordinate(value.lat, -90, 90);
  const longitude = coordinate(value.lon, -180, 180);
  if (!displayName || latitude === null || longitude === null) return null;

  const address = addressOf(value.address);
  const name =
    optionalText(address.city) ||
    optionalText(address.town) ||
    optionalText(address.municipality) ||
    optionalText(address.county) ||
    optionalText(displayName.split(',')[0]);
  if (!name) return null;

  const placeId = typeof value.place_id === 'number' || typeof value.place_id === 'string'
    ? String(value.place_id)
    : `${latitude},${longitude}`;
  return {
    id: `osm-${placeId}`,
    name,
    adminName: optionalText(address.state) || optionalText(address.region),
    country: optionalText(address.country) || '',
    latitude,
    longitude,
    timezone: timezoneOf(value.extratags),
  };
}

/** Reverse geocodes coordinates, preferring curated city data with known timezone. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  options: GeocodingRequestOptions = {}
): Promise<UserLocation> {
  assertCoordinates(latitude, longitude);

  for (const city of POPULAR_CITIES) {
    if (Math.abs(city.latitude - latitude) < 0.15 && Math.abs(city.longitude - longitude) < 0.15) {
      return {
        city: city.name,
        province: city.adminName,
        country: city.country,
        latitude,
        longitude,
        timezone: city.timezone,
        isAutoDetected: true,
        displayName: `${city.name}${city.adminName ? `, ${city.adminName}` : ''}`,
      };
    }
  }

  try {
    const data = await fetchJsonWithTimeout<unknown>(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&extratags=1`,
      {
        timeoutMs: NETWORK_TIMEOUTS.geocoding,
        signal: options.signal,
        headers: { Accept: 'application/json', 'Accept-Language': 'id,en;q=0.8' },
      }
    );
    if (isObject(data) && optionalText(data.display_name)) {
      const address = addressOf(data.address);
      const city =
        optionalText(address.city) ||
        optionalText(address.town) ||
        optionalText(address.municipality) ||
        optionalText(address.county) ||
        optionalText(address.suburb) ||
        optionalText(address.state_district) ||
        'Lokasi Terpilih';
      const province = optionalText(address.state) || optionalText(address.region);
      return {
        city,
        district: optionalText(address.suburb) || optionalText(address.village),
        province,
        country: optionalText(address.country) || 'Indonesia',
        latitude,
        longitude,
        timezone: timezoneOf(data.extratags),
        isAutoDetected: true,
        displayName: `${city}${province ? `, ${province}` : ''}`,
      };
    }
  } catch (error) {
    if (isNetworkRequestError(error, 'aborted')) throw error;
    console.warn('Reverse geocode fallback failed:', error);
  }

  return {
    city: 'Lokasi Anda',
    country: 'Indonesia',
    latitude,
    longitude,
    isAutoDetected: true,
    displayName: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
  };
}

/** Searches curated cities first, then validated Nominatim results. */
export async function searchCities(
  query: string,
  options: GeocodingRequestOptions = {}
): Promise<CitySearchResult[]> {
  const normalizedQuery = normalizeCityQuery(query);
  if (normalizedQuery.length < CITY_SEARCH_MIN_LENGTH) return [];

  const cached = searchCache.get(normalizedQuery);
  if (cached) {
    searchCache.delete(normalizedQuery);
    searchCache.set(normalizedQuery, cached);
    return cached;
  }

  const localResults = searchLocalCities(normalizedQuery, 8);
  if (localResults.length > 0) return cacheResults(normalizedQuery, localResults);

  const data = await fetchJsonWithTimeout<unknown>(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&limit=6&addressdetails=1&extratags=1`,
    {
      timeoutMs: NETWORK_TIMEOUTS.geocoding,
      signal: options.signal,
      headers: { Accept: 'application/json', 'Accept-Language': 'id,en;q=0.8' },
    }
  );
  const results = Array.isArray(data)
    ? data.flatMap((item) => {
        const parsed = parseSearchResult(item);
        return parsed ? [parsed] : [];
      })
    : [];
  return cacheResults(normalizedQuery, results);
}
