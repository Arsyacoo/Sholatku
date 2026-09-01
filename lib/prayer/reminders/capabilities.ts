import type { PrayerReminderCapabilities } from './types';

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const standaloneNavigator = (navigator as Navigator & { standalone?: boolean }).standalone;
    return standaloneNavigator === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
  } catch {
    return false;
  }
}

export function getPrayerReminderCapabilities(): PrayerReminderCapabilities {
  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
  const serviceWorkerSupported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const permission = notificationsSupported
    ? window.Notification.permission
    : 'unsupported';
  const secureContext = typeof window !== 'undefined' && window.isSecureContext === true;
  const calendarExportSupported =
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function';

  return {
    notificationsSupported,
    serviceWorkerSupported,
    permission,
    canShowPersistentNotification:
      notificationsSupported && serviceWorkerSupported && permission === 'granted',
    isStandalone: isStandaloneDisplayMode(),
    secureContext,
    calendarExportSupported,
    exactBackgroundSchedulingGuaranteed: false,
  };
}
