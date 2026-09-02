'use client';

import React, { useState, useEffect } from 'react';
import { MonthlyPrayerItem, UserLocation, UserSettings } from '@/types';
import { getMonthlyPrayerTimes } from '@/lib/prayer/api';
import { ChevronLeft, ChevronRight, Printer, Calendar as CalendarIcon, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { isNetworkRequestError } from '@/lib/network/fetch';

interface MonthlyScheduleTableProps {
  location: UserLocation;
  settings: UserSettings;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MonthlyScheduleTable: React.FC<MonthlyScheduleTableProps> = ({ location, settings }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [schedule, setSchedule] = useState<MonthlyPrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getMonthlyPrayerTimes(location, settings, currentYear, currentMonth, {
          signal: controller.signal,
        });
        if (active) {
          setSchedule(data);
        }
      } catch (e) {
        if (!isNetworkRequestError(e, 'aborted')) console.error(e);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [location, settings, currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
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
          <Button variant="secondary" size="icon" onClick={handlePrevMonth} aria-label="Bulan sebelumnya">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center min-w-[160px]">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h2>
            <span className="text-xs text-slate-500">{location.displayName}</span>
          </div>
          <Button variant="secondary" size="icon" onClick={handleNextMonth} aria-label="Bulan berikutnya">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="no-print text-xs">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak Jadwal
          </Button>
        </div>
      </div>

      {/* Schedule Table Container */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-800/80 border-b border-surface-200 dark:border-surface-700 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-3">Subuh</th>
                <th className="py-3.5 px-3">Terbit</th>
                <th className="py-3.5 px-3">Dzuhur</th>
                <th className="py-3.5 px-3">Ashar</th>
                <th className="py-3.5 px-3">Maghrib</th>
                <th className="py-3.5 px-3">Isya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-2.5 px-4">
                      <Skeleton className="h-6 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : (
                schedule.map((item) => (
                  <tr
                    key={item.date}
                    className={`transition-colors ${
                      item.isToday
                        ? 'bg-primary-50/90 dark:bg-primary-950/60 font-semibold text-primary-900 dark:text-primary-100'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-6">{item.dayNumber}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.dayName}</span>
                        {item.isToday && (
                          <span className="bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Hari Ini
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">{item.timings.fajr}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.timings.sunrise}</td>
                    <td className="py-3 px-3 font-mono">{item.timings.dhuhr}</td>
                    <td className="py-3 px-3 font-mono">{item.timings.asr}</td>
                    <td className="py-3 px-3 font-mono">{item.timings.maghrib}</td>
                    <td className="py-3 px-3 font-mono">{item.timings.isha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
