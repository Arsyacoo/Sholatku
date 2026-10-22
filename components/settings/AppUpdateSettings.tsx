'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';
import { checkForAppUpdate, type AppUpdateStatus } from '@/lib/platform/app-update';
import { isNativeRuntime } from '@/lib/platform/runtime';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { UpdateInstallButton } from '../platform/UpdateInstallButton';
import { useLanguage } from '@/hooks/useLanguage';

/** GitHub often answers in ~200 ms; keep the spinner up long enough to be seen. */
const MIN_CHECK_FEEDBACK_MS = 800;

function formatCheckedAt(checkedAt: number, locale: string): string {
  return new Date(checkedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Android only: shows the installed version and a manual "check for updates" against GitHub Releases. */
export const AppUpdateSettings: React.FC = () => {
  const { t, locale } = useLanguage();
  const [isNative, setIsNative] = useState(false);
  const [status, setStatus] = useState<AppUpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);

  useEffect(() => {
    if (!isNativeRuntime()) return;
    setIsNative(true);
    checkForAppUpdate()
      .then(setStatus)
      .catch(() => setError(true));
  }, []);

  if (!isNative) return null;

  const handleCheck = async () => {
    setIsChecking(true);
    setError(false);
    try {
      const [next] = await Promise.all([
        checkForAppUpdate({ force: true }),
        new Promise((resolve) => setTimeout(resolve, MIN_CHECK_FEEDBACK_MS)),
      ]);
      setStatus(next);
    } catch {
      setError(true);
    } finally {
      setIsChecking(false);
      setIsResultOpen(true);
    }
  };

  const update = status?.update;
  const installButton = update && <UpdateInstallButton update={update} />;

  return (
    <>
      <Modal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        title={error ? t('Gagal memeriksa', 'Check failed') : update ? t('Pembaruan tersedia', 'Update available') : t('Sudah versi terbaru', 'Up to date')}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {error
              ? t('Tidak dapat terhubung ke GitHub. Periksa koneksi internet lalu coba lagi.', 'Could not connect to GitHub. Check your internet connection and try again.')
              : update
              ? t(
                  `Sholatku ${update.version} tersedia (Anda memakai ${status?.currentVersion}). Ketuk Perbarui, lalu pilih Update di layar Android; data tetap tersimpan.`,
                  `Sholatku ${update.version} is available (you have ${status?.currentVersion}). Tap Update, then choose Update on the Android screen; your data is kept.`
                )
              : t(`Sholatku ${status?.currentVersion ?? ''} adalah versi terbaru.`, `Sholatku ${status?.currentVersion ?? ''} is the latest version.`)}
          </p>
          <div className="flex flex-col gap-2">
            {installButton}
            <Button variant="outline" size="sm" onClick={() => setIsResultOpen(false)}>
              {t('Tutup', 'Close')}
            </Button>
          </div>
        </div>
      </Modal>
      <div className="flex items-start gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 dark:border-surface-800 dark:bg-surface-900">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('Versi aplikasi', 'App version')} {status?.currentVersion ?? ''}
            </p>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400" aria-live="polite">
              {isChecking
                ? t('Memeriksa pembaruan...', 'Checking for updates...')
                : error
                ? t('Tidak dapat memeriksa pembaruan. Periksa koneksi lalu coba lagi.', 'Could not check for updates. Check your connection and try again.')
                : update
                ? t(
                    `Versi ${update.version} tersedia. Ketuk Perbarui lalu pilih Update; data tetap tersimpan.`,
                    `Version ${update.version} is available. Tap Update, then choose Update; your data is kept.`
                  )
                : status
                ? t(
                    `Anda memakai versi terbaru. Dicek pukul ${formatCheckedAt(status.checkedAt, locale)}.`,
                    `You have the latest version. Checked at ${formatCheckedAt(status.checkedAt, locale)}.`
                  )
                : t('Memeriksa pembaruan...', 'Checking for updates...')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {installButton}
            <Button variant="outline" size="sm" onClick={handleCheck} isLoading={isChecking}>
              {!isChecking && <RefreshCw className="h-3.5 w-3.5" />}
              {isChecking ? t('Memeriksa...', 'Checking...') : t('Cek pembaruan', 'Check for updates')}

            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
