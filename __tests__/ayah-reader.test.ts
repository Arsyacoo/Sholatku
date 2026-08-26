import { describe, it, expect } from 'vitest';
import { QARI_OPTIONS } from '@/hooks/useQuranAudio';
import { DEFAULT_QURAN_SETTINGS } from '@/lib/storage/quran-preferences';

describe('Quran Ayah Reader & Audio Hook Constants', () => {
  it('contains valid qari options with audio keys', () => {
    expect(QARI_OPTIONS.length).toBeGreaterThanOrEqual(4);
    const mishary = QARI_OPTIONS.find((q) => q.id === '05');
    expect(mishary).toBeDefined();
    expect(mishary?.name).toContain('Misyari');
  });

  it('has proper default quran display settings', () => {
    expect(DEFAULT_QURAN_SETTINGS.arabicFontSize).toBe(28);
    expect(DEFAULT_QURAN_SETTINGS.showTranslation).toBe(true);
    expect(DEFAULT_QURAN_SETTINGS.showLatin).toBe(true);
    expect(DEFAULT_QURAN_SETTINGS.selectedQari).toBe('05');
  });
});
