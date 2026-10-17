import { App } from '@capacitor/app';

import { fetchJsonWithTimeout, NETWORK_TIMEOUTS } from '../network/fetch';
import { isNativeRuntime } from './runtime';

/**
 * Direct-distribution builds have no store to announce updates, so the app checks the official GitHub
 * Releases itself and links to the APK; Android then installs it as an in-place update.
 */
const RELEASES_API_URL = 'https://api.github.com/repos/Arsyacoo/Sholatku/releases?per_page=10';
const RELEASE_DOWNLOAD_PREFIX = 'https://github.com/Arsyacoo/Sholatku/releases/download/';
const RELEASE_PAGE_PREFIX = 'https://github.com/Arsyacoo/Sholatku/releases/tag/';
const UPDATE_ASSET_NAME = 'sholatku-latest.apk';
const CHECK_CACHE_KEY = 'sholatku_update_check_v1';
const DISMISSED_KEY = 'sholatku_update_dismissed_v1';

/** GitHub allows 60 unauthenticated API calls per hour per IP; one check per 12 hours is plenty. */
export const UPDATE_CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;

export interface AvailableUpdate {
  version: string;
  tag: string;
  downloadUrl: string;
  releaseUrl: string;
}

export interface AppUpdateStatus {
  currentVersion: string;
  update: AvailableUpdate | null;
}

interface CachedCheck extends AppUpdateStatus {
  checkedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** "v0.2.0-preview.2" or "0.2.0" → [0, 2, 0]; anything else → null. */
export function parseReleaseVersion(value: string): number[] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(value.trim());
  return match ? match.slice(1, 4).map(Number) : null;
}

export function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/** Highest published release newer than `currentVersion` that ships the APK from this repository. */
export function findAvailableUpdate(releases: unknown, currentVersion: string): AvailableUpdate | null {
  const current = parseReleaseVersion(currentVersion);
  if (!current || !Array.isArray(releases)) return null;

  let best: { parsed: number[]; update: AvailableUpdate } | null = null;
  for (const release of releases) {
    if (!isRecord(release) || release.draft === true || typeof release.tag_name !== 'string') continue;
    const parsed = parseReleaseVersion(release.tag_name);
    if (!parsed || compareVersions(parsed, current) <= 0) continue;
    if (best && compareVersions(parsed, best.parsed) <= 0) continue;

    const assets = Array.isArray(release.assets) ? release.assets : [];
    const asset = assets.find((item) => isRecord(item) && item.name === UPDATE_ASSET_NAME);
    const downloadUrl = isRecord(asset) ? asset.browser_download_url : undefined;
    // Only ever link to this repository's own release assets.
    if (typeof downloadUrl !== 'string' || !downloadUrl.startsWith(`${RELEASE_DOWNLOAD_PREFIX}${release.tag_name}/`)) {
      continue;
    }

    best = {
      parsed,
      update: {
        version: parsed.join('.'),
        tag: release.tag_name,
        downloadUrl,
        releaseUrl: `${RELEASE_PAGE_PREFIX}${encodeURIComponent(release.tag_name)}`,
      },
    };
  }
  return best?.update ?? null;
}

function readCache(): CachedCheck | null {
  try {
    const raw = localStorage.getItem(CHECK_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedCheck;
    return typeof cached.checkedAt === 'number' && typeof cached.currentVersion === 'string' ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(value: CachedCheck): void {
  try {
    localStorage.setItem(CHECK_CACHE_KEY, JSON.stringify(value));
  } catch {
    // A failed cache write only means the next launch checks again.
  }
}

/** Android only. Returns null on the web, where the browser always serves the latest build. */
export async function checkForAppUpdate(
  options: { force?: boolean; now?: number } = {}
): Promise<AppUpdateStatus | null> {
  if (!isNativeRuntime()) return null;

  const now = options.now ?? Date.now();
  const { version: currentVersion } = await App.getInfo();
  const cached = readCache();
  if (
    !options.force &&
    cached &&
    cached.currentVersion === currentVersion &&
    now - cached.checkedAt < UPDATE_CHECK_INTERVAL_MS
  ) {
    return { currentVersion, update: cached.update };
  }

  const releases = await fetchJsonWithTimeout<unknown>(RELEASES_API_URL, {
    timeoutMs: NETWORK_TIMEOUTS.appUpdate,
    headers: { Accept: 'application/vnd.github+json' },
  });
  const status = { currentVersion, update: findAvailableUpdate(releases, currentVersion) };
  writeCache({ ...status, checkedAt: now });
  return status;
}

export function isUpdateDismissed(version: string): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === version;
  } catch {
    return false;
  }
}

export function dismissUpdate(version: string): void {
  try {
    localStorage.setItem(DISMISSED_KEY, version);
  } catch {
    // Dismissal is a convenience; the banner simply returns next launch.
  }
}
