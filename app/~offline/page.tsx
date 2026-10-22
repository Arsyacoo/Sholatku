'use client';

import Link from 'next/link';
import { BookOpen, Home, WifiOff } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function OfflinePage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-surface-50 dark:bg-surface-950">
      <section className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
          <WifiOff className="h-10 w-10" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
            {t('Mode offline', 'Offline mode')}
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('Koneksi internet sedang tidak tersedia', 'No internet connection right now')}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t(
              "Beberapa fitur tetap tersedia menggunakan data yang tersimpan di perangkat. Surat Al-Qur'an yang pernah dibuka tetap dapat dibaca secara offline.",
              "Some features still work using data saved on this device. Surahs you have opened before can still be read offline."
            )}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/quran"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t("Buka Al-Qur'an", "Open Al-Qur'an")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {t('Beranda', 'Home')}
          </Link>
        </div>
      </section>
    </main>
  );
}
