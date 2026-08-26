'use client';

import React from 'react';
import Link from 'next/link';
import { JUZ_LIST } from '@/lib/quran/juz-list';
import { ArrowRight, Layers } from 'lucide-react';

export const JuzList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {JUZ_LIST.map((juz) => (
        <Link
          key={juz.juzNumber}
          href={`/quran/${juz.startSurahNumber}`}
          className="group flex items-center justify-between p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-400 dark:hover:border-primary-600 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center font-bold text-sm shrink-0 border border-primary-200 dark:border-primary-800 transition-colors">
              <span className="font-mono">{juz.juzNumber}</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {juz.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mulai: Surat {juz.startSurahName} ({juz.startAyah})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
              Hingga: {juz.endSurahName} ({juz.endAyah})
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all inline-block mt-1" />
          </div>
        </Link>
      ))}
    </div>
  );
};
