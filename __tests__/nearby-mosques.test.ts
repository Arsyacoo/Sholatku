import { describe, expect, it } from 'vitest';
import { buildMosqueSearchUrl, formatDistance, parseNearbyMosques } from '@/lib/location/mosques';

const ORIGIN = { lat: -6.2, lon: 106.8 };

describe('nearby mosques', () => {
  it('searches places of worship inside a bounded box around the location', () => {
    const url = new URL(buildMosqueSearchUrl(ORIGIN.lat, ORIGIN.lon, 1_500));
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search');
    expect(url.searchParams.get('q')).toBe('[amenity=place_of_worship]');
    expect(url.searchParams.get('bounded')).toBe('1');
    const [west, north, east, south] = url.searchParams.get('viewbox')!.split(',').map(Number);
    expect(north - ORIGIN.lat).toBeCloseTo(0.0135, 3);
    expect(ORIGIN.lat - south).toBeCloseTo(0.0135, 3);
    expect(east - ORIGIN.lon).toBeCloseTo(ORIGIN.lon - west, 5);
  });

  it('keeps Muslim places only, sorted by distance, with musala and direction labels', () => {
    const mosques = parseNearbyMosques(
      [
        { osm_type: 'node', osm_id: 1, lat: '-6.2', lon: '106.81', name: 'Masjid Raya', extratags: { religion: 'muslim' } },
        { osm_type: 'way', osm_id: 2, lat: '-6.199', lon: '106.8', name: 'Musholla Al-Ikhlas', extratags: { religion: 'muslim' }, address: { road: 'Jl. Melati' } },
        { osm_type: 'node', osm_id: 3, lat: '-6.21', lon: '106.8', name: 'Masjid An-Nur', extratags: {} },
        { osm_type: 'node', osm_id: 4, lat: '-6.2001', lon: '106.8', name: 'Gereja Santa Maria', extratags: { religion: 'christian' } },
        { osm_type: 'node', osm_id: 5, lat: '-6.2002', lon: '106.8', name: 'Pura', extratags: {} },
        { osm_type: 'node', osm_id: 6, lat: 'x', lon: '106.8', name: 'Masjid Rusak', extratags: { religion: 'muslim' } },
      ],
      ORIGIN.lat,
      ORIGIN.lon
    );

    expect(mosques.map((m) => m.id)).toEqual(['way/2', 'node/1', 'node/3']);
    expect(mosques[0]).toMatchObject({ kind: 'Musala', direction: 'utara', street: 'Jl. Melati' });
    expect(Math.round(mosques[0].distanceMeters)).toBe(111);
    expect(mosques[1]).toMatchObject({ kind: 'Masjid', direction: 'timur' });
    expect(mosques[2]).toMatchObject({ name: 'Masjid An-Nur', direction: 'selatan' });
  });

  it('returns nothing for an unexpected response', () => {
    expect(parseNearbyMosques({ error: 'Unable to geocode' }, ORIGIN.lat, ORIGIN.lon)).toEqual([]);
    expect(parseNearbyMosques(null, ORIGIN.lat, ORIGIN.lon)).toEqual([]);
  });

  it('formats distance in Indonesian', () => {
    expect(formatDistance(4)).toBe('10 m');
    expect(formatDistance(347)).toBe('350 m');
    expect(formatDistance(1_250)).toBe('1,3 km');
  });
});
