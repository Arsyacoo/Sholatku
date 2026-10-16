import { describe, expect, it } from 'vitest';
import type { MonthlyPrayerItem, UserLocation } from '@/types';
import { buildPrayerWidgetPayload, PRAYER_WIDGET_DAYS } from '@/lib/platform/widget';

const location: UserLocation = {
  city: 'Jakarta',
  country: 'Indonesia',
  latitude: -6.1754,
  longitude: 106.8272,
  timezone: 'Asia/Jakarta',
  isAutoDetected: false,
  displayName: 'Jakarta',
};

function item(date: string): MonthlyPrayerItem {
  return {
    date,
    timezone: 'Asia/Jakarta',
    dayNumber: Number(date.slice(8)),
    dayName: 'Hari',
    hijriFormatted: '',
    isToday: false,
    timings: { fajr: '04:30', sunrise: '05:45', dhuhr: '11:50', asr: '15:10', maghrib: '17:55', isha: '19:05' },
  };
}

describe('Android prayer widget payload', () => {
  it('keeps seven days across a month boundary with absolute prayer instants', () => {
    const items = ['2026-02-15', '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06']
      .map(item)
      .reverse();
    const payload = buildPrayerWidgetPayload(location, items, 0, new Date('2026-02-28T10:00:00+07:00'));

    expect(payload.version).toBe(1);
    expect(payload.city).toBe('Jakarta');
    expect(payload.days.map((day) => day.date)).toEqual([
      '2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06',
    ]);
    expect(payload.days).toHaveLength(PRAYER_WIDGET_DAYS);
    expect(payload.days[0].prayers.map((prayer) => prayer.name)).toEqual(['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']);
    expect(payload.days[0].prayers[0]).toEqual({
      name: 'Subuh',
      time: '04:30',
      at: Date.parse('2026-02-27T21:30:00Z'),
    });
  });

  it('applies the Hijri adjustment to each day label', () => {
    const now = new Date('2026-02-18T10:00:00+07:00');
    expect(buildPrayerWidgetPayload(location, [item('2026-02-18')], 0, now).days[0].hijri).toBe('1 Ramadhan 1447 H');
    expect(buildPrayerWidgetPayload(location, [item('2026-02-18')], -1, now).days[0].hijri).toBe('29 Syaban 1447 H');
  });
});
