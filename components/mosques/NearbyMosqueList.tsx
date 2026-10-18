'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Crosshair, Navigation, RefreshCw, WifiOff } from 'lucide-react';
import type { UserLocation } from '@/types';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { fetchNearbyMosques, formatDistance, mapsDirectionsUrl, type NearbyMosque } from '@/lib/location/mosques';
import { isNetworkRequestError } from '@/lib/network/fetch';

interface NearbyMosqueListProps {
  location: UserLocation;
  onDetectLocation: () => void;
  isDetecting: boolean;
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'done'; mosques: NearbyMosque[] };

export const NearbyMosqueList: React.FC<NearbyMosqueListProps> = ({ location, onDetectLocation, isDetecting }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
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
            Dicari dari titik pusat {location.displayName}. Gunakan lokasi perangkat agar jaraknya sesuai posisi Anda.
          </p>
          <Button variant="outline" size="sm" onClick={onDetectLocation} isLoading={isDetecting} className="self-start sm:self-center">
            {!isDetecting && <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />}
            Gunakan lokasi saya
          </Button>
        </div>
      )}

      {state.status === 'loading' && (
        <ul className="space-y-2.5" aria-label="Memuat masjid terdekat">
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
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daftar masjid belum dapat dimuat</p>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Fitur ini memerlukan koneksi internet. Periksa koneksi lalu coba lagi.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Coba lagi
          </Button>
        </div>
      )}

      {state.status === 'done' && state.mosques.length === 0 && (
        <p className="rounded-2xl border border-surface-200 bg-white px-6 py-10 text-center text-sm text-slate-600 dark:border-surface-800 dark:bg-surface-900 dark:text-slate-400">
          Belum ada masjid yang tercatat di OpenStreetMap dalam radius 5 km.
        </p>
      )}

      {state.status === 'done' && state.mosques.length > 0 && (
        <ul className="space-y-2.5">
          {state.mosques.map((mosque) => (
            <li
              key={mosque.id}
              className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-3.5 dark:border-surface-800 dark:bg-surface-900"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{mosque.name}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {mosque.kind} ·{' '}
                  <span className="font-semibold text-primary-700 dark:text-primary-300">
                    {formatDistance(mosque.distanceMeters)}
                  </span>{' '}
                  ke arah {mosque.direction}
                </p>
                {mosque.street && <p className="mt-0.5 truncate text-xs text-slate-400">{mosque.street}</p>}
              </div>
              <a
                href={mapsDirectionsUrl(mosque)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary-50 px-3 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300"
                aria-label={`Rute ke ${mosque.name}`}
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                Rute
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Data ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
          kontributor OpenStreetMap
        </a>
        . Masjid yang belum terdaftar bisa ditambahkan di openstreetmap.org.
      </p>
    </div>
  );
};
