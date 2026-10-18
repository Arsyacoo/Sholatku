import { describe, expect, it } from 'vitest';
import { parseDailyPrayerQuery } from '@/lib/api/validation';
import { calculateOfflinePrayers } from '@/lib/prayer/calculation';
import { aladhanMethodQuery, offlineFajrAngle } from '@/lib/prayer/constants';
import { applyPrayerAdjustments, withIhtiyat } from '@/lib/prayer/normalize';

function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

describe('Muhammadiyah calculation method', () => {
  it('maps to the AlAdhan custom method with Fajr and Isha at 18°', () => {
    expect(aladhanMethodQuery('20')).toBe('method=20');
    expect(aladhanMethodQuery('muhammadiyah')).toBe('method=99&methodSettings=18%2Cnull%2C18');
  });

  it('is accepted by the prayer API routes', () => {
    const params = new URLSearchParams({ lat: '-6.2', lon: '106.8', method: 'muhammadiyah', timestamp: '1792224000' });
    expect(parseDailyPrayerQuery(params).method).toBe('muhammadiyah');
  });

  it('puts offline Subuh about 8 minutes after Kemenag', () => {
    const date = new Date('2026-10-17T05:00:00Z');
    const kemenag = calculateOfflinePrayers(date, -6.2, 106.8, 7, offlineFajrAngle('20'));
    const muhammadiyah = calculateOfflinePrayers(date, -6.2, 106.8, 7, offlineFajrAngle('muhammadiyah'));
    const diff = minutes(muhammadiyah.fajr) - minutes(kemenag.fajr);
    expect(diff).toBeGreaterThanOrEqual(6);
    expect(diff).toBeLessThanOrEqual(10);
    expect(muhammadiyah.isha).toBe(kemenag.isha);
  });
});

describe('ihtiyat', () => {
  it('moves prayer starts later and sunrise earlier, on top of manual corrections', () => {
    const manual = { fajr: 1, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: -1 };
    const timings = { fajr: '04:12', sunrise: '05:31', dhuhr: '11:38', asr: '14:47', maghrib: '17:46', isha: '18:56' };
    expect(applyPrayerAdjustments(timings, withIhtiyat(manual, 2))).toEqual({
      fajr: '04:15', sunrise: '05:29', dhuhr: '11:40', asr: '14:49', maghrib: '17:48', isha: '18:57',
    });
    expect(withIhtiyat(manual, 0)).toBe(manual);
  });
});
