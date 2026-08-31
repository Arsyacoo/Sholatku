'use client';

import React, { useState, useEffect, useMemo, useCallback, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { SurahHeader } from '@/components/quran/SurahHeader';
import { AyahCard } from '@/components/quran/AyahCard';
import { AyahSearchJump } from '@/components/quran/AyahSearchJump';
import { AyahPagination } from '@/components/quran/AyahPagination';
import { FloatingAudioPlayer } from '@/components/quran/FloatingAudioPlayer';
import { QuranSettingsModal } from '@/components/quran/QuranSettingsModal';
import { TafsirModal } from '@/components/quran/TafsirModal';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useQuranAudio } from '@/hooks/useQuranAudio';
import {
  getQuranSettings,
  saveQuranSettings,
  getLastRead,
  saveLastRead,
} from '@/lib/storage/quran-preferences';
import {
  saveCachedSurah,
  getCachedSurah,
  migrateLegacySurahCache,
  toggleBookmarkAyah,
  getBookmarkedAyahs,
  SavedAyah,
} from '@/lib/storage/quran-offline';
import { SurahDetail, Ayah, QuranDisplaySettings, LastReadInfo } from '@/types';
import { BookOpen, Check, WifiOff } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SurahDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const surahId = parseInt(resolvedParams.id, 10);

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineSource, setIsOfflineSource] = useState<boolean>(false);

  // Pagination & In-surah Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Settings, Last Read, Bookmarked Ayahs
  const [settings, setSettings] = useState<QuranDisplaySettings>(getQuranSettings);
  const [lastRead, setLastRead] = useState<LastReadInfo | null>(null);
  const [bookmarkedList, setBookmarkedList] = useState<SavedAyah[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [selectedTafsirAyah, setSelectedTafsirAyah] = useState<Ayah | null>(null);

  // Load Quran Settings & Bookmarks on mount
  useEffect(() => {
    setSettings(getQuranSettings());
    setLastRead(getLastRead());
    setBookmarkedList(getBookmarkedAyahs());
  }, []);

  // Fetch Surah Details with Offline Cache fallback
  useEffect(() => {
    let active = true;

    // Reset route-local state so a previous surah cannot flash while the new
    // IndexedDB read is in flight.
    setSurah(null);
    setIsLoading(true);
    setError(null);
    setIsOfflineSource(false);
    const abortController = new AbortController();

    const fetchSurah = async () => {
      // Migration is lazy and idempotent. It is intentionally best-effort;
      // getCachedSurah still reads a legacy entry if IndexedDB is unavailable.
      await migrateLegacySurahCache(surahId);
      if (!active) return;

      const cached = await getCachedSurah(surahId);
      if (!active) return;

      if (cached) {
        setSurah(cached);
        setIsLoading(false);
        setIsOfflineSource(true);
      }

      try {
        const res = await fetch(`/api/quran/surah/${surahId}`, {
          signal: abortController.signal,
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.ayahs && json.data.ayahs.length > 0) {
            // Cache writes are non-blocking for rendering and are safe if the
            // browser denies IndexedDB access.
            void saveCachedSurah(json.data);
          }
          if (active && json.data && json.data.ayahs && json.data.ayahs.length > 0) {
            setSurah(json.data);
            setIsOfflineSource(false);
          } else if (!cached && active) {
            setError('Gagal memuat surat. Data surat tidak tersedia.');
          }
        } else {
          if (!cached && active) {
            setError('Gagal memuat surat. Periksa koneksi internet Anda.');
          }
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          return;
        }
        if (!cached && active) {
          setError('Terjadi kendala saat memuat data surat.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchSurah();
    return () => {
      active = false;
      abortController.abort();
    };
  }, [surahId]);

  const handleUpdateSettings = useCallback((newSettings: QuranDisplaySettings) => {
    setSettings(newSettings);
    saveQuranSettings(newSettings);
  }, []);

  const handleAudioPreferenceChange = useCallback(
    (partial: Partial<QuranDisplaySettings>) => {
      setSettings((current) => {
        const next = { ...current, ...partial };
        saveQuranSettings(next);
        return next;
      });
    },
    []
  );

  // Quran Audio Hook
  const audio = useQuranAudio(surah, {
    autoScroll: settings.autoScrollAudio,
    selectedQari: settings.selectedQari,
    audioVolume: settings.audioVolume,
    audioMuted: settings.audioMuted,
    playbackRate: settings.playbackRate,
    onPreferenceChange: handleAudioPreferenceChange,
  });

  // Filter ayahs by in-surah search query
  const filteredAyahs = useMemo(() => {
    if (!surah) return [];
    if (!searchQuery.trim()) return surah.ayahs;

    const q = searchQuery.toLowerCase().trim();
    return surah.ayahs.filter((a) => {
      return (
        a.translation.toLowerCase().includes(q) ||
        a.latinText.toLowerCase().includes(q) ||
        a.arabText.includes(q) ||
        String(a.numberInSurah) === q
      );
    });
  }, [surah, searchQuery]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredAyahs.length / pageSize));

  // Current slice of ayahs to render
  const paginatedAyahs = useMemo(() => {
    if (pageSize >= 999) return filteredAyahs;
    const start = (currentPage - 1) * pageSize;
    return filteredAyahs.slice(start, start + pageSize);
  }, [filteredAyahs, currentPage, pageSize]);

  // Handle jump to a specific ayah
  const handleJumpToAyah = (ayahNumber: number) => {
    if (!surah) return;
    const targetIndex = surah.ayahs.findIndex((a) => a.numberInSurah === ayahNumber);
    if (targetIndex >= 0) {
      // Calculate which page contains this ayah
      const targetPage = Math.floor(targetIndex / pageSize) + 1;
      setCurrentPage(targetPage);
      setSearchQuery('');

      setTimeout(() => {
        const el = document.getElementById(`ayah-${ayahNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Toggle individual ayah bookmark
  const handleBookmarkAyah = (ayah: Ayah) => {
    if (!surah) return;
    const saved: SavedAyah = {
      surahNumber: surah.number,
      surahName: surah.name,
      ayahNumber: ayah.numberInSurah,
      arabText: ayah.arabText,
      translation: ayah.translation,
      timestamp: Date.now(),
    };

    const { isBookmarked, list } = toggleBookmarkAyah(saved);
    setBookmarkedList(list);

    // Also update last read
    const lastReadInfo: LastReadInfo = {
      surahNumber: surah.number,
      surahName: surah.name,
      ayahNumber: ayah.numberInSurah,
      timestamp: Date.now(),
    };
    saveLastRead(lastReadInfo);
    setLastRead(lastReadInfo);

    showToast(
      isBookmarked
        ? `Ayat ${ayah.numberInSurah} disimpan ke koleksi ayat`
        : `Ayat ${ayah.numberInSurah} dihapus dari koleksi`
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 animate-fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Offline Cache Indicator */}
        {isOfflineSource && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Offline: Membaca dari penyimpanan lokal perangkat.</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="w-full h-56 rounded-3xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-full h-32 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : error || !surah ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {error || 'Surat tidak ditemukan'}
            </h2>
          </div>
        ) : (
          <>
            {/* Surah Header & Basmalah */}
            <SurahHeader
              surah={surah}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenInfo={() => setIsInfoOpen(true)}
            />

            {/* In-Surah Search & Jump Bar */}
            <AyahSearchJump
              query={searchQuery}
              onQueryChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              totalAyahs={surah.numberOfAyahs}
              onJumpToAyah={handleJumpToAyah}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              matchCount={filteredAyahs.length}
            />

            {/* Top Pagination Bar */}
            <AyahPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalAyahs={filteredAyahs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />

            {/* List of Paginated Ayahs */}
            <div className="space-y-3 pt-1">
              {paginatedAyahs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Tidak ditemukan ayat dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                paginatedAyahs.map((ayah) => {
                  const originalIndex = surah.ayahs.findIndex(
                    (a) => a.numberInSurah === ayah.numberInSurah
                  );
                  const isPlaying =
                    audio.currentAyahIndex === originalIndex && audio.isPlaying;
                  const isLastReadAyah =
                    lastRead?.surahNumber === surah.number &&
                    lastRead?.ayahNumber === ayah.numberInSurah;
                  const isBookmarked = bookmarkedList.some(
                    (b) =>
                      b.surahNumber === surah.number &&
                      b.ayahNumber === ayah.numberInSurah
                  );

                  return (
                    <AyahCard
                      key={ayah.numberInSurah}
                      ayah={ayah}
                      surahNumber={surah.number}
                      surahName={surah.name}
                      isPlaying={isPlaying}
                      isLastRead={isLastReadAyah || isBookmarked}
                      arabicFontSize={settings.arabicFontSize}
                      showTranslation={settings.showTranslation}
                      showLatin={settings.showLatin}
                      onPlay={() => {
                        if (audio.currentAyahIndex === originalIndex && audio.isPlaying) {
                          audio.togglePlay();
                        } else {
                          audio.playAyah(originalIndex);
                        }
                      }}
                      onBookmark={() => handleBookmarkAyah(ayah)}
                      onOpenTafsir={() => setSelectedTafsirAyah(ayah)}
                    />
                  );
                })
              )}
            </div>

            {/* Bottom Pagination Bar */}
            <AyahPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalAyahs={filteredAyahs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />

            {/* Floating Audio Player */}
            {audio.currentAyahIndex !== null && (
              <FloatingAudioPlayer
                surahName={surah.name}
                currentAyahNumber={
                  surah.ayahs[audio.currentAyahIndex]?.numberInSurah || 1
                }
                totalAyahs={surah.numberOfAyahs}
                isPlaying={audio.isPlaying}
                isLoading={audio.isLoading}
                progress={audio.progress}
                duration={audio.duration}
                repeatMode={audio.repeatMode}
                volume={audio.volume}
                isMuted={audio.isMuted}
                playbackRate={audio.playbackRate}
                onTogglePlay={audio.togglePlay}
                onPlayNext={audio.playNext}
                onPlayPrev={audio.playPrev}
                onCycleRepeat={audio.cycleRepeatMode}
                onVolumeChange={audio.setVolume}
                onToggleMute={audio.toggleMute}
                onPlaybackRateChange={audio.setPlaybackRate}
                onClose={audio.stopAudio}
              />
            )}
          </>
        )}
      </main>

      <Footer />
      <BottomNav />

      {/* Settings Modal */}
      <QuranSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onChange={handleUpdateSettings}
      />

      {/* Tafsir Modal */}
      <TafsirModal
        isOpen={Boolean(selectedTafsirAyah)}
        onClose={() => setSelectedTafsirAyah(null)}
        ayah={selectedTafsirAyah}
        surahName={surah?.name || ''}
      />

      {/* Surah Description Info Modal */}
      {surah && (
        <Modal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          title={`Tentang Surat ${surah.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-between text-xs font-semibold">
              <span>Golongan: {surah.revelation}</span>
              <span>Jumlah: {surah.numberOfAyahs} Ayat</span>
            </div>
            <p>{surah.description || 'Surat ini diturunkan oleh Allah SWT sebagai petunjuk bagi seluruh umat manusia.'}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
