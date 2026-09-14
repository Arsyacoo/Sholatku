'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  HardDriveDownload,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { useQuranOfflineManager, type OfflineSurahAction } from '@/hooks/useQuranOfflineManager';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
  const {
    cachedIds,
    infoById,
    cachedCount,
    estimatedSize,
    storageEstimate,
    isLoading,
    actionById,
    errorById,
    downloadSurah,
    removeSurah,
    bulkStatus,
    bulkProgress,
    failedBulkIds,
    bulkError,
    storageWarning,
    startBulkDownload,
    resumeBulkDownload,
    retryFailedDownloads,
    cancelBulkDownload,
    clearAllOffline,
  } = useQuranOfflineManager();
  const [deleteTarget, setDeleteTarget] = useState<(typeof SURAH_LIST)[number] | null>(null);
  const [clearAllTarget, setClearAllTarget] = useState(false);

  const getAction = (number: number, isCached: boolean): OfflineSurahAction =>
    actionById[number] || (isCached ? 'available' : 'idle');

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
            terhubung ke internet. Indeks pencarian ayat offline dibentuk dari Surah yang
            tersimpan. Audio tidak disimpan dalam pengelola offline ini.
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
          {bulkStatus === 'downloading' ? (
            <button
              type="button"
              onClick={cancelBulkDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-surface-900 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Batal
            </button>
          ) : bulkStatus === 'paused' ? (
            <button
              type="button"
              onClick={() => void resumeBulkDownload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Lanjutkan Download
            </button>
          ) : failedBulkIds.length > 0 ? (
            <button
              type="button"
              onClick={() => void retryFailedDownloads()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Coba Lagi ({failedBulkIds.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startBulkDownload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download Semua Al-Qur&apos;an
            </button>
          )}
        </div>
        {(bulkStatus !== 'idle' || bulkError || storageWarning) && (
          <div className="mt-4 space-y-2" aria-live="polite">
            {bulkStatus === 'downloading' && (
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                Sedang mengunduh teks Quran dengan maksimal 3 koneksi bersamaan.
              </p>
            )}
            {bulkStatus === 'paused' && (
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Download dijeda. Surah yang sudah selesai tetap tersimpan dan dapat dilanjutkan.
              </p>
            )}
            {bulkStatus === 'completed' && failedBulkIds.length === 0 && (
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Semua teks Surah sudah tersedia offline.
              </p>
            )}
            {failedBulkIds.length > 0 && (
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {failedBulkIds.length} Surah gagal diunduh. Gunakan tombol coba lagi untuk mengulangi yang gagal.
              </p>
            )}
            {bulkError && <p className="text-sm text-red-600 dark:text-red-400">{bulkError}</p>}
            {storageWarning && <p className="text-sm text-amber-700 dark:text-amber-300">{storageWarning}</p>}
            <div className="flex items-center gap-3">
              <progress
                className="h-2 flex-1 accent-primary-600"
                value={bulkProgress.completed}
                max={bulkProgress.total}
                aria-label={`Progress download Quran: ${bulkProgress.completed} dari ${bulkProgress.total} Surah`}
              />
              <span className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">
                {bulkProgress.completed} / {bulkProgress.total}
              </span>
            </div>
          </div>
        )}
        {cachedCount > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={bulkStatus === 'downloading'}
              onClick={() => setClearAllTarget(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Hapus semua Surah offline
            </button>
          </div>
        )}
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
                  {getAction(surah.number, isCached) === 'available' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        <span>Tersedia Offline</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(surah)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400"
                        aria-label={`Hapus ${surah.name} dari penyimpanan offline`}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" /> Hapus
                      </button>
                    </div>
                  )}
                  {getAction(surah.number, isCached) === 'idle' && (
                    <button
                      type="button"
                      disabled={bulkStatus === 'downloading'}
                      onClick={() => void downloadSurah(surah.number)}
                      className="inline-flex scroll-mb-24 items-center gap-1.5 rounded-lg border border-primary-300 px-2.5 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950/50"
                      aria-label={`Download ${surah.name} untuk offline`}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                    </button>
                  )}
                  {getAction(surah.number, isCached) === 'downloading' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300" role="status">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Mengunduh...
                    </span>
                  )}
                  {getAction(surah.number, isCached) === 'deleting' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500" role="status">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Menghapus...
                    </span>
                  )}
                  {getAction(surah.number, isCached) === 'failed' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400" role="status">
                        <XCircle className="h-4 w-4" aria-hidden="true" /> Gagal mengunduh
                      </span>
                      <button
                        type="button"
                        onClick={() => void downloadSurah(surah.number)}
                        className="text-[11px] font-bold text-primary-700 hover:underline dark:text-primary-300"
                        aria-label={`Coba lagi download ${surah.name}`}
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                  {getAction(surah.number, isCached) === 'delete-failed' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400" role="status">
                        <XCircle className="h-4 w-4" aria-hidden="true" /> Gagal menghapus
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeSurah(surah.number)}
                        className="text-[11px] font-bold text-primary-700 hover:underline dark:text-primary-300"
                        aria-label={`Coba lagi menghapus ${surah.name}`}
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                  {info && <p className="mt-0.5 text-[10px] text-slate-400">{formatBytes(info.estimatedSize)}</p>}
                  {errorById[surah.number] && ['failed', 'delete-failed'].includes(getAction(surah.number, isCached)) && (
                    <p className="mt-0.5 max-w-[150px] text-[10px] text-red-500">{errorById[surah.number]}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? `Hapus ${deleteTarget.name}?` : 'Hapus Surah?'}
        maxWidth="sm"
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Surah ini tidak lagi tersedia ketika perangkat offline. Bookmark, favorit, terakhir dibaca,
          dan pengaturan Quran tidak akan dihapus.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={deleteTarget ? actionById[deleteTarget.number] === 'deleting' : false}
            onClick={async () => {
              if (!deleteTarget) return;
              const removed = await removeSurah(deleteTarget.number);
              if (removed) setDeleteTarget(null);
            }}
          >
            Hapus
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={clearAllTarget}
        onClose={() => setClearAllTarget(false)}
        title="Hapus semua Surah offline?"
        maxWidth="sm"
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Seluruh teks Surah dan indeks pencarian ayat offline yang tersimpan akan dihapus dari perangkat.
          Bookmark, favorit, terakhir dibaca, dan pengaturan Quran tetap aman.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setClearAllTarget(false)}>
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              const cleared = await clearAllOffline();
              if (cleared) setClearAllTarget(false);
            }}
          >
            Hapus Semua
          </Button>
        </div>
      </Modal>
    </main>
  );
}
