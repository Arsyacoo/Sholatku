'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const { t } = useLanguage();

  if (!mounted) {
    return (
      <div className={`h-11 w-11 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 animate-pulse ${className}`} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl bg-surface-100 text-slate-700 shadow-2xs transition-all duration-200 hover:bg-surface-200 active:scale-95 dark:bg-surface-800 dark:text-slate-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 ${className}`}
      aria-label={isDark ? t('Beralih ke mode terang', 'Switch to light mode') : t('Beralih ke mode gelap', 'Switch to dark mode')}
      title={isDark ? t('Mode Terang', 'Light mode') : t('Mode Gelap', 'Dark mode')}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-gold-400 rotate-0 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-primary-700 -rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};
