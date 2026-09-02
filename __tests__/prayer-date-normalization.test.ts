import { describe, expect, it } from 'vitest';
import { normalizeAlAdhanDay } from '@/lib/prayer/normalize';
import { parseProviderGregorianDate } from '@/lib/prayer/date';

describe('provider Gregorian date normalization', () => {
  it.each([
    ['02-09-2026', '2026-09-02'],
    ['01-01-2026', '2026-01-01'],
    ['31-12-2026', '2026-12-31'],
    ['29-02-2028', '2028-02-29'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(parseProviderGregorianDate(input)).toBe(expected);
  });

  it.each(['29-02-2027', '31-02-2026', 'invalid string', ''])('rejects %s safely', (input) => {
    expect(parseProviderGregorianDate(input)).toBeNull();
  });

  it('normalizes an actual provider-shaped response at the domain boundary', () => {
    const schedule = normalizeAlAdhanDay({
      timings: { Fajr: '04:35 (WIB)', Sunrise: '05:50', Dhuhr: '12:00', Asr: '15:20', Maghrib: '17:55', Isha: '19:05' },
      date: {
        gregorian: { date: '02-09-2026', year: '2026', month: { number: 9 }, day: '02' },
        hijri: { day: '20', month: { en: 'Safar', ar: 'صفر' }, year: '1448' },
      },
      meta: { timezone: 'Asia/Jakarta', offset: '+07:00', method: { name: 'Kemenag RI' } },
    });

    expect(schedule.date).toBe('2026-09-02');
    expect(schedule.timings.fajr).toBe('04:35');
  });

  it('rejects a malformed provider date instead of manufacturing one', () => {
    expect(() => normalizeAlAdhanDay({ date: { gregorian: { date: '31-02-2026' } } })).toThrow(
      'invalid Gregorian prayer date'
    );
  });
});
