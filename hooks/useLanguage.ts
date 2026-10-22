'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Language } from '@/types';
import { localeOf, tr } from '@/lib/language';
import { getSavedSettings } from '@/lib/storage/preferences';

/**
 * Current UI language plus `t(indonesian, english)`. Starts as Indonesian (matching the static HTML) and switches
 * after mount, then follows the settings-changed event.
 */
export function useLanguage() {
  const [language, setLanguage] = useState<Language>('id');

  useEffect(() => {
    const sync = () => setLanguage(getSavedSettings().language);
    sync();
    window.addEventListener('sholatku:settings-changed', sync);
    return () => window.removeEventListener('sholatku:settings-changed', sync);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((indonesian: string, english: string) => tr(language, indonesian, english), [language]);
  return { language, locale: localeOf(language), t };
}
