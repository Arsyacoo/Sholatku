'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

function normalizeTheme(value: unknown): Theme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

const THEME_KEY = 'sholatku_theme_mode';
const THEME_EVENT = 'sholatku-theme-change';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((targetTheme: Theme) => {
    if (typeof window === 'undefined') return;

    let isDark = false;
    if (targetTheme === 'dark') {
      isDark = true;
    } else if (targetTheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      setResolvedTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      setResolvedTheme('light');
    }
  }, []);

  const syncStateFromStorage = useCallback(() => {
    const saved = normalizeTheme(localStorage.getItem(THEME_KEY));
    setThemeState(saved);
    applyTheme(saved);
  }, [applyTheme]);

  useEffect(() => {
    setMounted(true);
    syncStateFromStorage();

    const handleCustomEvent = () => syncStateFromStorage();
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === THEME_KEY) syncStateFromStorage();
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const current = normalizeTheme(localStorage.getItem(THEME_KEY));
      if (!current || current === 'system') {
        applyTheme('system');
      }
    };

    window.addEventListener(THEME_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener(THEME_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [syncStateFromStorage, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: newTheme }));
    } catch (e) {
      // Ignored if storage disabled
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    mounted,
  };
}
