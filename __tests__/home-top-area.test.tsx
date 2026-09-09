import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { Navbar } from '@/components/layout/Navbar';
import { LocationHeader } from '@/components/location/LocationHeader';
import { DateHeader } from '@/components/prayer/DateHeader';
import type { DailyPrayerSchedule, UserLocation } from '@/types';

const location: UserLocation = {
  city: 'Jakarta Pusat',
  province: 'DKI Jakarta',
  country: 'Indonesia',
  latitude: -6.18,
  longitude: 106.83,
  timezone: 'Asia/Jakarta',
  isAutoDetected: false,
  displayName: 'Jakarta, DKI Jakarta',
};

const schedule: DailyPrayerSchedule = {
  date: '2026-09-09',
  readableDate: 'Rabu, 9 September 2026',
  timezone: 'Asia/Jakarta',
  offset: 7,
  hijriDate: {
    day: '27',
    month: { en: "Rabi' al-awwal", ar: 'rabi' },
    year: '1448',
    formatted: "27 Rabi' al-awwal 1448 H",
  },
  timings: { fajr: '04:30', sunrise: '05:45', dhuhr: '11:50', asr: '15:10', maghrib: '17:50', isha: '19:00' },
  source: 'api',
};

describe('home top area', () => {
  it('keeps the mobile header compact and moves the city out of the app bar', () => {
    const html = renderToStaticMarkup(
      <Navbar location={location} onOpenLocationModal={() => undefined} />
    );

    expect(html).toContain('h-14 md:h-16');
    expect(html).toContain('hidden md:block');
    expect(html).not.toContain('Jakarta Pusat');
    expect((html.match(/Sholat<span/g) ?? []).length).toBe(1);
  });

  it('keeps location selection and coordinates in one accessible context', () => {
    const html = renderToStaticMarkup(
      <LocationHeader location={location} onOpenSearch={() => undefined} onRefresh={() => undefined} />
    );

    expect(html).toContain('Ubah lokasi saat ini');
    expect(html).toContain('Jakarta, DKI Jakarta');
    expect(html).toContain('-6.18');
    expect(html).toContain('106.83');
    expect(html).toContain('Muat ulang jadwal');
  });

  it('groups Gregorian and Hijri dates with a clear primary/secondary hierarchy', () => {
    const html = renderToStaticMarkup(<DateHeader schedule={schedule} />);

    expect(html).toContain('data-testid="home-date-context"');
    expect(html).toContain('data-testid="gregorian-date"');
    expect(html).toContain('data-testid="hijri-date"');
    expect(html).toContain('Rabu, 9 September 2026');
    expect(html).toContain('27 Rabi');
    expect(html.indexOf('data-testid="gregorian-date"')).toBeLessThan(html.indexOf('data-testid="hijri-date"'));
  });
});
