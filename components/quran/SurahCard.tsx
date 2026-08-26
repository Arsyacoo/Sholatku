'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { SurahInfo } from '@/types';

interface SurahCardProps {
  surah: SurahInfo;
  isFavorite?: boolean;
  onToggleFavorite?: (surahNumber: number) => void;
}

export const SurahCard: React.FC<SurahCardProps> = ({
  surah,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <div className="group relative flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-primary-500/5 overflow-hidden">
      {/* Clickable link area covering the main content */}
      <Link
        href={`/quran/${surah.number}`}
        className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 pr-10"
        aria-label={`Buka Surat ${surah.name}`}
      >
        {/* Number Badge */}
        <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800/90 text-slate-700 dark:text-slate-200 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/80 group-hover:text-primary-700 dark:group-hover:text-primary-300 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-surface-200/80 dark:border-surface-700 group-hover:border-primary-300 transition-colors">
          <span className="font-mono">{surah.number}</span>
        </div>

        {/* Latin Name, Revelation & Translation */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
              {surah.name}
            </h3>
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded shrink-0">
              {surah.revelation}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {surah.translation} &bull; {surah.numberOfAyahs} Ayat
          </p>
        </div>
      </Link>

      {/* Right Column: Arabic Calligraphy */}
      <Link
        href={`/quran/${surah.number}`}
        tabIndex={-1}
        className="shrink-0 pr-6"
      >
        <span className="font-arabic text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors select-none">
          {surah.arabicName}
        </span>
      </Link>

      {/* Star Favorite Button - Absolute Top Right with ample padding */}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(surah.number);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 text-slate-300 hover:text-gold-500 dark:text-slate-600 dark:hover:text-gold-400 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors z-10"
          aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          title={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-gold-400 text-gold-400' : ''}`} />
        </button>
      )}
    </div>
  );
};
