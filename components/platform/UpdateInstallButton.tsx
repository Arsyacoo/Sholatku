'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { installUpdate, type AvailableUpdate } from '@/lib/platform/app-update';
import { Button } from '../ui/Button';

type InstallState = 'idle' | 'downloading' | 'needs-permission' | 'error';

/** Downloads the update inside the app and opens Android's installer; falls back to the browser link on failure. */
export const UpdateInstallButton: React.FC<{ update: AvailableUpdate }> = ({ update }) => {
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
        {state === 'downloading' ? 'Mengunduh...' : `Perbarui ke ${update.version}`}
      </Button>
      {state === 'needs-permission' && (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400" role="status">
          Aktifkan &quot;Izinkan dari sumber ini&quot; untuk Sholatku, kembali ke aplikasi, lalu ketuk tombol ini lagi.
        </p>
      )}
      {state === 'error' && (
        <p className="text-xs leading-relaxed text-red-600 dark:text-red-400" role="status">
          Gagal mengunduh. Periksa koneksi lalu coba lagi, atau{' '}
          <a href={update.downloadUrl} className="font-semibold underline">
            unduh lewat browser
          </a>
          .
        </p>
      )}
    </div>
  );
};
