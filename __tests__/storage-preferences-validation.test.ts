import { beforeEach, describe, expect, it } from 'vitest';
import {
  getSavedLocation,
  getSavedSettings,
} from '@/lib/storage/preferences';
import {
  getFavoriteSurahs,
  getLastRead,
  getQuranSettings,
} from '@/lib/storage/quran-preferences';
import { getBookmarkedAyahs } from '@/lib/storage/quran-offline';

const storage: Record<string, string> = {};
beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key];
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
  };
});

describe('persisted preference validation', () => {
  it('falls back safely for corrupt and invalid location/settings', () => {
    storage.sholatku_user_location_v1 = JSON.stringify({ latitude: 'hello', longitude: 999 });
    storage.sholatku_user_settings_v1 = JSON.stringify({ method: '999', madhab: 'invalid', adjustments: { fajr: NaN }, theme: 'nope' });
    expect(getSavedLocation().latitude).toBe(-6.1754);
    expect(getSavedSettings().method).toBe('20');
    expect(getSavedSettings().madhab).toBe('shafii');
    storage.sholatku_user_location_v1 = '{broken';
    storage.sholatku_user_settings_v1 = '{broken';
    expect(() => getSavedLocation()).not.toThrow();
    expect(() => getSavedSettings()).not.toThrow();
  });

  it('sanitizes Quran settings, favorites, last read, and bookmarks', () => {
    storage.sholatku_quran_settings_v1 = JSON.stringify({ audioVolume: 999, playbackRate: 99, showLatin: 'yes' });
    storage.sholatku_quran_favorites_v1 = JSON.stringify([1, 114, 0, 115, '18']);
    storage.sholatku_quran_last_read_v1 = JSON.stringify({ surahNumber: 999, ayahNumber: '1' });
    storage.sholatku_bookmarked_ayahs_v1 = JSON.stringify([{ surahNumber: 1 }, '{broken']);
    expect(getQuranSettings().audioVolume).toBe(100);
    expect(getQuranSettings().playbackRate).toBe(1);
    expect(getQuranSettings().showLatin).toBe(true);
    expect(getFavoriteSurahs()).toEqual([1, 114]);
    expect(getLastRead()).toBeNull();
    expect(getBookmarkedAyahs()).toEqual([]);
  });
});
