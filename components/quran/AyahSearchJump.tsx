'use client';

import React, { useState } from 'react';
import { Search, X, Hash, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface AyahSearchJumpProps {
  query: string;
  onQueryChange: (q: string) => void;
  totalAyahs: number;
  onJumpToAyah: (ayahNumber: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  matchCount?: number;
}

export const AyahSearchJump: React.FC<AyahSearchJumpProps> = ({
  query,
  onQueryChange,
  totalAyahs,
  onJumpToAyah,
  pageSize,
  onPageSizeChange,
  matchCount,
}) => {
  const [jumpInput, setJumpInput] = useState('');

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalAyahs) {
      onJumpToAyah(num);
      setJumpInput('');
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl space-y-3 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input in surah */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari terjemahan surat ini..."
            className="w-full pl-10 pr-9 py-2 bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Jump to Ayah Form */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="1"
              max={totalAyahs}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={`Ayat 1-${totalAyahs}`}
              className="w-28 pl-8 pr-2 py-2 bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={!jumpInput}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Lompat</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Filter and Page Size Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-100 dark:border-surface-800 text-xs">
        <div>
          {query ? (
            <span className="text-primary-700 dark:text-primary-300 font-semibold">
              Ditemukan {matchCount || 0} ayat yang cocok
            </span>
          ) : (
            <span className="text-slate-500">
              Menampilkan {totalAyahs} ayat
            </span>
          )}
        </div>

        {/* Page size picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Ayat per Halaman:</span>
          {[
            { size: 10, label: '10' },
            { size: 20, label: '20' },
            { size: 50, label: '50' },
            { size: 999, label: 'Semua' },
          ].map(({ size, label }) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSizeChange(size)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                pageSize === size
                  ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                  : 'bg-surface-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300 hover:bg-surface-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
