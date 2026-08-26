'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Ayah, SurahDetail } from '@/types';

export type RepeatMode = 'none' | 'ayah' | 'surah';

export interface QariOption {
  id: string;
  name: string;
  subname: string;
}

export const QARI_OPTIONS: QariOption[] = [
  { id: '05', name: 'Misyari Rasyid Al-Afasy', subname: 'Makkah / Kuwait' },
  { id: '01', name: 'Abdullah Al-Juhany', subname: 'Imam Masjidil Haram' },
  { id: '02', name: 'Abdul Muhsin Al-Qasim', subname: 'Imam Masjid Nabawi' },
  { id: '04', name: 'Mahmoud Khalil Al-Husary', subname: 'Mesir (Tartil)' },
];

export function useQuranAudio(surah: SurahDetail | null, autoScroll: boolean = true) {
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [selectedQari, setSelectedQari] = useState<string>('05');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime);
        setDuration(audio.duration);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Play a specific ayah
  const playAyah = useCallback(
    (index: number) => {
      if (!surah || !surah.ayahs[index] || !audioRef.current) return;

      const ayah = surah.ayahs[index];
      const audioUrl =
        ayah.audio?.[selectedQari] ||
        ayah.audio?.['05'] ||
        ayah.audio?.['01'] ||
        `https://equran.nos.wjv-1.neo.id/audio-partial/Misyari-Rasyid-Al-Afasi/${String(
          surah.number
        ).padStart(3, '0')}${String(ayah.numberInSurah).padStart(3, '0')}.mp3`;

      setCurrentAyahIndex(index);
      setIsLoading(true);

      const audio = audioRef.current;
      audio.src = audioUrl;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);

          // Update MediaSession
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: `Surat ${surah.name} : Ayat ${ayah.numberInSurah}`,
              artist: QARI_OPTIONS.find((q) => q.id === selectedQari)?.name || 'Murottal Al-Qur\'an',
              album: `Juz ${ayah.juz || 1} • Sholatku`,
            });
          }

          // Auto-scroll to ayah element
          if (autoScroll && typeof document !== 'undefined') {
            const el = document.getElementById(`ayah-${ayah.numberInSurah}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
          setIsPlaying(false);
          setIsLoading(false);
        });
    },
    [surah, selectedQari, autoScroll]
  );

  // Play next ayah or repeat
  const playNext = useCallback(() => {
    if (!surah || currentAyahIndex === null) return;
    if (currentAyahIndex < surah.ayahs.length - 1) {
      playAyah(currentAyahIndex + 1);
    } else {
      // Reached end of surah
      if (repeatMode === 'surah') {
        playAyah(0);
      } else {
        setIsPlaying(false);
        setCurrentAyahIndex(null);
      }
    }
  }, [surah, currentAyahIndex, playAyah, repeatMode]);

  // Play previous ayah
  const playPrev = useCallback(() => {
    if (!surah || currentAyahIndex === null) return;
    if (currentAyahIndex > 0) {
      playAyah(currentAyahIndex - 1);
    } else {
      playAyah(0);
    }
  }, [surah, currentAyahIndex, playAyah]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentAyahIndex === null) {
        playAyah(0);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  }, [isPlaying, currentAyahIndex, playAyah]);

  // Stop playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentAyahIndex(null);
    setProgress(0);
  }, []);

  // Handle audio end event
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === 'ayah' && currentAyahIndex !== null) {
        playAyah(currentAyahIndex);
      } else {
        playNext();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, currentAyahIndex, playAyah, playNext]);

  // Cycle repeat modes
  const cycleRepeatMode = () => {
    if (repeatMode === 'none') setRepeatMode('ayah');
    else if (repeatMode === 'ayah') setRepeatMode('surah');
    else setRepeatMode('none');
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setProgress(seconds);
    }
  };

  const activeAyah =
    surah && currentAyahIndex !== null ? surah.ayahs[currentAyahIndex] : null;

  return {
    currentAyahIndex,
    activeAyah,
    isPlaying,
    isLoading,
    progress,
    duration,
    repeatMode,
    selectedQari,
    setSelectedQari,
    playAyah,
    playNext,
    playPrev,
    togglePlay,
    stopAudio,
    cycleRepeatMode,
    seek,
  };
}
