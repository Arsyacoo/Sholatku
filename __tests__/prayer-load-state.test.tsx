import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrayerScheduleList } from '@/components/prayer/PrayerScheduleList';
import type { DailyPrayerSchedule } from '@/types';

const schedule: DailyPrayerSchedule = {
  date: '2026-09-02', readableDate: 'Rabu, 2 September 2026', timezone: 'Asia/Jakarta', offset: 7,
  hijriDate: { day: '20', month: { en: 'Safar', ar: 'صفر' }, year: '1448', formatted: '20 Safar 1448 H' },
  timings: { fajr: '04:30', sunrise: '05:45', dhuhr: '12:00', asr: '15:20', maghrib: '18:00', isha: '19:15' },
  source: 'api',
};

describe('prayer loading states', () => {
  it('shows skeleton only while loading', () => {
    const html = renderToStaticMarkup(<PrayerScheduleList schedule={null} nextPrayerInfo={null} isLoading />);
    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('Coba Lagi');
  });

  it('shows schedule content on success, including offline source', () => {
    const html = renderToStaticMarkup(<PrayerScheduleList schedule={{ ...schedule, source: 'offline' }} nextPrayerInfo={null} />);
    expect(html).toContain('Jadwal Sholat Hari Ini');
    expect(html).not.toContain('belum dapat dimuat');
  });

  it('shows an actionable error instead of a permanent skeleton', () => {
    const retry = vi.fn();
    const html = renderToStaticMarkup(
      <PrayerScheduleList schedule={null} nextPrayerInfo={null} error="Periksa koneksi atau coba lagi." onRetry={retry} />
    );
    expect(html).toContain('Jadwal sholat belum dapat dimuat.');
    expect(html).toContain('Coba Lagi');
    expect(html).not.toContain('animate-pulse');
    expect(html).not.toContain('Error:');
  });
});
