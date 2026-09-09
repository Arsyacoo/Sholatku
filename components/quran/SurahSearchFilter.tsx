'use client';

import React from 'react';
import { Search, X, BookOpen, Layers, Star, Bookmark } from 'lucide-react';

export type QuranTab = 'surah' | 'juz' | 'favorites' | 'bookmarks';

interface SurahSearchFilterProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeTab: QuranTab;
  onTabChange: (tab: QuranTab) => void;
  surahCount: number;
  favoriteCount: number;
  bookmarkCount: number;
}

export const SurahSearchFilter: React.FC<SurahSearchFilterProps> = ({
  query,
  onQueryChange,
  activeTab,
  onTabChange,
  surahCount,
  favoriteCount,
  bookmarkCount = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari ayat, surat, atau terjemahan..."
            aria-label="Cari ayat, surat, atau terjemahan Al-Qur'an"
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            aria-label="Bersihkan pencarian Quran"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 items-stretch gap-1.5 p-1 bg-surface-100 dark:bg-surface-800/80 rounded-xl border border-surface-200/60 dark:border-surface-700/60 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onTabChange('surah')}
          aria-label={`Semua Surat (${surahCount})`}
          className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
            activeTab === 'surah'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center justify-center gap-1 whitespace-nowrap text-[11px] leading-4">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>Semua</span>
          </span>
          <span className="text-[10px] font-medium leading-3 text-slate-500 dark:text-slate-400">{surahCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('juz')}
          aria-label="30 Juz"
          className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
            activeTab === 'juz'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center justify-center gap-1 whitespace-nowrap text-[11px] leading-4">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>Juz</span>
          </span>
          <span className="text-[10px] font-medium leading-3 text-slate-500 dark:text-slate-400">30</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('favorites')}
          aria-label={`Surat Favorit (${favoriteCount})`}
          className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
            activeTab === 'favorites'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center justify-center gap-1 whitespace-nowrap text-[11px] leading-4">
            <Star className="h-3.5 w-3.5 shrink-0" />
            <span>Favorit</span>
          </span>
          <span className="text-[10px] font-medium leading-3 text-slate-500 dark:text-slate-400">{favoriteCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('bookmarks')}
          aria-label={`Ayat Disimpan (${bookmarkCount})`}
          className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
            activeTab === 'bookmarks'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center justify-center gap-1 whitespace-nowrap text-[11px] leading-4">
            <Bookmark className="h-3.5 w-3.5 shrink-0" />
            <span>Simpan</span>
          </span>
          <span className="text-[10px] font-medium leading-3 text-slate-500 dark:text-slate-400">{bookmarkCount}</span>
        </button>
      </div>
    </div>
  );
};
