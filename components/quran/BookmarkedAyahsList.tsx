'use client';

import React from 'react';
import Link from 'next/link';
import { SavedAyah } from '@/lib/storage/quran-offline';
import { Bookmark, ArrowRight, Trash2 } from 'lucide-react';

interface BookmarkedAyahsListProps {
  bookmarks: SavedAyah[];
  onRemoveBookmark: (ayah: SavedAyah) => void;
}

export const BookmarkedAyahsList: React.FC<BookmarkedAyahsListProps> = ({
  bookmarks,
  onRemoveBookmark,
}) => {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6">
        <Bookmark className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Belum Ada Ayat yang Disimpan
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Saat membaca surat, ketuk ikon penanda (*Bookmark*) pada ayat mana pun untuk menyimpannya ke daftar koleksi pribadi Anda di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Koleksi Ayat Tersimpan ({bookmarks.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bookmarks.map((b) => (
          <div
            key={`${b.surahNumber}-${b.ayahNumber}`}
            className="group relative p-4 sm:p-5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-2xl transition-all shadow-2xs space-y-3"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center font-mono">
                  {b.ayahNumber}
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  QS. {b.surahName} : {b.ayahNumber}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onRemoveBookmark(b)}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                title="Hapus dari simpanan"
                aria-label="Hapus dari simpanan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Arabic snippet */}
            <p className="font-arabic text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 text-right leading-loose" dir="rtl">
              {b.arabText}
            </p>

            {/* Translation snippet */}
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
              &ldquo;{b.translation}&rdquo;
            </p>

            {/* Action link */}
            <div className="pt-2 border-t border-surface-100 dark:border-surface-800 flex justify-end">
              <Link
                href={`/quran/${b.surahNumber}#ayah-${b.ayahNumber}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                <span>Buka Ayat di Surat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
