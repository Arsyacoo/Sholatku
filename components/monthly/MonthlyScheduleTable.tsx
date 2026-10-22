'use client';

import React, { useState, useEffect } from 'react';
import { MonthlyPrayerItem, UserLocation, UserSettings } from '@/types';
import { getMonthlyPrayerTimes } from '@/lib/prayer/api';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { isNetworkRequestError } from '@/lib/network/fetch';
import { LatestRequestController } from '@/lib/network/latest-request';
import { useLanguage } from '@/hooks/useLanguage';
import { prayerName } from '@/lib/prayer/constants';
import { formatCanonicalDate } from '@/lib/time/timezone';

interface MonthlyScheduleTableProps {
  location: UserLocation;
  settings: UserSettings;
}

type MonthlyLoadState = 'hydrating' | 'loading' | 'success' | 'empty' | 'error';

export const MonthlyScheduleRow: React.FC<{ item: MonthlyPrayerItem }> = ({ item }) => {
  const { t, locale } = useLanguage();
  return (
  <tr
    className={`transition-colors ${
      item.isToday
        ? 'bg-primary-50/90 dark:bg-primary-950/60 font-semibold text-primary-900 dark:text-primary-100'
        : 'hover:bg-surface-50 dark:hover:bg-surface-800/50 text-slate-800 dark:text-slate-200'
    }`}
  >
    <td className="py-3 px-4">
      <div className="flex min-w-max items-center gap-2">
        <span className="font-mono font-bold w-6">{item.dayNumber}</span>
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{formatCanonicalDate(item.date, locale, { weekday: 'long' })}</span>
        {item.isToday && (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold leading-4 text-white">
            {t('Hari ini', 'Today')}
          </span>
        )}
      </div>
    </td>
    <td className="py-3 px-3 font-mono">{item.timings.fajr}</td>
    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{item.timings.sunrise}</td>
    <td className="py-3 px-3 font-mono">{item.timings.dhuhr}</td>
    <td className="py-3 px-3 font-mono">{item.timings.asr}</td>
    <td className="py-3 px-3 font-mono">{item.timings.maghrib}</td>
    <td className="py-3 px-3 font-mono">{item.timings.isha}</td>
  </tr>
  );
};

export const MonthlyScheduleTable: React.FC<MonthlyScheduleTableProps> = ({ location, settings }) => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number | null>(null); // 1-12
  const [schedule, setSchedule] = useState<MonthlyPrayerItem[]>([]);
  const [loadState, setLoadState] = useState<MonthlyLoadState>('hydrating');
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const { t, language, locale } = useLanguage();
  const requestsRef = React.useRef<LatestRequestController | null>(null);
  if (!requestsRef.current) requestsRef.current = new LatestRequestController();

  const requestLocation = React.useMemo<UserLocation>(() => ({
    city: location.city,
    district: location.district,
    province: location.province,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    isAutoDetected: location.isAutoDetected,
    displayName: location.displayName,
  }), [
    location.city,
    location.district,
    location.province,
    location.country,
    location.latitude,
    location.longitude,
    location.timezone,
    location.isAutoDetected,
    location.displayName,
  ]);
  const requestSettings = React.useMemo<UserSettings>(() => ({
    method: settings.method,
    madhab: settings.madhab,
    adjustments: {
      fajr: settings.adjustments.fajr,
      sunrise: settings.adjustments.sunrise,
      dhuhr: settings.adjustments.dhuhr,
      asr: settings.adjustments.asr,
      maghrib: settings.adjustments.maghrib,
      isha: settings.adjustments.isha,
    },
    ihtiyat: settings.ihtiyat,
    language: settings.language,
    timeFormat24h: settings.timeFormat24h,
    theme: settings.theme,
    enableNotifications: settings.enableNotifications,
    notifyBeforeMinutes: settings.notifyBeforeMinutes,
    adhanSound: settings.adhanSound,
  }), [
    settings.method,
    settings.madhab,
    settings.adjustments.fajr,
    settings.adjustments.sunrise,
    settings.adjustments.dhuhr,
    settings.adjustments.asr,
    settings.adjustments.maghrib,
    settings.adjustments.isha,
    settings.ihtiyat,
    settings.language,
    settings.timeFormat24h,
    settings.theme,
    settings.enableNotifications,
    settings.notifyBeforeMinutes,
    settings.adhanSound,
  ]);

  useEffect(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  }, []);

  useEffect(() => {
    if (currentYear === null || currentMonth === null) return undefined;
    const request = requestsRef.current!.begin();
    setLoadState('loading');
    setSchedule([]);
    setError(null);
    const load = async () => {
      try {
        const data = await getMonthlyPrayerTimes(requestLocation, requestSettings, currentYear, currentMonth, {
          signal: request.signal,
        });
        if (!request.isCurrent()) return;
        setSchedule(data);
        setLoadState(data.length > 0 ? 'success' : 'empty');
      } catch (e: unknown) {
        if (!request.isCurrent() || isNetworkRequestError(e, 'aborted')) return;
        console.error('Failed to fetch monthly prayer schedule:', e);
        setSchedule([]);
        setError('load-failed');
        setLoadState('error');
      } finally {
        if (request.isCurrent()) requestsRef.current?.finish(request);
      }
    };
    load();
    return () => {
      if (request.isCurrent()) requestsRef.current?.cancel();
    };
  }, [
    currentYear,
    currentMonth,
    retryToken,
    requestLocation,
    requestSettings,
  ]);

  const handlePrevMonth = () => {
    if (currentMonth === null || currentYear === null) return;
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y === null ? y : y - 1);
    } else {
      setCurrentMonth((m) => m === null ? m : m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === null || currentYear === null) return;
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y === null ? y : y + 1);
    } else {
      setCurrentMonth((m) => m === null ? m : m + 1);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Month & Year Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={handlePrevMonth} aria-label={t('Bulan sebelumnya', 'Previous month')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center min-w-[160px]">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {currentMonth !== null && currentYear !== null
                ? formatCanonicalDate(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`, locale, { month: 'long', year: 'numeric' })
                : t('Memuat kalender…', 'Loading calendar…')}
            </h2>
            <span className="text-xs text-slate-600 dark:text-slate-400">{location.displayName}</span>
          </div>
          <Button variant="secondary" size="icon" onClick={handleNextMonth} aria-label={t('Bulan berikutnya', 'Next month')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="no-print text-xs">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            {t('Cetak Jadwal', 'Print schedule')}
          </Button>
        </div>
      </div>

      {/* Schedule Table Container */}
      {loadState === 'error' ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100" role="alert">
          <h2 className="font-semibold">{t('Jadwal bulanan belum dapat dimuat.', 'The monthly schedule could not be loaded.')}</h2>
          <p className="mt-1 text-sm text-rose-800/80 dark:text-rose-200/80">
            {error
              ? t('Jadwal bulanan belum dapat dimuat. Silakan coba lagi.', 'The monthly schedule could not be loaded. Please try again.')
              : t('Periksa koneksi internet atau coba kembali.', 'Check your internet connection or try again.')}
          </p>
          <button
            type="button"
            onClick={() => setRetryToken((value) => value + 1)}
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          >
            {t('Coba Lagi', 'Try again')}
          </button>
        </div>
      ) : loadState === 'empty' ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-surface-800 dark:bg-surface-900 dark:text-slate-300">
          {t('Jadwal untuk bulan ini belum tersedia.', 'The schedule for this month is not available yet.')}
        </div>
      ) : (
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-800/80 border-b border-surface-200 dark:border-surface-700 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4">{t('Tanggal', 'Date')}</th>
                <th className="py-3.5 px-3">{prayerName('fajr', language)}</th>
                <th className="py-3.5 px-3">{prayerName('sunrise', language)}</th>
                <th className="py-3.5 px-3">{prayerName('dhuhr', language)}</th>
                <th className="py-3.5 px-3">{prayerName('asr', language)}</th>
                <th className="py-3.5 px-3">{prayerName('maghrib', language)}</th>
                <th className="py-3.5 px-3">{prayerName('isha', language)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {loadState === 'hydrating' || loadState === 'loading' ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-2.5 px-4">
                      <Skeleton className="h-6 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : (
                schedule.map((item) => <MonthlyScheduleRow key={item.date} item={item} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
