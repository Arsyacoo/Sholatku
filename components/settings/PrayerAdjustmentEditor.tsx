'use client';

import React from 'react';
import { PrayerAdjustment, PrayerKey } from '@/types';
import { prayerName } from '@/lib/prayer/constants';
import { useLanguage } from '@/hooks/useLanguage';
import { IHTIYAT_OPTIONS } from '@/lib/prayer/normalize';
import { Select } from '../ui/Select';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface PrayerAdjustmentEditorProps {
  adjustments: PrayerAdjustment;
  onChange: (adjustments: PrayerAdjustment) => void;
  ihtiyat: number;
  onIhtiyatChange: (minutes: number) => void;
}

const ihtiyatSelectOptions = (t: ReturnType<typeof useLanguage>['t']) =>
  IHTIYAT_OPTIONS.map((minutes) => ({
    value: minutes as number,
    label:
      minutes === 0
        ? t('Tanpa ihtiyat', 'No ihtiyat')
        : minutes === 2
        ? t('+2 menit (Kemenag)', '+2 min (Kemenag)')
        : t(`+${minutes} menit`, `+${minutes} min`),
  }));

const ADJUSTABLE_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PrayerAdjustmentEditor: React.FC<PrayerAdjustmentEditorProps> = ({
  adjustments,
  onChange,
  ihtiyat,
  onIhtiyatChange,
}) => {
  const { t, language } = useLanguage();
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <label htmlFor="ihtiyat" className="block text-sm font-bold text-slate-900 dark:text-slate-100">
            {t('Ihtiyat (waktu kehati-hatian)', 'Ihtiyat (safety margin)')}
          </label>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {t(
              'Jadwal resmi Kemenag menambahkan beberapa menit agar sholat tidak dimulai terlalu awal. Berlaku untuk semua waktu sholat; waktu terbit dimajukan.',
              'The official Kemenag schedule adds a few minutes so prayers never start too early. Applies to all prayer times; sunrise moves earlier.'
            )}
          </p>
        </div>
        <Select
          id="ihtiyat"
          value={ihtiyat}
          options={ihtiyatSelectOptions(t)}
          onValueChange={onIhtiyatChange}
          ariaLabel="Ihtiyat"
          size="sm"
          className="w-[170px] shrink-0"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
            {t('Koreksi Menit Manual', 'Manual Minute Adjustments')}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              'Tambahkan atau kurangi menit per jadwal bila masjid setempat berbeda. Ditambahkan di atas ihtiyat.',
              'Add or subtract minutes per prayer if your local mosque differs. Applied on top of ihtiyat.'
            )}
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
          const name = prayerName(key as keyof PrayerAdjustment, language);

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
                  aria-label={t(`Kurangi 1 menit untuk ${name}`, `Subtract 1 minute from ${name}`)}
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
                  aria-label={t(`Tambah 1 menit untuk ${name}`, `Add 1 minute to ${name}`)}

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
