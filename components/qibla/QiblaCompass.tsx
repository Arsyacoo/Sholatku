'use client';

import React from 'react';
import { Compass, Navigation2, CheckCircle, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { useQibla } from '@/hooks/useQibla';
import { UserLocation } from '@/types';
import { Button } from '../ui/Button';

interface QiblaCompassProps {
  location: UserLocation;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ location }) => {
  const {
    bearing,
    distanceKm,
    deviceHeading,
    relativeBearing,
    hasSensor,
    permissionState,
    isAligned,
    requestSensorPermission,
  } = useQibla(location);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-300 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Arah Kiblat</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {bearing}° <span className="text-xs font-sans text-slate-500 font-normal">dari Utara Sejati</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-gold-100 dark:bg-gold-950/80 text-gold-600 dark:text-gold-300 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Jarak ke Ka&apos;bah</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {distanceKm.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">km (Makkah)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Permission Notice for iOS / Mobile */}
      {permissionState === 'prompt' && (
        <div className="p-4 bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-primary-900 dark:text-primary-200">
            <Sparkles className="w-4 h-4 text-primary-600 shrink-0" />
            <span>Aktifkan sensor kompas perangkat untuk putaran otomatis.</span>
          </div>
          <Button size="sm" onClick={requestSensorPermission}>
            Izinkan Sensor Kompas
          </Button>
        </div>
      )}

      {/* Interactive Compass Dial */}
      <div className="flex flex-col items-center justify-center py-6">
        <div
          className={`relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-surface-50 dark:bg-surface-900/90 border-4 ${
            isAligned
              ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20'
              : 'border-surface-200 dark:border-surface-800 shadow-lg'
          } flex items-center justify-center transition-all duration-300`}
        >
          {/* Degree Ticks */}
          <div className="absolute inset-2 rounded-full border border-dashed border-surface-300 dark:border-surface-700 pointer-events-none" />

          {/* Cardinal Directions */}
          <span className="absolute top-3 font-bold text-xs text-red-500 font-mono">U (0°)</span>
          <span className="absolute right-3 font-bold text-xs text-slate-400 font-mono">T (90°)</span>
          <span className="absolute bottom-3 font-bold text-xs text-slate-400 font-mono">S (180°)</span>
          <span className="absolute left-3 font-bold text-xs text-slate-400 font-mono">B (270°)</span>

          {/* Rotating Compass Disc / Pointer */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `rotate(${deviceHeading !== null ? -deviceHeading : 0}deg)`,
            }}
          >
            {/* Kaaba Direction Needle */}
            <div
              className="absolute w-full h-full flex flex-col items-center justify-start pt-6"
              style={{
                transform: `rotate(${bearing}deg)`,
              }}
            >
              {/* Kaaba Indicator Icon */}
              <div className="relative flex flex-col items-center group">
                <div
                  className={`w-8 h-8 rounded-lg ${
                    isAligned ? 'bg-emerald-600 animate-bounce' : 'bg-primary-600'
                  } text-white flex items-center justify-center shadow-md`}
                >
                  <Navigation2 className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[10px] font-bold mt-1 bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-xs">
                  Kiblat
                </span>
              </div>
            </div>
          </div>

          {/* Center Hub */}
          <div className="absolute w-16 h-16 rounded-full bg-white dark:bg-surface-800 border-2 border-primary-500 shadow-md flex flex-col items-center justify-center text-center">
            {isAligned ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {bearing}°
              </span>
            )}
          </div>
        </div>

        {/* Alignment status banner */}
        <div className="mt-6 text-center">
          {isAligned ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm border border-emerald-300 dark:border-emerald-800 animate-pulse">
              <CheckCircle className="w-4 h-4" />
              <span>Arah Perangkat Sudah Tepat Menghadap Kiblat</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasSensor
                ? 'Putar ponsel hingga panah hijau menghadap tepat ke atas'
                : `Arahkan kompas fisik Anda pada sudut ${bearing}° dari arah Utara`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
