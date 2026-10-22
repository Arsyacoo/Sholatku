'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { installUpdate, type AvailableUpdate } from '@/lib/platform/app-update';
import { Button } from '../ui/Button';
import { useLanguage } from '@/hooks/useLanguage';

type InstallState = 'idle' | 'downloading' | 'needs-permission' | 'error';

/** Downloads the update inside the app and opens Android's installer; falls back to the browser link on failure. */
export const UpdateInstallButton: React.FC<{ update: AvailableUpdate }> = ({ update }) => {
  const { t } = useLanguage();
  const [state, setState] = useState<InstallState>('idle');

  const handleInstall = async () => {
    setState('downloading');
    try {
      setState((await installUpdate(update)) === 'needs-permission' ? 'needs-permission' : 'idle');
    } catch (error) {
      console.warn('In-app update failed:', error);
      setState('error');
    }
  };

  return (
    <div className="space-y-1.5">
      <Button size="sm" onClick={handleInstall} isLoading={state === 'downloading'}>
        {state !== 'downloading' && <Download className="h-3.5 w-3.5" aria-hidden="true" />}
        {state === 'downloading' ? t('Mengunduh...', 'Downloading...') : t(`Perbarui ke ${update.version}`, `Update to ${update.version}`)}
      </Button>
      {state === 'needs-permission' && (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400" role="status">
          {t(
            'Aktifkan "Izinkan dari sumber ini" untuk Sholatku, kembali ke aplikasi, lalu ketuk tombol ini lagi.',
            'Turn on "Allow from this source" for Sholatku, return to the app, then tap this button again.'
          )}
        </p>
      )}
      {state === 'error' && (
        <p className="text-xs leading-relaxed text-red-600 dark:text-red-400" role="status">
          {t('Gagal mengunduh. Periksa koneksi lalu coba lagi, atau', 'Download failed. Check your connection and try again, or')}{' '}
          <a href={update.downloadUrl} className="font-semibold underline">
            {t('unduh lewat browser', 'download it in the browser')}

          </a>
          .
        </p>
      )}
    </div>
  );
};
