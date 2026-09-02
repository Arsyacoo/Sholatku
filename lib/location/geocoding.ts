import { UserLocation, CitySearchResult } from '@/types';
import { POPULAR_CITIES, searchLocalCities } from './cities-id';
import { fetchJsonWithTimeout, NETWORK_TIMEOUTS } from '../network/fetch';

interface GeocodingRequestOptions {
  signal?: AbortSignal;
}

/**
 * Reverse geocode latitude & longitude to human-readable city and province
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  options: GeocodingRequestOptions = {}
): Promise<UserLocation> {
  // First check if within ~15km of any known popular city to avoid external API calls
  for (const city of POPULAR_CITIES) {
    const dLat = Math.abs(city.latitude - lat);
    const dLon = Math.abs(city.longitude - lon);
    if (dLat < 0.15 && dLon < 0.15) {
      return {
        city: city.name,
        province: city.adminName,
        country: city.country,
        latitude: lat,
        longitude: lon,
        timezone: city.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        isAutoDetected: true,
        displayName: `${city.name}${city.adminName ? ', ' + city.adminName : ''}`,
      };
    }
  }

  // Fallback to client/server reverse geocode API endpoint
  try {
    const data = await fetchJsonWithTimeout<any>(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        timeoutMs: NETWORK_TIMEOUTS.geocoding,
        signal: options.signal,
        headers: { 'User-Agent': 'Sholatku-PrayerTime-App/1.0' },
      }
    );
    if (data) {
      const addr = data.address || {};
      const cityName =
        addr.city || addr.town || addr.municipality || addr.county || addr.suburb || addr.state_district || 'Lokasi Terpilih';
      const province = addr.state || addr.region || '';
      const country = addr.country || 'Indonesia';

      return {
        city: cityName,
        district: addr.suburb || addr.village,
        province,
        country,
        latitude: lat,
        longitude: lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isAutoDetected: true,
        displayName: `${cityName}${province ? ', ' + province : ''}`,
      };
    }
  } catch (err) {
    console.warn('Reverse geocode fallback failed:', err);
  }

  return {
    city: 'Lokasi Anda',
    country: 'Indonesia',
    latitude: lat,
    longitude: lon,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isAutoDetected: true,
    displayName: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
  };
}

/**
 * Searches cities using local database first, then fallback to API if needed.
 */
export async function searchCities(
  query: string,
  options: GeocodingRequestOptions = {}
): Promise<CitySearchResult[]> {
  const localResults = searchLocalCities(query, 8);
  if (localResults.length > 0 || !query || query.trim().length < 3) {
    return localResults;
  }

  try {
    const data = await fetchJsonWithTimeout<any[]>(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=6&addressdetails=1`,
      {
        timeoutMs: NETWORK_TIMEOUTS.geocoding,
        signal: options.signal,
        headers: { 'User-Agent': 'Sholatku-PrayerTime-App/1.0' },
      }
    );
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        const addr = item.address || {};
        const cityName =
          addr.city || addr.town || addr.municipality || addr.county || item.display_name.split(',')[0];
        const adminName = addr.state || addr.region || '';
        return {
          id: `osm-${item.place_id}`,
          name: cityName,
          adminName,
          country: addr.country || '',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });
    }
  } catch (e) {
    console.warn('Geocoding search API error:', e);
  }

  return localResults;
}
