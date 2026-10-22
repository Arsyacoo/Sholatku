import { fetchJsonWithTimeout, NETWORK_TIMEOUTS } from '../network/fetch';
import { NOMINATIM_MIN_INTERVAL_MS } from './geocoding';
import type { Language } from '@/types';

/**
 * Nearby mosques from OpenStreetMap via Nominatim (the public Overpass servers are often at capacity). Called
 * straight from the device, so the location goes only to OpenStreetMap; results are online-only and never cached.
 */
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_RADII_M = [1_500, 5_000];
const MIN_RESULTS = 5;
const METERS_PER_DEGREE = 111_320;
const MUSALA_PATTERN = /\b(mus(h)?[ao]ll?a|surau|langgar)\b/i;
const MOSQUE_NAME_PATTERN = /\b(masjid|mesjid)\b/i;

export interface NearbyMosque {
  id: string;
  /** Empty when OpenStreetMap has no name; the UI shows "unnamed mosque" in the user's language. */
  name: string;
  kind: 'mosque' | 'musala';
  latitude: number;
  longitude: number;
  distanceMeters: number;
  /** Compass direction from the user as an eighth of the circle: 0 = north, 1 = northeast, ... 7 = northwest. */
  direction: number;
  street?: string;
}

interface NominatimPlace {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
}

/**
 * Nominatim returns at most 40 places per box, ranked by importance rather than distance.
 * ponytail: in very dense areas the nearest musala can fall outside those 40; a distance-sorted source fixes that.
 */
export function buildMosqueSearchUrl(latitude: number, longitude: number, radiusMeters: number): string {
  const dLat = radiusMeters / METERS_PER_DEGREE;
  const dLon = radiusMeters / (METERS_PER_DEGREE * Math.cos((latitude * Math.PI) / 180));
  const viewbox = [longitude - dLon, latitude + dLat, longitude + dLon, latitude - dLat].map((v) => v.toFixed(5));
  const params = new URLSearchParams({
    q: '[amenity=place_of_worship]',
    format: 'jsonv2',
    extratags: '1',
    addressdetails: '1',
    bounded: '1',
    limit: '40',
    viewbox: viewbox.join(','),
  });
  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`;
}

/** Short distances only: an equirectangular projection is accurate to well under 1% within a few km. */
function offsetMeters(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const north = (toLat - fromLat) * METERS_PER_DEGREE;
  const east = (toLon - fromLon) * METERS_PER_DEGREE * Math.cos((((fromLat + toLat) / 2) * Math.PI) / 180);
  return { north, east };
}

export function parseNearbyMosques(data: unknown, latitude: number, longitude: number): NearbyMosque[] {
  if (!Array.isArray(data)) return [];

  const mosques: NearbyMosque[] = [];
  for (const place of data as NominatimPlace[]) {
    const lat = Number(place?.lat);
    const lon = Number(place?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const name = (place.name || '').trim();
    const religion = place.extratags?.religion;
    const isMusala = MUSALA_PATTERN.test(name);
    // Some mosques lack a religion tag; their names still give them away.
    if (religion !== 'muslim' && !(religion === undefined && (isMusala || MOSQUE_NAME_PATTERN.test(name)))) continue;

    const { north, east } = offsetMeters(latitude, longitude, lat, lon);
    const bearing = (Math.atan2(east, north) * 180) / Math.PI;
    mosques.push({
      id: `${place.osm_type}/${place.osm_id}`,
      name,
      kind: isMusala ? 'musala' : 'mosque',
      latitude: lat,
      longitude: lon,
      distanceMeters: Math.hypot(north, east),
      direction: Math.round(((bearing + 360) % 360) / 45) % 8,
      street: place.address?.road || undefined,
    });
  }
  return mosques.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

/** Searches about 1.5 km first and widens to 5 km when fewer than five places are found. */
export async function fetchNearbyMosques(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<NearbyMosque[]> {
  let mosques: NearbyMosque[] = [];
  for (const [index, radius] of SEARCH_RADII_M.entries()) {
    if (index > 0) await wait(NOMINATIM_MIN_INTERVAL_MS, signal);
    const data = await fetchJsonWithTimeout<unknown>(buildMosqueSearchUrl(latitude, longitude, radius), {
      timeoutMs: NETWORK_TIMEOUTS.geocoding,
      signal,
      headers: { Accept: 'application/json', 'Accept-Language': 'id,en;q=0.8' },
    });
    mosques = parseNearbyMosques(data, latitude, longitude);
    if (mosques.length >= MIN_RESULTS) break;
  }
  return mosques;
}

export function formatDistance(meters: number, language: Language = 'id'): string {
  if (meters < 1_000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = (meters / 1_000).toFixed(1);
  return `${language === 'en' ? km : km.replace('.', ',')} km`;
}

/** Google Maps directions; on Android the link opens the Maps app. */
export function mapsDirectionsUrl(mosque: NearbyMosque): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
}
