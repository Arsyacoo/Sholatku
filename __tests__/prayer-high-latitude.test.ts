import { describe, expect, it } from 'vitest';
import {
  calculateOfflinePrayers,
  HIGH_LATITUDE_POLICY,
  PrayerCalculationError,
} from '@/lib/prayer/calculation';

const timeKeys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

function assertNoInvalidTimes(result: ReturnType<typeof calculateOfflinePrayers>) {
  for (const key of timeKeys) {
    expect(result[key]).toMatch(/^\d{2}:\d{2}$/);
    expect(result[key]).not.toContain('NaN');
  }
}

describe('high-latitude offline prayer calculation', () => {
  it('keeps a normal Jakarta schedule stable within the existing rounding', () => {
    const result = calculateOfflinePrayers(
      new Date('2026-09-03T12:00:00Z'),
      -6.1754,
      106.8272,
      7
    );

    expect(result).toMatchObject({
      fajr: '04:34',
      sunrise: '05:51',
      dhuhr: '11:55',
      asr: '15:09',
      maghrib: '17:54',
      isha: '19:01',
      highLatitudePolicy: null,
    });
    assertNoInvalidTimes(result);
  });

  it('uses the named one-seventh policy when summer twilight is unavailable', () => {
    const result = calculateOfflinePrayers(new Date('2026-06-21T12:00:00Z'), 65, 0, 0);

    expect(result.highLatitudePolicy).toBe(HIGH_LATITUDE_POLICY);
    assertNoInvalidTimes(result);
  });

  it('keeps a high-latitude winter failure explicit instead of fabricating times', () => {
    expect(() => calculateOfflinePrayers(new Date('2026-12-21T12:00:00Z'), 68, 0, 0)).toThrowError(
      expect.objectContaining({
        name: 'PrayerCalculationError',
        code: 'unavailable-solar-event',
      })
    );
  });

  it('guards a trigonometric domain edge without returning NaN or 00:00', () => {
    let error: unknown;
    try {
      calculateOfflinePrayers(new Date('2026-06-21T12:00:00Z'), 65.72, 0, 0);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(PrayerCalculationError);
    expect((error as PrayerCalculationError).code).toBe('unavailable-solar-event');
    expect(String(error)).not.toContain('NaN');
    expect(String(error)).not.toContain('00:00');
  });

  it('rejects invalid math inputs rather than formatting them as midnight', () => {
    expect(() => calculateOfflinePrayers(new Date('invalid'), -6, 106, 7)).toThrowError(
      expect.objectContaining({
        name: 'PrayerCalculationError',
        code: 'invalid-input',
      })
    );
    expect(() => calculateOfflinePrayers(new Date('2026-09-03T12:00:00Z'), 91, 106, 7)).toThrowError(
      expect.objectContaining({
        name: 'PrayerCalculationError',
        code: 'invalid-input',
      })
    );
  });
});

