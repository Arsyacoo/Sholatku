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
  Volume1,
  VolumeX,
  Loader2,
  Gauge,
} from 'lucide-react';
import { RepeatMode } from '@/hooks/useQuranAudio';
import { QuranPlaybackRate, QURAN_PLAYBACK_RATES } from '@/types';
import { Select } from '../ui/Select';

interface FloatingAudioPlayerProps {
  surahName: string;
  currentAyahNumber: number;
  totalAyahs: number;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  playbackRate: QuranPlaybackRate;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onCycleRepeat: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: QuranPlaybackRate) => void;
  onClose: () => void;
}

const PLAYBACK_RATE_OPTIONS = QURAN_PLAYBACK_RATES.map((rate) => ({
  value: rate,
  label: `${String(rate).replace('.', ',')}×`,
}));

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  surahName,
  currentAyahNumber,
  totalAyahs,
  isPlaying,
  isLoading,
  progress,
  duration,
  repeatMode,
  volume,
  isMuted,
  playbackRate,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onCycleRepeat,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onClose,
}) => {
  const formatSec = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

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
        <div
          className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Progres audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
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

        {/* Persistent audio preferences */}
        <div className="flex items-center gap-2.5 pt-2.5 border-t border-white/10">
          <button
            type="button"
            onClick={onToggleMute}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
              isMuted
                ? 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                : 'bg-primary-500/20 text-primary-200 hover:bg-primary-500/30'
            }`}
            aria-label={isMuted ? 'Aktifkan suara' : 'Bisukan audio'}
            aria-pressed={isMuted}
            title={isMuted ? 'Aktifkan suara' : 'Bisukan audio'}
          >
            <VolumeIcon className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <label htmlFor="quran-player-volume" className="sr-only">
              Volume audio
            </label>
            <input
              id="quran-player-volume"
              type="range"
              min="0"
              max="100"
              step="1"
              value={volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              className="w-full min-w-20 h-1.5 rounded-full cursor-pointer accent-primary-400 bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              aria-valuetext={
                isMuted ? `Bisu, volume tersimpan ${volume} persen` : `${volume} persen`
              }
            />
            <span className="hidden sm:block w-10 text-right text-[10px] font-semibold tabular-nums text-slate-300">
              {isMuted ? 'Bisu' : `${volume}%`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Gauge className="hidden sm:block w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <label htmlFor="quran-player-speed" className="sr-only">
              Kecepatan audio
            </label>
            <Select
              id="quran-player-speed"
              value={playbackRate}
              options={PLAYBACK_RATE_OPTIONS}
              onValueChange={onPlaybackRateChange}
              ariaLabel={`Kecepatan audio ${String(playbackRate).replace('.', ',')} kali`}
              tone="dark"
              size="sm"
              className="w-[76px]"
              menuClassName="min-w-[160px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
