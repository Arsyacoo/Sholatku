'use client';

import React, { useState } from 'react';
import { Play, Pause, Bookmark, Check, Copy, Share2, BookOpen, Volume2 } from 'lucide-react';
import { Ayah } from '@/types';

interface AyahCardProps {
  ayah: Ayah;
  surahNumber: number;
  surahName: string;
  isPlaying: boolean;
  isLastRead: boolean;
  isHighlighted?: boolean;
  arabicFontSize: number;
  showTranslation: boolean;
  showLatin: boolean;
  onPlay: () => void;
  onBookmark: () => void;
  onOpenTafsir: () => void;
}

export const AyahCard: React.FC<AyahCardProps> = ({
  ayah,
  surahNumber,
  surahName,
  isPlaying,
  isLastRead,
  isHighlighted = false,
  arabicFontSize,
  showTranslation,
  showLatin,
  onPlay,
  onBookmark,
  onOpenTafsir,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${ayah.arabText}\n\n"${ayah.translation}"\n(QS. ${surahName}: ${ayah.numberInSurah})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: `QS. ${surahName} : Ayat ${ayah.numberInSurah}`,
      text: `${ayah.arabText}\n\n"${ayah.translation}"\n(QS. ${surahName}: ${ayah.numberInSurah}) - Baca di Sholatku`,
      url: typeof window !== 'undefined' ? `${window.location.origin}/quran/${surahNumber}#ayah-${ayah.numberInSurah}` : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Ignored if user dismissed share dialog
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      id={`ayah-${ayah.numberInSurah}`}
      className={`relative p-5 sm:p-6 rounded-2xl transition-all duration-300 scroll-mt-24 ${
        isHighlighted
          ? 'bg-primary-50 dark:bg-primary-950/60 border-2 border-primary-500 ring-4 ring-primary-500/20 shadow-md shadow-primary-500/10'
          : isPlaying
          ? 'bg-primary-50/90 dark:bg-primary-950/70 border-2 border-primary-500 shadow-md shadow-primary-500/10'
          : isLastRead
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-2 border-gold-400 dark:border-gold-700'
          : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 shadow-2xs'
      }`}
    >
      {/* Top Action Ribbon */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-surface-100 dark:border-surface-800/80">
        {/* Ayah number badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-surface-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs font-mono border border-surface-200 dark:border-surface-700">
            {ayah.numberInSurah}
          </div>
          {isLastRead && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-800 dark:bg-gold-950 dark:text-gold-300 px-2 py-0.5 rounded-full">
              Terakhir Dibaca
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Play Audio Button */}
          <button
            type="button"
            onClick={onPlay}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-surface-800'
            }`}
            title={isPlaying ? 'Jeda Audio' : 'Dengarkan Ayat'}
            aria-label={isPlaying ? 'Jeda Audio' : 'Dengarkan Ayat'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            )}
          </button>

          {/* Bookmark / Last Read */}
          <button
            type="button"
            onClick={onBookmark}
            className={`p-2 rounded-xl text-slate-500 hover:text-gold-500 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors ${
              isLastRead ? 'text-gold-500 dark:text-gold-400' : ''
            }`}
            title="Tandai Terakhir Dibaca"
            aria-label="Tandai Terakhir Dibaca"
          >
            <Bookmark className={`w-4 h-4 ${isLastRead ? 'fill-gold-400' : ''}`} />
          </button>

          {/* Tafsir */}
          <button
            type="button"
            onClick={onOpenTafsir}
            className="p-2 rounded-xl text-slate-500 hover:text-primary-600 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Buka Tafsir"
            aria-label="Buka Tafsir"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title={copied ? 'Tersalin!' : 'Salin Ayat'}
            aria-label="Salin Ayat"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Bagikan Ayat"
            aria-label="Bagikan Ayat"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Arabic Text */}
      <div className="py-2 text-right">
        <p
          className="font-arabic font-bold text-slate-900 dark:text-slate-50 leading-[2.2] tracking-wide select-text"
          style={{ fontSize: `${arabicFontSize}px` }}
          dir="rtl"
        >
          {ayah.arabText}
        </p>
      </div>

      {/* Transliteration Latin */}
      {showLatin && ayah.latinText && (
        <div className="pt-3 pb-1">
          <p className="text-xs sm:text-sm font-medium text-teal-800 dark:text-teal-300/90 leading-relaxed">
            {ayah.latinText}
          </p>
        </div>
      )}

      {/* Indonesian Translation (Kemenag) */}
      {showTranslation && ayah.translation && (
        <div className="pt-2 text-slate-700 dark:text-slate-300">
          <p className="text-xs sm:text-sm leading-relaxed">
            {ayah.translation}
          </p>
        </div>
      )}
    </div>
  );
};
