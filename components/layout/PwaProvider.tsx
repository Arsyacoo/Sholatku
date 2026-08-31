'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { SerwistProvider, useSerwist } from '@serwist/next/react';
import { ConnectionStatus } from './ConnectionStatus';

function PwaUpdatePrompt() {
  const { serwist } = useSerwist();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!serwist) return;
    const onWaiting = () => setUpdateAvailable(true);
    serwist.addEventListener('waiting', onWaiting);
    return () => serwist.removeEventListener('waiting', onWaiting);
  }, [serwist]);

  const applyUpdate = () => {
    if (!serwist) return;
    setUpdating(true);
    // The worker has skipWaiting disabled by default. We only activate and
    // reload after an explicit user action, so an active reading session stays
    // on its current version.
    const onControlling = () => window.location.reload();
    serwist.addEventListener('controlling', onControlling);
    serwist.messageSkipWaiting();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-[65] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-primary-200 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-xl backdrop-blur dark:border-primary-800 dark:bg-slate-900/95 dark:text-slate-200 md:bottom-4">
      <RefreshCw className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      <p className="flex-1 font-medium">Versi baru Sholatku tersedia.</p>
      <button
        type="button"
        onClick={applyUpdate}
        disabled={updating}
        className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-700 disabled:cursor-wait disabled:opacity-60"
      >
        {updating ? 'Memuat…' : 'Perbarui'}
      </button>
      <button
        type="button"
        aria-label="Tutup pemberitahuan pembaruan"
        onClick={() => setUpdateAvailable(false)}
        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV === 'development'}
      reloadOnOnline={false}
    >
      {children}
      <ConnectionStatus />
      <PwaUpdatePrompt />
    </SerwistProvider>
  );
}
