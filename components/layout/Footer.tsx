'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full border-t border-surface-200/80 dark:border-surface-800/80 mt-16 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Sholatku &copy; {year ?? ''}</span>
          <span>&bull;</span>
          <span>Akurat &bull; Tenang &bull; Presisi</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/quran" className="hover:text-primary-600 transition-colors">
            Al-Qur&apos;an
          </Link>
          <span>&bull;</span>
          <Link href="/monthly" className="hover:text-primary-600 transition-colors">
            Jadwal Bulanan
          </Link>
          <span>&bull;</span>
          <Link href="/qibla" className="hover:text-primary-600 transition-colors">
            Kompas Kiblat
          </Link>
          <span>&bull;</span>
          <Link href="/settings" className="hover:text-primary-600 transition-colors">
            Pengaturan
          </Link>
          <span>&bull;</span>
          <Link href="/download" className="hover:text-primary-600 transition-colors">
            Android Preview
          </Link>
          <span>&bull;</span>
          <Link href="/privacy" className="hover:text-primary-600 transition-colors">
            Kebijakan Privasi
          </Link>
        </div>
      </div>
    </footer>
  );
};
