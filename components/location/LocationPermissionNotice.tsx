'use client';

import React from 'react';
import { AlertCircle, MapPin, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface LocationPermissionNoticeProps {
  status: string;
  errorMessage: string | null;
  onOpenSearch: () => void;
  onDismiss: () => void;
}

export const LocationPermissionNotice: React.FC<LocationPermissionNoticeProps> = ({
  status,
  errorMessage,
  onOpenSearch,
  onDismiss,
}) => {
  if (status !== 'denied' && status !== 'error' && !errorMessage) return null;

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 text-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            {status === 'denied' ? 'Akses Lokasi Dibatasi' : 'Pemberitahuan Lokasi'}
          </p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
            {errorMessage || 'Anda dapat memilih kota Anda secara manual untuk mendapatkan jadwal yang akurat.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenSearch}
          className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-100 dark:border-amber-700 text-xs py-1.5"
        >
          <MapPin className="w-3.5 h-3.5 mr-1" />
          Pilih Kota Manual
        </Button>
        <button
          onClick={onDismiss}
          className="p-1.5 text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 rounded-lg"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
