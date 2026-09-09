import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { LocationHeader } from '@/components/location/LocationHeader';
import { MonthlyScheduleRow } from '@/components/monthly/MonthlyScheduleTable';
import { SurahSearchFilter } from '@/components/quran/SurahSearchFilter';
import { CalculationMethodSelector } from '@/components/settings/CalculationMethodSelector';
import type { MonthlyPrayerItem, UserLocation } from '@/types';

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

const today: MonthlyPrayerItem = {
  date: '2026-09-09',
  timezone: 'Asia/Jakarta',
  dayNumber: 9,
  dayName: 'Rabu',
  hijriFormatted: "27 Rabi' al-awwal 1448 H",
  isToday: true,
  timings: {
    fajr: '04:40',
    sunrise: '05:49',
    dhuhr: '11:53',
    asr: '15:13',
    maghrib: '17:52',
    isha: '19:04',
  },
};

describe('cross-screen mobile UI polish', () => {
  it('keeps the Home location block compact while preserving touch targets', () => {
    const html = renderToStaticMarkup(
      <LocationHeader location={location} onOpenSearch={() => undefined} onRefresh={() => undefined} />
    );

    expect(html).toContain('gap-0.5');
    expect(html).toContain('min-h-11');
    expect(html).toContain('h-11 w-11');
    expect(html).not.toContain('p-1.5 -ml-1.5');
  });

  it('uses short Quran labels with separate secondary counts', () => {
    const html = renderToStaticMarkup(
      <SurahSearchFilter
        query=""
        onQueryChange={() => undefined}
        activeTab="surah"
        onTabChange={() => undefined}
        surahCount={114}
        favoriteCount={6}
        bookmarkCount={0}
      />
    );

    expect(html).toContain('grid-cols-4');
    expect(html).toContain('>Semua</span>');
    expect(html).toContain('>Favorit</span>');
    expect(html).toContain('>Simpan</span>');
    expect(html).toContain('>114</span>');
    expect(html).toContain('>30</span>');
    expect(html).not.toContain('>Semua Surat (114)');
    expect(html).not.toContain('>Surat Favorit (6)');
    expect(html).not.toContain('>Ayat Disimpan (0)');
  });

  it('keeps the current-day marker inline and row-friendly', () => {
    const html = renderToStaticMarkup(<MonthlyScheduleRow item={today} />);

    expect(html).toContain('Hari ini');
    expect(html).toContain('inline-flex');
    expect(html).toContain('whitespace-nowrap');
    expect(html).not.toContain('uppercase');
  });

  it('separates the calculation method title from its institution', () => {
    const html = renderToStaticMarkup(
      <CalculationMethodSelector value="20" onChange={() => undefined} />
    );

    expect(html).toContain('Kemenag RI</span>');
    expect(html).toContain('(Kementerian Agama)</span>');
    expect(html).toContain('Rekomendasi RI');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('Kemenag RI (Kementerian Agama)</span>');
  });
});
