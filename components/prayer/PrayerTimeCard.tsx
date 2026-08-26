'use client';

import React from 'react';
import { Sun, Moon, Sunrise, Sunset, CloudSun, Clock, CheckCircle2 } from 'lucide-react';
import { PrayerKey } from '@/types';

interface PrayerTimeCardProps {
  id: PrayerKey;
  name: string;
  arabicName: string;
  time: string;
  isPassed: boolean;
  isCurrent: boolean;
  isNext: boolean;
  isPrayer: boolean;
}

export const PrayerTimeCard: React.FC<PrayerTimeCardProps> = ({
  id,
  name,
  arabicName,
  time,
  isPassed,
  isCurrent,
  isNext,
  isPrayer,
}) => {
  const getIcon = () => {
    switch (id) {
      case 'fajr':
        return Sunrise;
      case 'sunrise':
        return Sun;
      case 'dhuhr':
        return Sun;
      case 'asr':
        return CloudSun;
      case 'maghrib':
        return Sunset;
      case 'isha':
        return Moon;
      default:
        return Clock;
    }
  };

  const Icon = getIcon();

  return (
    <div
      className={`relative flex items-center justify-between p-4 sm:p-5 rounded-2xl transition-all duration-300 ${
        isNext
          ? 'bg-primary-50 dark:bg-primary-950/50 border-2 border-primary-500 shadow-md shadow-primary-500/10 scale-[1.01]'
          : isCurrent
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800'
          : isPassed
          ? 'bg-surface-50 dark:bg-surface-900/50 border border-surface-200/60 dark:border-surface-800/60 opacity-75'
          : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 shadow-xs'
      }`}
    >
      {/* Active marker pill */}
      {isNext && (
        <div className="absolute -top-2.5 right-4 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          Berikutnya
        </div>
      )}

      {isCurrent && !isNext && (
        <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          Sedang Aktif
        </div>
      )}

      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Icon Circle */}
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isNext
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
              : isCurrent
              ? 'bg-emerald-600 text-white'
              : isPassed
              ? 'bg-surface-200 dark:bg-surface-800 text-slate-400'
              : 'bg-surface-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Names */}
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={`text-base sm:text-lg font-bold tracking-tight ${
                isNext
                  ? 'text-primary-900 dark:text-primary-100'
                  : isPassed
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {name}
            </h3>
            {!isPrayer && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                (Syuruq)
              </span>
            )}
          </div>
          <span className="font-arabic text-sm text-slate-400 dark:text-slate-500 select-none">
            {arabicName}
          </span>
        </div>
      </div>

      {/* Time display */}
      <div className="flex items-center gap-3 text-right">
        <div>
          <span
            className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
              isNext
                ? 'text-primary-700 dark:text-primary-300'
                : isPassed
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {time}
          </span>
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">WIB</div>
        </div>

        {isPassed && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 hidden sm:block" />
        )}
      </div>
    </div>
  );
};
