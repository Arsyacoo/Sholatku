'use client';

import React from 'react';
import { DailyPrayerSchedule, NextPrayerInfo, PrayerKey } from '@/types';
import { PrayerTimeCard } from './PrayerTimeCard';
import { PRAYER_NAMES } from '@/lib/prayer/constants';
import { Skeleton } from '../ui/Skeleton';

interface PrayerScheduleListProps {
  schedule: DailyPrayerSchedule | null;
  nextPrayerInfo: NextPrayerInfo | null;
  isLoading?: boolean;
}

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PrayerScheduleList: React.FC<PrayerScheduleListProps> = ({
  schedule,
  nextPrayerInfo,
  isLoading = false,
}) => {
  if (isLoading || !schedule) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-full h-16 rounded-2xl" />
        ))}
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
        <span className="text-xs text-slate-400">Zona {schedule.timezone}</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
        {PRAYER_KEYS.map((key) => {
          const time = schedule.timings[key] || '00:00';
          const names = PRAYER_NAMES[key] || { id: key, ar: key };

          // Build today timestamp for comparison
          const [h, m] = time.split(':').map(Number);
          const prayerDate = new Date();
          prayerDate.setHours(h, m, 0, 0);
          const isPassed = prayerDate.getTime() <= now;

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
            />
          );
        })}
      </div>
    </div>
  );
};
