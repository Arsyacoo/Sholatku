'use client';

import Link from 'next/link';
import { Loader2, XCircle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { normalizeSearchText } from '@/lib/quran/search/normalize';
import type { QuranSearchResponse, QuranSearchResult } from '@/lib/quran/search/types';

interface QuranSearchResultsProps {
  query: string;
  response: QuranSearchResponse;
  isSearching: boolean;
  onLoadMore: () => void;
}

function HighlightedTranslation({ text, query }: { text: string; query: string }) {
  const normalizedQuery = normalizeSearchText(query);
  const start = text.toLowerCase().indexOf(normalizedQuery.toLowerCase());
  if (!normalizedQuery || start < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-amber-100 px-0.5 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
        {text.slice(start, start + normalizedQuery.length)}
      </mark>
      {text.slice(start + normalizedQuery.length)}
    </>
  );
}

function resultHref(result: QuranSearchResult): string {
  return result.kind === 'ayah'
    ? `/quran/${result.surahNumber}?ayah=${result.ayahNumber}`
    : `/quran/${result.surahNumber}`;
}

function SearchResultItem({ result, query }: { result: QuranSearchResult; query: string }) {
  return (
    <Link
      href={resultHref(result)}
      className="block rounded-2xl border border-surface-200 bg-white p-4 transition hover:border-primary-400 hover:shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-700"
      aria-label={
        result.kind === 'ayah'
          ? `Buka ${result.surahName} ayat ${result.ayahNumber}`
          : `Buka Surah ${result.surahName}`
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {result.surahName}
          {result.kind === 'ayah' && <span className="font-normal text-slate-500"> · Ayat {result.ayahNumber}</span>}
        </p>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          {result.kind === 'surah' ? 'Surah' : result.matchType === 'arabic' ? 'Arab' : 'Terjemahan'}
        </span>
      </div>
      {result.kind === 'surah' ? (
        <p className="mt-1 font-arabic text-lg text-slate-600 dark:text-slate-300" dir="rtl" lang="ar">
          {result.surahNameArabic}
        </p>
      ) : (
        <>
          <p className="mt-3 text-right font-arabic text-xl leading-loose text-slate-900 dark:text-slate-50" dir="rtl" lang="ar">
            {result.arabic}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            &ldquo;<HighlightedTranslation text={result.translation} query={query} />&rdquo;
          </p>
        </>
      )}
    </Link>
  );
}

export function QuranSearchResults({ query, response, isSearching, onLoadMore }: QuranSearchResultsProps) {
  const isOnline = useOnlineStatus();
  const { coverage } = response;

  if (!query.trim()) return null;

  const coverageMessage = !isOnline
    ? `Offline — mencari dalam ${coverage.indexedSurahs} Surah yang tersimpan.`
    : coverage.isComplete
      ? 'Pencarian lokal mencakup seluruh Al-Qur’an.'
      : `Pencarian lokal saat ini mencakup ${coverage.indexedSurahs} Surah yang tersimpan.`;

  return (
    <section className="space-y-3" aria-live="polite" aria-labelledby="quran-search-results-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="quran-search-results-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Hasil pencarian
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{coverageMessage}</p>
        </div>
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-primary-600" aria-label="Mencari" />}
      </div>

      {response.emptyReason === 'too-short' ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-surface-800 dark:bg-surface-900">
          Ketik minimal 2 karakter untuk mencari ayat atau Surah.
        </div>
      ) : response.emptyReason === 'invalid-reference' ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          Referensi ayat tidak valid. Gunakan format seperti 2:255.
        </div>
      ) : response.results.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center dark:border-surface-800 dark:bg-surface-900">
          <XCircle className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {coverage.isComplete
              ? `Tidak ditemukan hasil untuk “${query}”.`
              : `Tidak ditemukan dalam ${coverage.indexedSurahs} Surah yang tersedia offline.`}
          </p>
          {!coverage.isComplete && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Hubungkan ke internet atau unduh lebih banyak Surah untuk memperluas pencarian.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {response.results.map((result) => (
              <SearchResultItem key={result.id} result={result} query={query} />
            ))}
          </div>
          {response.hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className="mx-auto block rounded-xl border border-primary-300 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950/40"
            >
              Tampilkan lebih banyak
            </button>
          )}
        </>
      )}
    </section>
  );
}
