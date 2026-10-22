'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import type { Language } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

// Endonyms: each language is shown in its own name, regardless of the current UI language.
const OPTIONS: { id: Language; label: string }[] = [
  { id: 'id', label: 'Bahasa Indonesia' },
  { id: 'en', label: 'English' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Languages className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span>{t('Bahasa', 'Language')}</span>
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        {OPTIONS.map(({ id, label }) => {
          const isSelected = value === id;
          return (
            <button
              key={id}
              type="button"
              lang={id}
              aria-pressed={isSelected}
              onClick={() => onChange(id)}
              className={`flex items-center justify-center p-3 min-h-11 rounded-2xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-950/70 border-primary-500 text-primary-700 dark:text-primary-300 shadow-2xs'
                  : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-slate-600 dark:text-slate-400 hover:bg-surface-50 dark:hover:bg-surface-800/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
