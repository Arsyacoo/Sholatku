'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function ConnectionStatus() {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowRestored(false);
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      setShowRestored(true);
      const timeout = window.setTimeout(() => setShowRestored(false), 4000);
      return () => window.clearTimeout(timeout);
    }
  }, [isOnline]);

  if (isOnline && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur sm:inset-x-auto sm:right-4 sm:left-auto ${
        isOnline
          ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-200'
          : 'border-amber-200 bg-amber-50/95 text-amber-800 dark:border-amber-800 dark:bg-amber-950/95 dark:text-amber-200'
      }`}
    >
      {isOnline ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <WifiOff className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {isOnline
          ? 'Koneksi kembali tersedia.'
          : 'Offline — menggunakan data yang tersimpan di perangkat.'}
      </span>
    </div>
  );
}
