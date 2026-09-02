'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, MoonStar } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { CitySearchModal } from '@/components/location/CitySearchModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { RamadanCalendarExport } from '@/components/ramadan/RamadanCalendarExport';
import { useLocation } from '@/hooks/useLocation';
import { DEFAULT_SETTINGS } from '@/lib/prayer/constants';
import { getRelevantRamadanYear, getRamadanDateRange } from '@/lib/ramadan/calendar';
import { buildRamadanImsakiyah, type RamadanImsakiyahRow } from '@/lib/ramadan/imsakiyah';
import { getDefaultPrayerReminderSettings, getDefaultRamadanPreferences, getPrayerReminderSettings, getRamadanPreferences, getSavedSettings } from '@/lib/storage/preferences';
import type { PrayerReminderSettings, RamadanPreferences, UserSettings } from '@/types';
import { formatTimeInTimeZone } from '@/lib/time/timezone';

export default function RamadanPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [preferences, setPreferences] = useState<RamadanPreferences>(getDefaultRamadanPreferences);
  const [prayerReminders, setPrayerReminders] = useState<PrayerReminderSettings>(getDefaultPrayerReminderSettings);
  const [rows, setRows] = useState<RamadanImsakiyahRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location, selectCity, detectLocation, status } = useLocation();

  useEffect(() => {
    setSettings(getSavedSettings());
    setPreferences(getRamadanPreferences());
    setPrayerReminders(getPrayerReminderSettings());
  }, []);

  const hijriYear = useMemo(
    () => getRelevantRamadanYear(new Date(), location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone),
    [location.timezone]
  );
  const range = useMemo(() => getRamadanDateRange(hijriYear, location.timezone), [hijriYear, location.timezone]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    buildRamadanImsakiyah(
      range,
      location,
      settings,
      preferences.imsakOffsetMinutes
    )
      .then((nextRows) => {
        if (active) setRows(nextRows);
      })
      .catch(() => {
        if (active) {
          setRows([]);
          setError('Jadwal Ramadan belum dapat dimuat. Periksa koneksi atau coba lagi.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, location, settings, preferences.imsakOffsetMinutes]);

  useEffect(() => {
    const handlePreferenceChange = (event: Event) => {
      const detail = (event as CustomEvent<RamadanPreferences>).detail;
      setPreferences(detail || getRamadanPreferences());
    };
    window.addEventListener('sholatku:ramadan-preferences-changed', handlePreferenceChange);
    return () => window.removeEventListener('sholatku:ramadan-preferences-changed', handlePreferenceChange);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar location={location} onOpenLocationModal={() => setIsSearchOpen(true)} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col gap-4 border-b border-surface-200 pb-5 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className="rounded-xl bg-surface-100 p-2 text-slate-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-slate-300"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                <MoonStar className="h-3.5 w-3.5" aria-hidden="true" />
                Ramadan {hijriYear} H
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                Imsakiyah
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Jadwal Imsak, Subuh, dan Maghrib untuk {location.displayName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-slate-200 sm:self-center"
          >
            <MapPin className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <span>{location.displayName}</span>
          </button>
        </div>

        <section className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm text-primary-900 dark:border-primary-900/60 dark:bg-primary-950/30 dark:text-primary-100">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-300" aria-hidden="true" />
            <div>
              <p className="font-semibold">Imsak dihitung {preferences.imsakOffsetMinutes} menit sebelum Subuh.</p>
              <p className="mt-1 text-xs leading-relaxed text-primary-800/80 dark:text-primary-200/80">
                Tanggal mengikuti kalender Hijriah yang dihitung Sholatku dan dapat berbeda dari pengumuman resmi setempat.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-xs dark:border-surface-800 dark:bg-surface-900" aria-label="Jadwal Imsakiyah Ramadan">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[430px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-surface-700 dark:bg-surface-800/80 dark:text-slate-300">
                  <th className="px-4 py-3.5">Ramadan</th>
                  <th className="px-3 py-3.5">Imsak</th>
                  <th className="px-3 py-3.5">Subuh</th>
                  <th className="px-3 py-3.5">Maghrib</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={4} className="px-4 py-3"><Skeleton className="h-5 w-full rounded" /></td>
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={row.date}
                        className={row.isToday ? 'bg-primary-50/90 font-semibold text-primary-900 dark:bg-primary-950/60 dark:text-primary-100' : 'text-slate-800 transition-colors hover:bg-surface-50 dark:text-slate-200 dark:hover:bg-surface-800/50'}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{row.ramadanDay}</span>
                            {row.isToday && <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Hari ini</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono">{formatTimeInTimeZone(row.timing.imsakAt, row.timing.timezone)}</td>
                        <td className="px-3 py-3 font-mono">{formatTimeInTimeZone(row.timing.fajrAt, row.timing.timezone)}</td>
                        <td className="px-3 py-3 font-mono">{formatTimeInTimeZone(row.timing.maghribAt, row.timing.timezone)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && !rows.length && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400" role="status">
              {error || 'Jadwal Ramadan tidak tersedia untuk rentang yang dihitung.'}
            </div>
          )}
        </section>

        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Jadwal menggunakan lokasi, metode hisab, madhab, dan koreksi menit yang sama dengan halaman jadwal sholat. Perubahan pengaturan akan memuat ulang tabel ini.
        </p>
        <RamadanCalendarExport
          rows={rows}
          hijriYear={hijriYear}
          location={location}
          prayerReminderSettings={prayerReminders}
          ramadanReminderSettings={preferences.reminders}
        />
      </main>
      <Footer />
      <BottomNav />
      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentLocation={location}
        onSelectCity={selectCity}
        onDetectLocation={detectLocation}
        isDetecting={status === 'requesting'}
      />
    </div>
  );
}
