'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock3, MoonStar, Sunrise, Sunset } from 'lucide-react';
import type { RamadanContext, RamadanStatus, RamadanTiming } from '@/types';

interface RamadanHomeCardProps {
  status: RamadanStatus;
  timing: RamadanTiming;
  context: RamadanContext;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export const RamadanHomeCard: React.FC<RamadanHomeCardProps> = ({ status, timing, context }) => {
  const heading =
    context.state === 'PRE_FAJR'
      ? context.target === 'imsak'
        ? 'Sisa waktu menuju Imsak'
        : 'Sisa waktu menuju Subuh'
      : context.state === 'DAYTIME_FASTING' || context.state === 'PRE_IFTAR'
      ? 'Berbuka dalam'
      : 'Imsak berikutnya';
  const sourceCopy = status.source === 'automatic' ? 'berdasarkan kalender Hijriah' : 'diaktifkan manual';

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-primary-200/80 bg-gradient-to-br from-primary-800 via-primary-700 to-teal-900 p-5 text-white shadow-lg shadow-primary-950/15 sm:p-7"
      aria-labelledby="ramadan-home-title"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-teal-300/10 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-100">
              <MoonStar className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              Ramadan {status.hijriYear} H
            </div>
            <h2 id="ramadan-home-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {status.ramadanDay ? `${status.ramadanDay} Ramadan` : 'Mode Ramadan aktif'}
            </h2>
            <p className="mt-1 text-xs text-teal-100/80">Mode {sourceCopy}.</p>
          </div>
          <Link
            href="/ramadan"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Lihat Imsakiyah
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/15 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-100/75">{heading}</p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-tight sm:text-4xl" aria-label={`${heading}: ${context.formattedCountdown}`}>
              {context.formattedCountdown}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-teal-100/80">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Target: {context.targetLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 sm:gap-4">
          <div className="flex items-center gap-2">
            <MoonStar className="h-4 w-4 text-teal-200" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-teal-100/70">Imsak</p>
              <p className="font-mono text-sm font-bold">{formatTime(timing.imsakAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sunrise className="h-4 w-4 text-teal-200" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-teal-100/70">Subuh</p>
              <p className="font-mono text-sm font-bold">{formatTime(timing.fajrAt)}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Sunset className="h-4 w-4 text-gold-200" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-teal-100/70">Maghrib</p>
              <p className="font-mono text-sm font-bold">{formatTime(timing.maghribAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
