'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, BookOpen } from 'lucide-react';
import { LastReadInfo } from '@/types';

interface LastReadCardProps {
  lastRead: LastReadInfo | null;
}

export const LastReadCard: React.FC<LastReadCardProps> = ({ lastRead }) => {
  if (!lastRead) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-800 to-teal-900 text-white p-6 shadow-md border border-primary-700/40">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-gold-300" />
              <span>Al-Qur&apos;an Digital</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Baca &amp; Dengarkan 30 Juz
            </h2>
            <p className="text-xs text-teal-100/80">
              Terjemahan resmi Kemenag RI, audio murottal merdu, dan navigasi ayat mudah.
            </p>
          </div>
          <Link
            href="/quran/1"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-900 font-bold text-xs hover:bg-teal-50 transition-colors shrink-0 shadow-sm"
          >
            <span>Mulai dari Al-Fatihah</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-teal-900 text-white p-6 shadow-md border border-primary-700/40">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200 uppercase tracking-wider">
            <Bookmark className="w-3.5 h-3.5 text-gold-300 fill-gold-300" />
            <span>Terakhir Dibaca</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Surat {lastRead.surahName}
          </h2>
          <p className="text-xs text-teal-100/90 font-medium">
            Ayat ke-{lastRead.ayahNumber}
          </p>
        </div>

        <Link
          href={`/quran/${lastRead.surahNumber}#ayah-${lastRead.ayahNumber}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-900 font-bold text-xs hover:bg-teal-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Lanjutkan Membaca</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
