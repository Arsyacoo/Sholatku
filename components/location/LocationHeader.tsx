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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
      {/* Location selector button */}
      <button
        onClick={onOpenSearch}
        className="group flex items-center gap-2.5 text-left p-1.5 -ml-1.5 rounded-2xl hover:bg-surface-100 dark:hover:bg-surface-800/80 transition-all cursor-pointer"
        aria-label="Ubah lokasi saat ini"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 flex items-center justify-center shrink-0 border border-primary-200/60 dark:border-primary-800/60 group-hover:scale-105 transition-transform">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jadwal Sholat Untuk</span>
            {location.isAutoDetected && (
              <Badge variant="primary" className="text-[10px] py-0 px-1.5">
                GPS
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            <span>{location.displayName || location.city}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" />
          </div>
        </div>
      </button>

      {/* Action shortcuts: Coordinates & Refresh */}
      <div className="flex items-center gap-2 self-start sm:self-center">
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-surface-100 dark:bg-surface-800/60 px-2.5 py-1 rounded-lg border border-surface-200/60 dark:border-surface-700/60">
          {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
        </span>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
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
