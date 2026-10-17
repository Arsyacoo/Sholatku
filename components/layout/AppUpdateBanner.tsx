'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import {
  checkForAppUpdate,
  dismissUpdate,
  isUpdateDismissed,
  type AvailableUpdate,
} from '@/lib/platform/app-update';

/** Android only: announces a newer GitHub release; Android installs the APK as an in-place update. */
export const AppUpdateBanner: React.FC = () => {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkForAppUpdate()
      .then((status) => {
        if (!cancelled && status?.update && !isUpdateDismissed(status.update.version)) setUpdate(status.update);
      })
      .catch((error) => console.warn('App update check failed:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-primary-200/80 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-800/60 dark:bg-primary-950/40 dark:text-primary-100"
      role="status"
    >
      <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary-950 dark:text-primary-50">Sholatku {update.version} tersedia</p>
        <p className="mt-0.5 text-xs leading-relaxed text-primary-800/90 dark:text-primary-200/90">
          Unduh lalu buka APK-nya, kemudian pilih Update. Data dan pengaturan tetap tersimpan.
        </p>
        <a
          href={update.downloadUrl}
          className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Unduh pembaruan
        </a>
      </div>
      <button
        type="button"
        onClick={() => {
          dismissUpdate(update.version);
          setUpdate(null);
        }}
        className="rounded-lg p-1.5 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100"
        aria-label="Tutup pemberitahuan pembaruan"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
