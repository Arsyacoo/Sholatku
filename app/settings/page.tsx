'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { CalculationMethodSelector } from '@/components/settings/CalculationMethodSelector';
import { MadhabSelector } from '@/components/settings/MadhabSelector';
import { PrayerAdjustmentEditor } from '@/components/settings/PrayerAdjustmentEditor';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { UserSettings, CalculationMethodId, Madhab, PrayerAdjustment } from '@/types';
import { getPrayerReminderSettings, getSavedSettings, savePrayerReminderSettings, saveSettings } from '@/lib/storage/preferences';
import type { PrayerReminderSettings } from '@/types';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(() => getSavedSettings());
  const [reminderSettings, setReminderSettings] = useState<PrayerReminderSettings>(() => getPrayerReminderSettings());
  const [savedToast, setSavedToast] = useState(false);

  const updateSetting = (updater: (prev: UserSettings) => UserSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveSettings(next);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300 hover:bg-surface-200 transition-colors"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pengaturan
              </h1>
              <p className="text-xs text-slate-500">
                Sesuaikan preferensi tema, metode hisab, madhab, dan pengingat adzan
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
            onChange={(next: PrayerReminderSettings) => {
              setReminderSettings(next);
              savePrayerReminderSettings(next);
              setSavedToast(true);
              setTimeout(() => setSavedToast(false), 2000);
            }}
          />
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
