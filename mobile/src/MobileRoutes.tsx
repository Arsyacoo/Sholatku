import React, { Suspense, lazy, useEffect, useMemo } from 'react';

import { useMobileLocation } from './router';

const HomePage = lazy(() => import('@/app/page'));
const QuranPage = lazy(() => import('@/app/quran/page'));
const QuranOfflinePage = lazy(() => import('@/app/quran/offline/page'));
const MonthlyPage = lazy(() => import('@/app/monthly/page'));
const QiblaPage = lazy(() => import('@/app/qibla/page'));
const SettingsPage = lazy(() => import('@/app/settings/page'));
const RamadanPage = lazy(() => import('@/app/ramadan/page'));
const OfflinePage = lazy(() => import('@/app/~offline/page'));
const SurahDetailPage = lazy(() => import('@/app/quran/[id]/page'));

export type MobileRouteKind =
  | 'home'
  | 'quran'
  | 'quran-offline'
  | 'quran-surah'
  | 'monthly'
  | 'qibla'
  | 'settings'
  | 'ramadan'
  | 'offline'
  | 'unknown';

export interface MobileRouteMatch {
  kind: MobileRouteKind;
  surahId?: number;
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}

export function matchMobileRoute(pathname: string): MobileRouteMatch {
  const path = normalizePath(pathname);

  if (path === '/' || path === '') return { kind: 'home' };
  if (path === '/quran') return { kind: 'quran' };
  if (path === '/quran/offline') return { kind: 'quran-offline' };
  if (path === '/monthly') return { kind: 'monthly' };
  if (path === '/qibla') return { kind: 'qibla' };
  if (path === '/settings') return { kind: 'settings' };
  if (path === '/ramadan') return { kind: 'ramadan' };
  if (path === '/~offline') return { kind: 'offline' };

  const surahMatch = path.match(/^\/quran\/(\d{1,3})$/);
  if (surahMatch) {
    const surahId = Number(surahMatch[1]);
    if (Number.isInteger(surahId) && surahId >= 1 && surahId <= 114) {
      return { kind: 'quran-surah', surahId };
    }
  }

  return { kind: 'unknown' };
}

function RouteFallback({ label }: { label: string }) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6 py-12 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
          Sholatku
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{label}</h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Memuat pengalaman aplikasi...
        </p>
      </div>
    </div>
  );
}

function MobileRouteLoader() {
  return <RouteFallback label="Memuat Sholatku" />;
}

function SurahRoute({ surahId, routeKey }: { surahId: number; routeKey: string }) {
  const params = useMemo(() => Promise.resolve({ id: String(surahId) }), [surahId]);
  return <SurahDetailPage key={routeKey} params={params} />;
}

function RouteRenderer() {
  const location = useMobileLocation();
  const route = useMemo(() => matchMobileRoute(location.pathname), [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const targetId = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!targetId) return;

    let cancelled = false;
    let attempts = 0;
    const scrollToAnchor = () => {
      if (cancelled) return;

      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'center' });
        return;
      }

      attempts += 1;
      if (attempts < 10) {
        window.setTimeout(scrollToAnchor, 50);
      }
    };

    const timeout = window.setTimeout(scrollToAnchor, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [location.hash, location.pathname]);

  const routeKey = location.pathname;

  switch (route.kind) {
    case 'home':
      return <HomePage key={routeKey} />;
    case 'quran':
      return <QuranPage key={routeKey} />;
    case 'quran-offline':
      return <QuranOfflinePage key={routeKey} />;
    case 'quran-surah':
      return <SurahRoute key={routeKey} routeKey={routeKey} surahId={route.surahId ?? 1} />;
    case 'monthly':
      return <MonthlyPage key={routeKey} />;
    case 'qibla':
      return <QiblaPage key={routeKey} />;
    case 'settings':
      return <SettingsPage key={routeKey} />;
    case 'ramadan':
      return <RamadanPage key={routeKey} />;
    case 'offline':
      return <OfflinePage key={routeKey} />;
    default:
      return <HomePage key={routeKey} />;
  }
}

export function MobileRoutes() {
  return (
    <Suspense fallback={<MobileRouteLoader />}>
      <RouteRenderer />
    </Suspense>
  );
}
