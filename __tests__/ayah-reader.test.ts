import { describe, it, expect } from 'vitest';
import { QARI_OPTIONS } from '@/hooks/useQuranAudio';
import {
  DEFAULT_QURAN_SETTINGS,
  normalizeQuranSettings,
} from '@/lib/storage/quran-preferences';
import { QURAN_PLAYBACK_RATES } from '@/types';

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
    expect(DEFAULT_QURAN_SETTINGS.audioVolume).toBe(100);
    expect(DEFAULT_QURAN_SETTINGS.audioMuted).toBe(false);
    expect(DEFAULT_QURAN_SETTINGS.playbackRate).toBe(1);
  });

  it('supports the approved playback rate options', () => {
    expect(QURAN_PLAYBACK_RATES).toEqual([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]);
  });

  it('migrates older saved settings with audio defaults', () => {
    const migrated = normalizeQuranSettings({
      arabicFontSize: 32,
      showTranslation: false,
      selectedQari: '01',
    });

    expect(migrated.arabicFontSize).toBe(32);
    expect(migrated.showTranslation).toBe(false);
    expect(migrated.selectedQari).toBe('01');
    expect(migrated.audioVolume).toBe(100);
    expect(migrated.audioMuted).toBe(false);
    expect(migrated.playbackRate).toBe(1);
  });

  it('normalizes invalid audio preference values', () => {
    const normalized = normalizeQuranSettings({
      audioVolume: 140,
      audioMuted: 'yes',
      playbackRate: 3,
    });

    expect(normalized.audioVolume).toBe(100);
    expect(normalized.audioMuted).toBe(false);
    expect(normalized.playbackRate).toBe(1);
  });
});
