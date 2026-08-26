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
    <div className="group relative flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-primary-500/5">
      {/* Clickable link area */}
      <Link
        href={`/quran/${surah.number}`}
        className="flex items-center gap-4 flex-1 pr-2"
        aria-label={`Buka Surat ${surah.name}`}
      >
        {/* Number Badge (Islamic Octagram / Diamond geometry) */}
        <div className="relative w-11 h-11 rounded-xl bg-surface-100 dark:bg-surface-800/90 text-slate-700 dark:text-slate-200 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/80 group-hover:text-primary-700 dark:group-hover:text-primary-300 flex items-center justify-center font-bold text-sm shrink-0 border border-surface-200 dark:border-surface-700 group-hover:border-primary-300 transition-colors">
          <span className="font-mono">{surah.number}</span>
        </div>

        {/* Latin Name & Meaning */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {surah.name}
            </h3>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">
              {surah.revelation}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {surah.translation} &bull; {surah.numberOfAyahs} Ayat
          </p>
        </div>
      </Link>

      {/* Right Column: Arabic Calligraphy & Favorite Action */}
      <div className="flex items-center gap-3">
        <Link href={`/quran/${surah.number}`} tabIndex={-1}>
          <span className="font-arabic text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors select-none">
            {surah.arabicName}
          </span>
        </Link>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(surah.number);
            }}
            className="p-2 text-slate-300 hover:text-gold-500 dark:text-slate-600 dark:hover:text-gold-400 rounded-lg transition-colors"
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-gold-400 text-gold-400' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
