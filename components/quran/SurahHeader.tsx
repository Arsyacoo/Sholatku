'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BookOpen, Info, Sliders } from 'lucide-react';
import { SurahDetail } from '@/types';
import { Button } from '../ui/Button';
import { useLanguage } from '@/hooks/useLanguage';

interface SurahHeaderProps {
  surah: SurahDetail;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

export const SurahHeader: React.FC<SurahHeaderProps> = ({
  surah,
  onOpenSettings,
  onOpenInfo,
}) => {
  const { t, language } = useLanguage();
  const prevNumber = surah.number > 1 ? surah.number - 1 : null;
  const nextNumber = surah.number < 114 ? surah.number + 1 : null;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/quran"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-surface-50 dark:bg-surface-900 dark:text-slate-200 border border-surface-200 dark:border-surface-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('Daftar Surat', 'Surah list')}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Always shown: the info modal falls back to generic text when there is no description (English has none). */}
          <button
            onClick={onOpenInfo}
            className="p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-slate-600 dark:text-slate-300 hover:bg-surface-50 transition-colors shadow-2xs text-xs font-semibold flex items-center gap-1.5"
            title={t('Tentang Surat', 'About this surah')}
            aria-label={t('Tentang Surat', 'About this surah')}
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">{t('Tentang Surat', 'About this surah')}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-slate-600 dark:text-slate-300 hover:bg-surface-50 transition-colors shadow-2xs text-xs font-semibold flex items-center gap-1.5"
            title={t('Pengaturan Tampilan', 'Display settings')}
            aria-label={t('Pengaturan Tampilan', 'Display settings')}
          >
            <Sliders className="w-4 h-4 text-primary-600" />
            <span className="hidden sm:inline">{t('Tampilan', 'Display')}</span>
          </button>
        </div>
      </div>

      {/* Main Hero Card for Surah Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-teal-900 text-white p-6 sm:p-8 shadow-xl border border-primary-600/40 text-center">
        {/* Subtle geometric dot pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-teal-100 uppercase tracking-wider">
            <span>{t(`Surat ke-${surah.number}`, `Surah ${surah.number}`)}</span>
            <span>&bull;</span>
            <span>{t(surah.revelation, surah.revelation === 'Makkiyah' ? 'Meccan' : 'Medinan')}</span>
            <span>&bull;</span>
            <span>{surah.numberOfAyahs} {t('Ayat', 'Ayahs')}</span>
          </div>

          {/* Surah Names */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {surah.name}
          </h1>
          <span className="font-arabic text-3xl sm:text-4xl text-gold-300 select-none">
            {surah.arabicName}
          </span>
          <p className="text-sm text-teal-100/90 font-medium">
            {t('Arti', 'Meaning')}: &ldquo;{language === 'en' ? surah.translationEn ?? surah.translation : surah.translation}&rdquo;
          </p>

          {/* Prev / Next Surah Quick Navigator */}
          <div className="pt-3 flex items-center justify-center gap-3">
            {prevNumber ? (
              <Link
                href={`/quran/${prevNumber}`}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium backdrop-blur-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('Surat Sebelumnya', 'Previous surah')}</span>
              </Link>
            ) : null}

            {nextNumber ? (
              <Link
                href={`/quran/${nextNumber}`}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium backdrop-blur-sm"
              >
                <span>{t('Surat Berikutnya', 'Next surah')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Basmalah Banner (Except Surah At-Taubah = 9 and Al-Fatihah = 1 where it's ayah 1) */}
      {surah.number !== 9 && surah.number !== 1 && (
        <div className="text-center py-6 px-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xs space-y-1">
          <div className="font-arabic text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 select-none">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.')}
          </p>
        </div>
      )}
    </div>
  );
};
