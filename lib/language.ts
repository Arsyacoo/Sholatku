import type { Language } from '@/types';

/**
 * Two-language UI without a library: every call site passes both texts, e.g. `tr(lang, 'Simpan', 'Save')`,
 * so the English copy always sits next to the Indonesian original.
 */
export const LANGUAGES: readonly Language[] = ['id', 'en'];

export function isLanguage(value: unknown): value is Language {
  return value === 'id' || value === 'en';
}

/** Indonesian when the device or browser is set to Indonesian (or Malay), English otherwise. */
export function detectDeviceLanguage(): Language {
  if (typeof navigator === 'undefined') return 'id';
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  return preferred.some((tag) => /^(id|in|ms)\b/i.test(tag || '')) ? 'id' : 'en';
}

export function tr(language: Language, indonesian: string, english: string): string {
  return language === 'en' ? english : indonesian;
}

/** BCP 47 locale for Intl date and number formatting. */
export function localeOf(language: Language): string {
  return language === 'en' ? 'en-GB' : 'id-ID';
}
