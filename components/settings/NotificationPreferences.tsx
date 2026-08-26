'use client';

import React, { useState } from 'react';
import { Bell, Volume2, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface NotificationPreferencesProps {
  enabled: boolean;
  notifyBeforeMinutes: number;
  onToggle: (enabled: boolean) => void;
  onMinutesChange: (minutes: number) => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  enabled,
  notifyBeforeMinutes,
  onToggle,
  onMinutesChange,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser ini tidak mendukung notifikasi desktop/mobile.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result === 'granted') {
        onToggle(true);
        new Notification('Sholatku', {
          body: 'Notifikasi waktu sholat berhasil diaktifkan.',
          icon: '/icon-192.png',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
          Notifikasi &amp; Pengingat Adzan
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dapatkan pemberitahuan otomatis saat waktu sholat telah masuk.
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-300 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Aktifkan Notifikasi Adzan
              </div>
              <div className="text-xs text-slate-500">
                {permissionState === 'granted'
                  ? 'Izin notifikasi browser telah aktif'
                  : permissionState === 'denied'
                  ? 'Izin diblokir di browser'
                  : 'Memerlukan izin browser'}
              </div>
            </div>
          </div>

          {permissionState === 'granted' ? (
            <button
              type="button"
              onClick={() => onToggle(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : (
            <Button size="sm" onClick={requestPermission}>
              Aktifkan
            </Button>
          )}
        </div>

        {enabled && (
          <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Waktu Pengingat:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { min: 0, label: 'Tepat Waktu' },
                { min: 5, label: '5 Mnt Sebelumnya' },
                { min: 10, label: '10 Mnt Sebelumnya' },
              ].map(({ min, label }) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => onMinutesChange(min)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    notifyBeforeMinutes === min
                      ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold border border-primary-300 dark:border-primary-700'
                      : 'bg-surface-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300 hover:bg-surface-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
