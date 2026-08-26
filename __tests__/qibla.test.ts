import { describe, it, expect } from 'vitest';
import { calculateQiblaBearing, calculateDistanceToKaaba } from '@/lib/prayer/calculation';

describe('Qibla Calculation Logic', () => {
  it('calculates accurate Qibla bearing for Jakarta (~295.2°)', () => {
    // Jakarta: -6.1754, 106.8272
    const bearing = calculateQiblaBearing(-6.1754, 106.8272);
    expect(bearing).toBeGreaterThanOrEqual(294.5);
    expect(bearing).toBeLessThanOrEqual(296.0);
  });

  it('calculates accurate Qibla bearing for Banda Aceh (~292.4°)', () => {
    // Banda Aceh: 5.5483, 95.3238
    const bearing = calculateQiblaBearing(5.5483, 95.3238);
    expect(bearing).toBeGreaterThanOrEqual(291.5);
    expect(bearing).toBeLessThanOrEqual(293.5);
  });

  it('calculates approximate distance to Kaaba from Jakarta (~7900km)', () => {
    const dist = calculateDistanceToKaaba(-6.1754, 106.8272);
    expect(dist).toBeGreaterThan(7800);
    expect(dist).toBeLessThan(8000);
  });
});
