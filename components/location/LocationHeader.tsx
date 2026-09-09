'use client';

import React from 'react';
import { MapPin, Navigation, RefreshCw, ChevronDown } from 'lucide-react';
import { UserLocation } from '@/types';
import { Badge } from '../ui/Badge';

interface LocationHeaderProps {
  location: UserLocation;
  onOpenSearch: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({
  location,
  onOpenSearch,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      {/* Location selector button */}
      <button
        onClick={onOpenSearch}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl p-0 -ml-1.5 text-left transition-all hover:bg-surface-100 dark:hover:bg-surface-800/80 cursor-pointer"
        aria-label="Ubah lokasi saat ini"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 flex items-center justify-center shrink-0 border border-primary-200/60 dark:border-primary-800/60 group-hover:scale-105 transition-transform">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jadwal Sholat Untuk</span>
            {location.isAutoDetected && (
              <Badge variant="primary" className="text-[10px] py-0 px-1.5">
                GPS
              </Badge>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            <span className="truncate">{location.displayName || location.city}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" />
          </div>
        </div>
      </button>

      {/* Action shortcuts: Coordinates & Refresh */}
      <div className="flex items-center justify-between gap-2 pl-[3.25rem] sm:shrink-0 sm:justify-end sm:pl-0">
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
        </span>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-11 w-11 items-center justify-center rounded-xl p-2 text-slate-400 transition-colors hover:bg-surface-100 hover:text-slate-600 dark:hover:bg-surface-800 dark:hover:text-slate-200 disabled:opacity-50"
            title="Muat ulang jadwal"
            aria-label="Muat ulang jadwal"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
