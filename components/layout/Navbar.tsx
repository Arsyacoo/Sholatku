'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Calendar, Settings, Sparkles, BookOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserLocation } from '@/types';
import { isRouteActive } from '@/lib/platform/navigation';

interface NavbarProps {
  location?: UserLocation;
  onOpenLocationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ location, onOpenLocationModal }) => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Hari Ini', icon: Sparkles },
    { href: '/quran', label: 'Al-Qur\'an', icon: BookOpen },
    { href: '/monthly', label: 'Bulanan', icon: Calendar },
    { href: '/qibla', label: 'Arah Kiblat', icon: Compass },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200/80 dark:border-surface-800/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <span className="font-bold text-lg font-arabic leading-none mt-0.5">صل</span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              Sholat<span className="text-primary-600 dark:text-primary-400">ku</span>
            </span>
            <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">
              Waktu Sholat &amp; Kiblat
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-100/70 dark:bg-surface-900/70 p-1 rounded-xl border border-surface-200/60 dark:border-surface-800/60">
        {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = isRouteActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white dark:bg-surface-800 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick actions: Location pill + Theme toggle */}
        <div className="flex items-center gap-2">
          {location && onOpenLocationModal && (
            <button
              onClick={onOpenLocationModal}
              className="md:hidden flex items-center gap-1.5 text-xs font-medium bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-surface-200 transition-colors border border-surface-200 dark:border-surface-700 max-w-[140px] truncate"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{location.city}</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle Button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
