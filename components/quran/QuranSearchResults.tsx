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
  searchStatus?: 'idle' | 'loading' | 'ready' | 'error';
  searchError?: string | null;
  onRetrySearch?: () => void;
  corpusStatus?: 'idle' | 'loading' | 'ready' | 'error';
  corpusError?: string | null;
  onRetryCorpus?: () => void;
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

function SearchResultItem({
  result,
  query,
  isOnline,
}: {
  result: QuranSearchResult;
  query: string;
  isOnline: boolean;
}) {
  const unavailableOffline = !isOnline && !result.readerAvailableOffline;

  return (
    <div>
      <Link
        href={resultHref(result)}
        onClick={(event) => {
          if (unavailableOffline) event.preventDefault();
        }}
        aria-disabled={unavailableOffline}
        className={`block rounded-2xl border bg-white p-4 transition dark:bg-surface-900 ${
          unavailableOffline
            ? 'cursor-not-allowed border-surface-200 opacity-80 dark:border-surface-800'
            : 'border-surface-200 hover:border-primary-400 hover:shadow-sm dark:border-surface-800 dark:hover:border-primary-700'
        }`}
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
            {result.kind === 'surah' && (
              <span className="font-normal text-slate-500"> · {result.numberOfAyahs} Ayat</span>
            )}
          </p>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
            {result.kind === 'surah'
              ? 'Surat'
              : result.matchType === 'reference'
                ? 'Referensi'
                : result.matchType === 'arabic'
                  ? 'Arab'
                  : 'Terjemahan'}
          </span>
        </div>
        {result.kind === 'surah' ? (
          <>
            <p className="mt-1 font-arabic text-lg text-slate-600 dark:text-slate-300" dir="rtl" lang="ar">
              {result.surahNameArabic}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Surah {result.surahNumber} · {result.translation}</p>
          </>
        ) : (
          <>
            {result.arabic && (
              <p className="mt-3 text-right font-arabic text-xl leading-loose text-slate-900 dark:text-slate-50" dir="rtl" lang="ar">
                {result.arabic}
              </p>
            )}
            {result.translation && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                &ldquo;<HighlightedTranslation text={result.translation} query={query} />&rdquo;
              </p>
            )}
          </>
        )}
      </Link>
      {unavailableOffline && (
        <p className="mt-1 px-2 text-xs text-amber-700 dark:text-amber-300">
          Surat ini belum tersedia untuk dibaca offline.{' '}
          <Link href="/quran/offline" className="font-bold underline underline-offset-2">
            Kelola offline
          </Link>
        </p>
      )}
    </div>
  );
}

function coverageMessage(
  isOnline: boolean,
  coverage: QuranSearchResponse['coverage'],
  searchStatus: QuranSearchResultsProps['searchStatus'],
  hasSurahs: boolean,
  hasAyahs: boolean
): string | null {
  if (isOnline) {
    if (searchStatus === 'loading') return 'Mencari ayat online...';
    if (searchStatus === 'error') return 'Pencarian ayat online belum tersedia.';
    if (coverage.mode === 'online' && coverage.isComplete) return null;
    return null;
  }
  if (hasSurahs && !hasAyahs) return 'Pencarian surat mencakup seluruh 114 Surah.';
  if (coverage.completeness === 'complete') return 'Seluruh Al-Quran tersedia untuk pencarian offline.';
  if (coverage.completeness === 'partial') return `Offline — pencarian ayat mencakup ${coverage.indexedSurahs} dari ${coverage.totalSurahs} Surah.`;
  return 'Pencarian ayat offline belum tersedia.';
}

export function QuranSearchResults({
  query,
  response,
  isSearching,
  onLoadMore,
  searchStatus,
  searchError,
  onRetrySearch,
  corpusStatus = 'idle',
  corpusError,
  onRetryCorpus,
}: QuranSearchResultsProps) {
  const isOnline = useOnlineStatus();
  const { coverage } = response;
  if (!query.trim()) return null;

  const hasSurahs = response.surahs.length > 0;
  const hasAyahs = response.ayahs.length > 0;
  const effectiveSearchStatus = searchStatus ?? corpusStatus;
  const effectiveSearchError = searchError ?? corpusError;
  const retry = onRetrySearch ?? onRetryCorpus;
  const message = coverageMessage(isOnline, coverage, effectiveSearchStatus, hasSurahs, hasAyahs);
  const showSearchError = isOnline && effectiveSearchStatus === 'error' && !hasSurahs && !hasAyahs;
  const showOfflineUnavailable = !isOnline && !hasAyahs && !hasSurahs && coverage.completeness === 'surah-only';
  const showSearchPreparing = isOnline && !hasAyahs && !hasSurahs && effectiveSearchStatus === 'loading';

  return (
    <section className="space-y-3" aria-live="polite" aria-labelledby="quran-search-results-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="quran-search-results-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Hasil pencarian
          </h2>
          {message && <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>}
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
      ) : showSearchError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200">{effectiveSearchError || 'Pencarian ayat online belum tersedia.'}</p>
          {retry && (
            <button type="button" onClick={retry} className="mt-3 rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-700 dark:text-amber-200">
              Coba lagi
            </button>
          )}
        </div>
      ) : showOfflineUnavailable ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center dark:border-surface-800 dark:bg-surface-900">
          <XCircle className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Pencarian ayat offline belum tersedia.</p>
        </div>
      ) : showSearchPreparing ? (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-6 text-center text-sm text-primary-800 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-200">
          Menyiapkan pencarian Al-Quran...
        </div>
      ) : !hasSurahs && !hasAyahs ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center dark:border-surface-800 dark:bg-surface-900">
          <XCircle className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {coverage.completeness === 'complete'
              ? `Tidak ditemukan hasil untuk “${query}”.`
              : `Tidak ditemukan dalam ${coverage.indexedSurahs} Surah yang tersedia.`}
          </p>
        </div>
      ) : (
        <>
          {hasSurahs && (
            <div className="space-y-2" aria-labelledby="quran-search-surah-heading">
              <h3 id="quran-search-surah-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">
                Surat
              </h3>
              {response.surahs.map((result) => (
                <SearchResultItem key={result.id} result={result} query={query} isOnline={isOnline} />
              ))}
            </div>
          )}
          {hasAyahs && (
            <div className="space-y-2" aria-labelledby="quran-search-ayah-heading">
              <h3 id="quran-search-ayah-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">
                Ayat
              </h3>
              {response.ayahs.map((result) => (
                <SearchResultItem key={result.id} result={result} query={query} isOnline={isOnline} />
              ))}
            </div>
          )}
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
