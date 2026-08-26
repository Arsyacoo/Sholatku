'use client';

import React from 'react';
import { Search, X, BookOpen, Layers, Star } from 'lucide-react';

export type QuranTab = 'surah' | 'juz' | 'favorites';

interface SurahSearchFilterProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeTab: QuranTab;
  onTabChange: (tab: QuranTab) => void;
  surahCount: number;
  favoriteCount: number;
}

export const SurahSearchFilter: React.FC<SurahSearchFilterProps> = ({
  query,
  onQueryChange,
  activeTab,
  onTabChange,
  surahCount,
  favoriteCount,
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
          placeholder="Cari surat (misal: Yasin, Al-Kahf, 18, Gua)..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-100 dark:bg-surface-800/80 rounded-xl border border-surface-200/60 dark:border-surface-700/60 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onTabChange('surah')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'surah'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Semua Surat ({surahCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('juz')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'juz'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>30 Juz</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('favorites')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            activeTab === 'favorites'
              ? 'bg-white dark:bg-surface-900 text-primary-700 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Favorit ({favoriteCount})</span>
        </button>
      </div>
    </div>
  );
};
