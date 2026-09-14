'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { CalculationMethodSelector } from '@/components/settings/CalculationMethodSelector';
import { MadhabSelector } from '@/components/settings/MadhabSelector';
import { PrayerAdjustmentEditor } from '@/components/settings/PrayerAdjustmentEditor';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { PrayerCalendarExport } from '@/components/settings/PrayerCalendarExport';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { RamadanPreferences } from '@/components/settings/RamadanPreferences';
import { UserSettings, CalculationMethodId, Madhab, PrayerAdjustment } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/prayer/constants';
import {
  getDefaultPrayerReminderSettings,
  getDefaultRamadanPreferences,
  getPrayerReminderSettings,
  getRamadanPreferences,
  getSavedSettings,
  savePrayerReminderSettings,
  saveRamadanPreferences,
  saveSettings,
} from '@/lib/storage/preferences';
import type { PrayerReminderSettings, RamadanPreferences as RamadanPreferencesValue } from '@/types';
import { useLocation } from '@/hooks/useLocation';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [reminderSettings, setReminderSettings] = useState<PrayerReminderSettings>(getDefaultPrayerReminderSettings);
  const [ramadanPreferences, setRamadanPreferences] = useState<RamadanPreferencesValue>(getDefaultRamadanPreferences);
  const [savedToast, setSavedToast] = useState(false);
  const { location } = useLocation();

  React.useEffect(() => {
    setSettings(getSavedSettings());
    setReminderSettings(getPrayerReminderSettings());
    setRamadanPreferences(getRamadanPreferences());
  }, []);

  const updateSetting = (updater: (prev: UserSettings) => UserSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveSettings(next);
      window.dispatchEvent(new CustomEvent('sholatku:settings-changed', { detail: next }));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-slate-300"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pengaturan
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sesuaikan tema, metode hisab, madhab, dan notifikasi pengingat waktu sholat
              </p>
            </div>
          </div>

          {savedToast && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-fade-in font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Tersimpan</span>
            </div>
          )}
        </div>

        {/* Theme Preference */}
        <section>
          <ThemeSelector />
        </section>

        {/* Calculation Methods */}
        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <CalculationMethodSelector
            value={settings.method}
            onChange={(method: CalculationMethodId) =>
              updateSetting((s) => ({ ...s, method }))
            }
          />
        </section>

        {/* Madhab Selector */}
        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <MadhabSelector
            value={settings.madhab}
            onChange={(madhab: Madhab) =>
              updateSetting((s) => ({ ...s, madhab }))
            }
          />
        </section>

        {/* Manual minute adjustments */}
        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <PrayerAdjustmentEditor
            adjustments={settings.adjustments}
            onChange={(adjustments: PrayerAdjustment) =>
              updateSetting((s) => ({ ...s, adjustments }))
            }
          />
        </section>

        {/* Notifications */}
        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <NotificationPreferences
            value={reminderSettings}
            enabled={settings.enableNotifications}
            onChange={(next: PrayerReminderSettings) => {
              setReminderSettings(next);
              savePrayerReminderSettings(next);
              window.dispatchEvent(new CustomEvent('sholatku:prayer-reminders-changed', { detail: next }));
              setSavedToast(true);
              setTimeout(() => setSavedToast(false), 2000);
            }}
            onEnabledChange={(enabled) =>
              updateSetting((current) => ({ ...current, enableNotifications: enabled }))
            }
          />
        </section>

        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <RamadanPreferences
            value={ramadanPreferences}
            onChange={(next) => {
              setRamadanPreferences(next);
              saveRamadanPreferences(next);
              window.dispatchEvent(new CustomEvent('sholatku:ramadan-preferences-changed', { detail: next }));
              setSavedToast(true);
              setTimeout(() => setSavedToast(false), 2000);
            }}
          />
        </section>

        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <PrayerCalendarExport
            location={location}
            settings={settings}
            reminderSettings={reminderSettings}
          />
        </section>

        <section className="pt-4 border-t border-surface-200 dark:border-surface-800">
          <Link
            href="/privacy"
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 transition-colors hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:hover:bg-surface-800"
            aria-label="Buka Kebijakan Privasi"
          >
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Kebijakan Privasi</span>
              <span className="block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Lihat data yang disimpan di perangkat dan dikirim ke layanan terkait.
              </span>
            </span>
          </Link>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
