import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, ExternalLink, FlaskConical, ShieldCheck } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Android Preview / Beta',
  description: 'Preview / Beta Sholatku untuk Android melalui distribusi APK langsung.',
  alternates: { canonical: '/download' },
};

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <header className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Direct Preview / Beta
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Sholatku untuk Android
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              Halaman resmi untuk distribusi APK langsung Sholatku. Build ini adalah preview / beta untuk pengujian,
              bukan versi production atau stable.
            </p>
          </header>

          <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900 dark:bg-amber-950/20 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
              <div className="space-y-2 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
                <p className="font-bold">Status: Preview / Beta, channel direct-preview</p>
                <p>
                  APK belum tersedia. File download dan checksum akan ditambahkan setelah direct signing selesai dan
                  artifact melewati verifikasi instalasi.
                </p>
                <p>
                  Backend preview menggunakan staging Sholatku. Endpoint ini bukan backend production dan tidak boleh
                  diperlakukan sebagai rilis stabil.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3" aria-label="Informasi preview Android">
            <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Versi</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">0.1.0</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Android minimum</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Android 7.0+</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Channel</p>
              <p className="mt-1 text-lg font-bold text-primary-700 dark:text-primary-300">direct-preview</p>
            </div>
          </section>

          <section className="rounded-3xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900 sm:p-6">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <div className="min-w-0 space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Download APK</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Link resmi akan aktif setelah APK preview ditandatangani, diverifikasi, dan dipublikasikan dengan
                    approval terpisah.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-surface-200 px-4 py-2.5 text-sm font-bold text-slate-500 dark:bg-surface-800 dark:text-slate-500"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  APK belum tersedia
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">SHA-256: menunggu artifact direct preview.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Sumber resmi</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Setelah tersedia, download akan berasal dari website Sholatku dan halaman GitHub Releases resmi. Jangan
              mengunduh APK dari mirror yang tidak tercantum di sini.
            </p>
            <Link
              href="https://github.com/Arsyacoo/Sholatku/releases"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-slate-200 dark:hover:bg-surface-800"
            >
              Lihat GitHub Releases
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="space-y-4 border-t border-surface-200 pt-6 dark:border-surface-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cara instalasi aman</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <li>Download APK hanya dari website resmi atau GitHub Releases resmi Sholatku.</li>
              <li>Buka file APK yang telah diunduh.</li>
              <li>Jika Android meminta izin Install unknown apps, izinkan hanya browser atau file manager yang digunakan.</li>
              <li>Instal Sholatku, lalu nonaktifkan kembali izin tersebut bila sudah tidak diperlukan.</li>
              <li>Jangan menonaktifkan Play Protect atau keamanan perangkat secara global.</li>
            </ol>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
