'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  X,
  Volume2,
  Loader2,
} from 'lucide-react';
import { RepeatMode } from '@/hooks/useQuranAudio';

interface FloatingAudioPlayerProps {
  surahName: string;
  currentAyahNumber: number;
  totalAyahs: number;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onCycleRepeat: () => void;
  onClose: () => void;
}

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  surahName,
  currentAyahNumber,
  totalAyahs,
  isPlaying,
  isLoading,
  progress,
  duration,
  repeatMode,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onCycleRepeat,
  onClose,
}) => {
  const formatSec = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 md:bottom-6 left-0 right-0 z-40 px-4 max-w-2xl mx-auto pointer-events-none animate-slide-up">
      <div className="bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-4 shadow-2xl border border-white/15 pointer-events-auto flex flex-col gap-2.5">
        {/* Top Info row */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary-600/80 text-white flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="truncate">
              <span className="font-bold text-white block truncate">
                QS. {surahName}
              </span>
              <span className="text-[11px] text-teal-200">
                Ayat {currentAyahNumber} dari {totalAyahs}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Repeat Mode Badge */}
            <button
              type="button"
              onClick={onCycleRepeat}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                repeatMode !== 'none'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
              title={`Mode Ulang: ${
                repeatMode === 'ayah'
                  ? 'Ulang Ayat Ini'
                  : repeatMode === 'surah'
                  ? 'Ulang Satu Surat'
                  : 'Tanpa Pengulangan'
              }`}
            >
              {repeatMode === 'ayah' ? (
                <Repeat1 className="w-3.5 h-3.5" />
              ) : (
                <Repeat className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Tutup Pemutar Audio"
              aria-label="Tutup Pemutar Audio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-400 to-teal-300 h-full rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[10px] text-slate-400 w-10">
            {formatSec(progress)}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPlayPrev}
              disabled={currentAyahNumber <= 1}
              className="p-2 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
              title="Ayat Sebelumnya"
              aria-label="Ayat Sebelumnya"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-400 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              title={isPlaying ? 'Jeda' : 'Putar'}
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onPlayNext}
              disabled={currentAyahNumber >= totalAyahs}
              className="p-2 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
              title="Ayat Berikutnya"
              aria-label="Ayat Berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <span className="font-mono text-[10px] text-slate-400 w-10 text-right">
            {formatSec(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
