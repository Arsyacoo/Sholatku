'use client';

import React, { useState, useEffect, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { SurahHeader } from '@/components/quran/SurahHeader';
import { AyahCard } from '@/components/quran/AyahCard';
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
import { SurahDetail, Ayah, QuranDisplaySettings, LastReadInfo } from '@/types';
import { BookOpen, Check } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SurahDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const surahId = parseInt(resolvedParams.id, 10);

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Settings & Last Read
  const [settings, setSettings] = useState<QuranDisplaySettings>(getQuranSettings);
  const [lastRead, setLastRead] = useState<LastReadInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [selectedTafsirAyah, setSelectedTafsirAyah] = useState<Ayah | null>(null);

  // Load Quran Settings & Last Read on mount
  useEffect(() => {
    setSettings(getQuranSettings());
    setLastRead(getLastRead());
  }, []);

  // Fetch Surah Details
  useEffect(() => {
    let active = true;
    const fetchSurah = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quran/surah/${surahId}`);
        if (res.ok) {
          const json = await res.json();
          if (active && json.data) {
            setSurah(json.data);
          }
        } else {
          if (active) setError('Gagal memuat surat. Periksa koneksi internet Anda.');
        }
      } catch (err: any) {
        if (active) setError('Terjadi kendala saat memuat data surat.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchSurah();
    return () => {
      active = false;
    };
  }, [surahId]);

  // Quran Audio Hook
  const audio = useQuranAudio(surah, settings.autoScrollAudio);

  // Sync selected qari with settings
  useEffect(() => {
    if (settings.selectedQari) {
      audio.setSelectedQari(settings.selectedQari);
    }
  }, [settings.selectedQari]);

  const handleUpdateSettings = (newSettings: QuranDisplaySettings) => {
    setSettings(newSettings);
    saveQuranSettings(newSettings);
  };

  const handleBookmarkAyah = (ayah: Ayah) => {
    if (!surah) return;
    const info: LastReadInfo = {
      surahNumber: surah.number,
      surahName: surah.name,
      ayahNumber: ayah.numberInSurah,
      timestamp: Date.now(),
    };
    saveLastRead(info);
    setLastRead(info);
    showToast(`Ayat ${ayah.numberInSurah} ditandai sebagai bacaan terakhir`);
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

            {/* List of Ayahs */}
            <div className="space-y-3 pt-2">
              {surah.ayahs.map((ayah, index) => {
                const isPlaying = audio.currentAyahIndex === index && audio.isPlaying;
                const isLastReadAyah =
                  lastRead?.surahNumber === surah.number &&
                  lastRead?.ayahNumber === ayah.numberInSurah;

                return (
                  <AyahCard
                    key={ayah.numberInSurah}
                    ayah={ayah}
                    surahNumber={surah.number}
                    surahName={surah.name}
                    isPlaying={isPlaying}
                    isLastRead={isLastReadAyah}
                    arabicFontSize={settings.arabicFontSize}
                    showTranslation={settings.showTranslation}
                    showLatin={settings.showLatin}
                    onPlay={() => {
                      if (audio.currentAyahIndex === index && audio.isPlaying) {
                        audio.togglePlay();
                      } else {
                        audio.playAyah(index);
                      }
                    }}
                    onBookmark={() => handleBookmarkAyah(ayah)}
                    onOpenTafsir={() => setSelectedTafsirAyah(ayah)}
                  />
                );
              })}
            </div>

            {/* Floating Audio Player (when audio is active) */}
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
                onTogglePlay={audio.togglePlay}
                onPlayNext={audio.playNext}
                onPlayPrev={audio.playPrev}
                onCycleRepeat={audio.cycleRepeatMode}
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
