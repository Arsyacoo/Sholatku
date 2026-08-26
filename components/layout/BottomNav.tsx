'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Calendar, Compass, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Hari Ini', icon: Sparkles },
    { href: '/monthly', label: 'Bulanan', icon: Calendar },
    { href: '/qibla', label: 'Kiblat', icon: Compass },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-surface-950/90 backdrop-blur-lg border-t border-surface-200 dark:border-surface-800 pb-safe">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-primary-50 dark:bg-primary-950/80 -translate-y-0.5' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] tracking-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
