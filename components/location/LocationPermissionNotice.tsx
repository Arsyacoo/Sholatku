'use client';

import React from 'react';
import { AlertCircle, MapPin, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();
  if (status !== 'denied' && status !== 'error' && !errorMessage) return null;

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 text-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            {status === 'denied' ? t('Akses Lokasi Dibatasi', 'Location access blocked') : t('Pemberitahuan Lokasi', 'Location notice')}
          </p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
            {errorMessage || t('Anda dapat memilih kota Anda secara manual untuk mendapatkan jadwal yang akurat.', 'You can choose your city manually to get accurate times.')}
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
          {t('Pilih Kota Manual', 'Choose city manually')}
        </Button>
        <button
          onClick={onDismiss}
          className="p-1.5 text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 rounded-lg"
          aria-label={t('Tutup pemberitahuan', 'Dismiss notice')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
