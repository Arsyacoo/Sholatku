import { describe, expect, it } from 'vitest';
import { formatDateOnly } from '@/lib/prayer/reminders/schedule';
import { getRelevantRamadanYear } from '@/lib/ramadan/calendar';

describe('date snapshot boundaries', () => {
  it('formats the same instant deterministically for a requested timezone', () => {
    const instant = new Date('2026-01-01T00:30:00.000Z');
    expect(formatDateOnly(instant, 'Asia/Jakarta')).toBe('2026-01-01');
    expect(formatDateOnly(instant, 'America/Los_Angeles')).toBe('2025-12-31');
  });

  it('keeps Ramadan year selection explicit at a year boundary', () => {
    expect(getRelevantRamadanYear(new Date('2026-01-01T00:00:00.000Z'), 'Asia/Jakarta')).toBe(1447);
    expect(getRelevantRamadanYear(new Date('2026-07-01T00:00:00.000Z'), 'Asia/Jakarta')).toBe(1448);
  });
});
