'use client';

import React from 'react';
import { PrayerAdjustment, PrayerKey } from '@/types';
import { PRAYER_NAMES } from '@/lib/prayer/constants';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface PrayerAdjustmentEditorProps {
  adjustments: PrayerAdjustment;
  onChange: (adjustments: PrayerAdjustment) => void;
}

const ADJUSTABLE_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PrayerAdjustmentEditor: React.FC<PrayerAdjustmentEditorProps> = ({
  adjustments,
  onChange,
}) => {
  const handleStep = (key: PrayerKey, delta: number) => {
    const current = adjustments[key as keyof PrayerAdjustment] || 0;
    const updated = {
      ...adjustments,
      [key]: Math.min(30, Math.max(-30, current + delta)),
    };
    onChange(updated);
  };

  const handleReset = () => {
    onChange({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
  };

  const hasAdjustments = Object.values(adjustments).some((val) => val !== 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
            Koreksi Menit Manual (Ihtiyat)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tambahkan atau kurangi menit pada masing-masing jadwal bila diperlukan penyesuaian lokal.
          </p>
        </div>

        {hasAdjustments && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (0)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {ADJUSTABLE_KEYS.map((key) => {
          const val = adjustments[key as keyof PrayerAdjustment] || 0;
          const name = PRAYER_NAMES[key]?.id || key;

          return (
            <div
              key={key}
              className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl flex flex-col items-center justify-between gap-2 shadow-2xs"
            >
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {name}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStep(key, -1)}
                  className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                  aria-label={`Kurangi 1 menit untuk ${name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span
                  className={`font-mono text-sm font-bold w-10 text-center ${
                    val > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : val < 0
                      ? 'text-red-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {val > 0 ? `+${val}` : val} m
                </span>

                <button
                  type="button"
                  onClick={() => handleStep(key, 1)}
                  className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                  aria-label={`Tambah 1 menit untuk ${name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
