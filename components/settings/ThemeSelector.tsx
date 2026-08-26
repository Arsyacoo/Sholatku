'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, Theme } from '@/hooks/useTheme';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, mounted } = useTheme();

  const options: { id: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'light', label: 'Terang', icon: Sun },
    { id: 'dark', label: 'Gelap', icon: Moon },
    { id: 'system', label: 'Sistem', icon: Laptop },
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Sun className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span>Tema Tampilan</span>
      </label>

      <div className="grid grid-cols-3 gap-2.5">
        {options.map(({ id, label, icon: Icon }) => {
          const isSelected = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-950/70 border-primary-500 text-primary-700 dark:text-primary-300 shadow-2xs'
                  : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-slate-600 dark:text-slate-400 hover:bg-surface-50 dark:hover:bg-surface-800/80'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
