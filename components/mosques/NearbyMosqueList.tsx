'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Crosshair, Navigation, RefreshCw, WifiOff } from 'lucide-react';
import type { UserLocation } from '@/types';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { fetchNearbyMosques, formatDistance, mapsDirectionsUrl, type NearbyMosque } from '@/lib/location/mosques';
import { isNetworkRequestError } from '@/lib/network/fetch';
import { useLanguage } from '@/hooks/useLanguage';

interface NearbyMosqueListProps {
  location: UserLocation;
  onDetectLocation: () => void;
  isDetecting: boolean;
}

const DIRECTIONS = {
  id: ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'],
  en: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'],
};

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'done'; mosques: NearbyMosque[] };

export const NearbyMosqueList: React.FC<NearbyMosqueListProps> = ({ location, onDetectLocation, isDetecting }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const { t, language } = useLanguage();
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchNearbyMosques(location.latitude, location.longitude, controller.signal)
      .then((mosques) => setState({ status: 'done', mosques }))
      .catch((error) => {
        if (isNetworkRequestError(error, 'aborted')) return;
        console.warn('Nearby mosque search failed:', error);
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [location.latitude, location.longitude, attempt]);

  return (
    <div className="space-y-4">
      {!location.isAutoDetected && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center">
          <p className="flex-1 text-xs leading-relaxed">
            {t(
              `Dicari dari titik pusat ${location.displayName}. Gunakan lokasi perangkat agar jaraknya sesuai posisi Anda.`,
              `Searched from the centre of ${location.displayName}. Use your device location for distances from where you are.`
            )}
          </p>
          <Button variant="outline" size="sm" onClick={onDetectLocation} isLoading={isDetecting} className="self-start sm:self-center">
            {!isDetecting && <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />}
            {t('Gunakan lokasi saya', 'Use my location')}
          </Button>
        </div>
      )}

      {state.status === 'loading' && (
        <ul className="space-y-2.5" aria-label={t('Memuat masjid terdekat', 'Loading nearby mosques')}>
          {[0, 1, 2, 3].map((key) => (
            <li key={key}>
              <Skeleton className="h-[76px] rounded-2xl" />
            </li>
          ))}
        </ul>
      )}

      {state.status === 'error' && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-surface-200 bg-white px-6 py-10 text-center dark:border-surface-800 dark:bg-surface-900">
          <WifiOff className="h-6 w-6 text-slate-400" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('Daftar masjid belum dapat dimuat', 'The mosque list could not be loaded')}</p>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t('Fitur ini memerlukan koneksi internet. Periksa koneksi lalu coba lagi.', 'This feature needs an internet connection. Check your connection and try again.')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('Coba lagi', 'Try again')}
          </Button>
        </div>
      )}

      {state.status === 'done' && state.mosques.length === 0 && (
        <p className="rounded-2xl border border-surface-200 bg-white px-6 py-10 text-center text-sm text-slate-600 dark:border-surface-800 dark:bg-surface-900 dark:text-slate-400">
          {t('Belum ada masjid yang tercatat di OpenStreetMap dalam radius 5 km.', 'No mosques are listed on OpenStreetMap within 5 km yet.')}
        </p>
      )}

      {state.status === 'done' && state.mosques.length > 0 && (
        <ul className="space-y-2.5">
          {state.mosques.map((mosque) => {
            const name = mosque.name || t('Masjid tanpa nama', 'Unnamed mosque');
            return (
            <li
              key={mosque.id}
              className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-3.5 dark:border-surface-800 dark:bg-surface-900"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {mosque.kind === 'musala' ? t('Musala', 'Prayer room') : t('Masjid', 'Mosque')} ·{' '}
                  <span className="font-semibold text-primary-700 dark:text-primary-300">
                    {formatDistance(mosque.distanceMeters, language)}
                  </span>{' '}
                  {t('ke arah', 'to the')} {DIRECTIONS[language][mosque.direction]}
                </p>
                {mosque.street && <p className="mt-0.5 truncate text-xs text-slate-400">{mosque.street}</p>}
              </div>
              <a
                href={mapsDirectionsUrl(mosque)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary-50 px-3 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300"
                aria-label={t(`Rute ke ${name}`, `Directions to ${name}`)}
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                {t('Rute', 'Directions')}
              </a>
            </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Data ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
          {t('kontributor OpenStreetMap', 'OpenStreetMap contributors')}
        </a>
        {t('. Masjid yang belum terdaftar bisa ditambahkan di openstreetmap.org.', '. Missing mosques can be added at openstreetmap.org.')}
      </p>
    </div>
  );
};
