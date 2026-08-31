'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { LastReadCard } from '@/components/quran/LastReadCard';
import { SurahCard } from '@/components/quran/SurahCard';
import { SurahSearchFilter, QuranTab } from '@/components/quran/SurahSearchFilter';
import { JuzList } from '@/components/quran/JuzList';
import { BookmarkedAyahsList } from '@/components/quran/BookmarkedAyahsList';
import { SURAH_LIST, searchSurahs } from '@/lib/quran/surah-list';
import { getLastRead, getFavoriteSurahs, toggleFavoriteSurah } from '@/lib/storage/quran-preferences';
import {
  getBookmarkedAyahs,
  migrateLegacySurahCache,
  toggleBookmarkAyah,
  SavedAyah,
} from '@/lib/storage/quran-offline';
import { LastReadInfo } from '@/types';
import { BookOpen, HardDriveDownload } from 'lucide-react';
import { getCachedSurahCount } from '@/lib/storage/quran-offline';

export default function QuranPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<QuranTab>('surah');
  const [lastRead, setLastRead] = useState<LastReadInfo | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<SavedAyah[]>([]);
  const [cachedSurahCount, setCachedSurahCount] = useState(0);

  useEffect(() => {
    void migrateLegacySurahCache().catch(() => {
      // Migration is best-effort; the reader can still use legacy fallback data.
    });
  }, []);

  useEffect(() => {
    setLastRead(getLastRead());
    setFavorites(getFavoriteSurahs());
    setBookmarkedAyahs(getBookmarkedAyahs());
    void getCachedSurahCount().then(setCachedSurahCount);
  }, []);

  const handleToggleFavorite = (surahNumber: number) => {
    const updated = toggleFavoriteSurah(surahNumber);
    setFavorites(updated);
  };

  const handleRemoveBookmark = (ayah: SavedAyah) => {
    const { list } = toggleBookmarkAyah(ayah);
    setBookmarkedAyahs(list);
  };

  const filteredSurahs = useMemo(() => {
    const searched = searchSurahs(query);
    if (activeTab === 'favorites') {
      return searched.filter((s) => favorites.includes(s.number));
    }
    return searched;
  }, [query, activeTab, favorites]);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Last Read / Introduction */}
        <LastReadCard lastRead={lastRead} />

        <section className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50/70 p-4 dark:border-primary-900 dark:bg-primary-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HardDriveDownload className="mt-0.5 h-5 w-5 shrink-0 text-primary-700 dark:text-primary-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Quran Offline</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{cachedSurahCount} Surah tersimpan di perangkat</p>
            </div>
          </div>
          <Link
            href="/quran/offline"
            className="inline-flex items-center justify-center rounded-xl border border-primary-300 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-white dark:border-primary-800 dark:text-primary-300 dark:hover:bg-surface-900"
          >
            Kelola Offline
          </Link>
        </section>

        {/* Search & Tabs */}
        <SurahSearchFilter
          query={query}
          onQueryChange={setQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          surahCount={SURAH_LIST.length}
          favoriteCount={favorites.length}
          bookmarkCount={bookmarkedAyahs.length}
        />

        {/* Content Body */}
        {activeTab === 'juz' ? (
          <JuzList />
        ) : activeTab === 'bookmarks' ? (
          <BookmarkedAyahsList
            bookmarks={bookmarkedAyahs}
            onRemoveBookmark={handleRemoveBookmark}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-sm">
                  {activeTab === 'favorites'
                    ? 'Belum ada surat favorit yang ditandai.'
                    : `Tidak ditemukan surat dengan kata kunci "${query}".`}
                </p>
              </div>
            ) : (
              filteredSurahs.map((surah) => (
                <SurahCard
                  key={surah.number}
                  surah={surah}
                  isFavorite={favorites.includes(surah.number)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
