'use client';

import React from 'react';
import { Clock, Sparkles, Moon, Sun, ArrowRight } from 'lucide-react';
import { NextPrayerInfo } from '@/types';
import { CountdownTimer } from './CountdownTimer';
import { Skeleton } from '../ui/Skeleton';

interface NextPrayerHeroProps {
  prayerInfo: NextPrayerInfo | null;
  isLoading?: boolean;
}

export const NextPrayerHero: React.FC<NextPrayerHeroProps> = ({ prayerInfo, isLoading = false }) => {
  if (isLoading || !prayerInfo) {
    return (
      <div className="w-full h-56 rounded-3xl bg-surface-200 dark:bg-surface-800 animate-pulse" />
    );
  }

  const { currentPrayer, nextPrayer, formattedCountdown, remainingSeconds, isTomorrowFajr, progressPercent } =
    prayerInfo;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-teal-900 text-white p-6 sm:p-8 shadow-xl shadow-primary-950/20 border border-primary-600/40">
      {/* Subtle geometric background pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative ambient glow */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-gold-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-primary-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left column: Prayer identity & time */}
        <div className="space-y-3">
          {/* Status Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-teal-100 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
            <span>
              {isTomorrowFajr
                ? 'Sholat Subuh Esok Hari'
                : `Menuju Waktu Sholat ${nextPrayer.name}`}
            </span>
          </div>

          {/* Main Title & Arabic */}
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {nextPrayer.name}
            </h1>
            <span className="font-arabic text-2xl sm:text-3xl text-gold-200/90 select-none">
              {nextPrayer.arabicName}
            </span>
          </div>

          {/* Schedule details */}
          <div className="flex items-center gap-2 text-sm text-teal-100/90 font-medium">
            <Clock className="w-4 h-4 text-gold-300" />
            <span>
              Masuk pukul <strong className="text-white text-base">{nextPrayer.time}</strong>
            </span>
            {currentPrayer && (
              <>
                <span className="text-white/40">&bull;</span>
                <span className="text-teal-200/80 text-xs">
                  Sebelumnya: {currentPrayer.name} ({currentPrayer.time})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right column: Countdown timer block */}
        <div className="flex flex-col items-start md:items-end gap-2 bg-black/15 dark:bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-sm self-stretch md:self-auto">
          <span className="text-xs font-medium uppercase tracking-wider text-teal-100/80">
            Hitung Mundur Adzan
          </span>
          <CountdownTimer
            countdownStr={formattedCountdown}
            remainingSeconds={remainingSeconds}
          />
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-teal-100/80 mb-1.5 font-medium">
          <span>Perjalanan Waktu</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-300 to-gold-300 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
