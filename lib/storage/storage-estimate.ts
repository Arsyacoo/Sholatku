export interface StorageEstimate {
  usage: number;
  quota: number;
  percentage: number | null;
}

/** Returns best-effort browser storage information without throwing in SSR or restricted contexts. */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      percentage: quota > 0 ? Math.min(100, (usage / quota) * 100) : null,
    };
  } catch {
    return null;
  }
}
