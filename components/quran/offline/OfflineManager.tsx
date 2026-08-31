'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Download, HardDriveDownload, Loader2 } from 'lucide-react';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { useQuranOfflineManager } from '@/hooks/useQuranOfflineManager';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Belum tersedia';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function OfflineManager() {
  const { cachedIds, infoById, cachedCount, estimatedSize, storageEstimate, isLoading } =
    useQuranOfflineManager();

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/quran"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke Al-Qur&apos;an
        </Link>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
          Quran Offline
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Kelola bacaan offline
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Simpan teks Al-Qur&apos;an di perangkat agar tetap dapat dibaca meskipun tidak
          terhubung ke internet. Audio tidak disimpan dalam pengelola offline ini.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan penyimpanan offline">
        <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Surah tersimpan</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {isLoading ? '—' : cachedCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">dari {SURAH_LIST.length} Surah</p>
        </div>
        <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Perkiraan Quran</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {isLoading ? '—' : formatBytes(estimatedSize)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">berdasarkan metadata cache</p>
        </div>
        <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Storage browser</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {storageEstimate ? formatBytes(storageEstimate.usage) : 'Tidak tersedia'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {storageEstimate?.percentage !== null && storageEstimate?.percentage !== undefined
              ? `${storageEstimate.percentage.toFixed(1)}% dari kuota`
              : 'perkiraan browser tidak tersedia'}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-primary-200 bg-primary-50/70 p-5 dark:border-primary-900 dark:bg-primary-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HardDriveDownload className="mt-0.5 h-5 w-5 shrink-0 text-primary-700 dark:text-primary-300" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Simpan semua teks Quran</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Surah yang sudah tersimpan akan dilewati.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white opacity-60"
            aria-label="Download semua Al-Qur'an akan tersedia setelah manager diaktifkan"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Semua Al-Qur&apos;an
          </button>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="offline-surah-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="offline-surah-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Daftar Surah
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pilih Surah yang ingin tersedia offline.</p>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary-600" aria-label="Memuat status cache" />}
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {SURAH_LIST.map((surah) => {
            const isCached = cachedIds.has(surah.number);
            const info = infoById.get(surah.number);
            return (
              <article
                key={surah.number}
                className="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white p-3.5 dark:border-surface-800 dark:bg-surface-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-xs font-bold text-slate-700 dark:bg-surface-800 dark:text-slate-200">
                    {surah.number}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{surah.name}</h3>
                    <p className="truncate font-arabic text-sm text-slate-500 dark:text-slate-400">{surah.arabicName}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {isCached ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Tersedia Offline</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Belum tersimpan</span>
                  )}
                  {info && <p className="mt-0.5 text-[10px] text-slate-400">{formatBytes(info.estimatedSize)}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

