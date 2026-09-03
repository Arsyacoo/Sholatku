'use client';

import React from 'react';
import { DailyPrayerSchedule, NextPrayerInfo, PrayerKey } from '@/types';
import { PrayerTimeCard } from './PrayerTimeCard';
import { PRAYER_NAMES } from '@/lib/prayer/constants';
import { Skeleton } from '../ui/Skeleton';
import { parsePrayerDateTime } from '@/lib/prayer/reminders/schedule';
import { getTimeZoneLabel } from '@/lib/time/timezone';

interface PrayerScheduleListProps {
  schedule: DailyPrayerSchedule | null;
  nextPrayerInfo: NextPrayerInfo | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PrayerScheduleList: React.FC<PrayerScheduleListProps> = ({
  schedule,
  nextPrayerInfo,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  if (isLoading && !schedule) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-full h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100" role="alert">
        <h2 className="font-semibold">Jadwal sholat belum dapat dimuat.</h2>
        <p className="mt-1 text-sm text-rose-800/80 dark:text-rose-200/80">
          {error || 'Periksa koneksi internet atau coba kembali.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          >
            Coba Lagi
          </button>
        )}
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Jadwal Sholat Hari Ini
        </h2>
        <span className="text-xs text-slate-600 dark:text-slate-400">Zona {getTimeZoneLabel(schedule.timezone)}</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
        {PRAYER_KEYS.map((key) => {
          const time = schedule.timings[key] || '00:00';
          const names = PRAYER_NAMES[key] || { id: key, ar: key };

          // Build today timestamp for comparison
          const isPassed = parsePrayerDateTime(schedule.date, time, schedule.timezone).getTime() <= now;

          const isNext = !nextPrayerInfo?.isTomorrowFajr && nextPrayerInfo?.nextPrayer.id === key;
          const isCurrent = nextPrayerInfo?.currentPrayer?.id === key;

          return (
            <PrayerTimeCard
              key={key}
              id={key}
              name={names.id}
              arabicName={names.ar}
              time={time}
              isPassed={isPassed}
              isCurrent={isCurrent}
              isNext={isNext}
              isPrayer={key !== 'sunrise'}
              timezoneLabel={getTimeZoneLabel(schedule.timezone)}
            />
          );
        })}
      </div>
    </div>
  );
};
