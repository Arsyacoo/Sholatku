export type AppRuntime = 'web' | 'android';

interface CapacitorRuntimeBridge {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
}

function getCapacitorBridge(): CapacitorRuntimeBridge | undefined {
  return (globalThis as typeof globalThis & { Capacitor?: CapacitorRuntimeBridge }).Capacitor;
}

/**
 * Returns the runtime without making domain modules depend directly on the
 * Capacitor package. The Android shell exposes the standard Capacitor bridge;
 * a normal browser and SSR remain the web runtime.
 */
export function getAppRuntime(): AppRuntime {
  const capacitor = getCapacitorBridge();
  if (!capacitor) return 'web';

  try {
    if (capacitor.isNativePlatform?.() && capacitor.getPlatform?.() === 'android') {
      return 'android';
    }
  } catch {
    // A partially initialized bridge must never prevent the web experience.
  }

  return 'web';
}

export function isNativeRuntime(): boolean {
  return getAppRuntime() === 'android';
}

export function isPwaRuntimeEnabled(): boolean {
  return getAppRuntime() === 'web';
}
