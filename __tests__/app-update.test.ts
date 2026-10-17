import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ getInfo: vi.fn() }));
vi.mock('@capacitor/app', () => ({ App: appMock }));

import {
  checkForAppUpdate,
  compareVersions,
  dismissUpdate,
  findAvailableUpdate,
  isUpdateDismissed,
  parseReleaseVersion,
  UPDATE_CHECK_INTERVAL_MS,
} from '@/lib/platform/app-update';

const DOWNLOAD = 'https://github.com/Arsyacoo/Sholatku/releases/download';

function release(tag: string, overrides: Record<string, unknown> = {}) {
  return {
    tag_name: tag,
    draft: false,
    assets: [{ name: 'sholatku-latest.apk', browser_download_url: `${DOWNLOAD}/${tag}/sholatku-latest.apk` }],
    ...overrides,
  };
}

describe('release version parsing', () => {
  it('reads semantic versions from preview tags', () => {
    expect(parseReleaseVersion('v0.2.0-preview.2')).toEqual([0, 2, 0]);
    expect(parseReleaseVersion('0.10.1')).toEqual([0, 10, 1]);
    expect(parseReleaseVersion('latest')).toBeNull();
    expect(compareVersions([0, 10, 0], [0, 9, 9])).toBeGreaterThan(0);
  });
});

describe('available update selection', () => {
  it('picks the highest newer release and ignores drafts and older builds', () => {
    const update = findAvailableUpdate(
      [release('v0.1.0-preview.1'), release('v0.4.0-preview.4', { draft: true }), release('v0.3.0-preview.3'), release('v0.2.1-preview.2')],
      '0.2.0'
    );
    expect(update).toEqual({
      version: '0.3.0',
      tag: 'v0.3.0-preview.3',
      downloadUrl: `${DOWNLOAD}/v0.3.0-preview.3/sholatku-latest.apk`,
      releaseUrl: 'https://github.com/Arsyacoo/Sholatku/releases/tag/v0.3.0-preview.3',
    });
  });

  it('reports no update for the installed version or releases without a trusted APK', () => {
    expect(findAvailableUpdate([release('v0.2.0-preview.2')], '0.2.0')).toBeNull();
    const foreign = release('v0.3.0-preview.3', {
      assets: [{ name: 'sholatku-latest.apk', browser_download_url: 'https://evil.example/sholatku-latest.apk' }],
    });
    expect(findAvailableUpdate([foreign], '0.2.0')).toBeNull();
    expect(findAvailableUpdate({ message: 'API rate limit exceeded' }, '0.2.0')).toBeNull();
  });
});

describe('update check on Android', () => {
  const storage: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
    };
    (globalThis as any).Capacitor = { getPlatform: () => 'android', isNativePlatform: () => true };
    appMock.getInfo.mockResolvedValue({ version: '0.2.0', build: '2' });
  });

  afterEach(() => {
    delete (globalThis as any).Capacitor;
    vi.unstubAllGlobals();
  });

  it('checks GitHub at most once per interval unless forced', async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () => new Response(JSON.stringify([release('v0.3.0-preview.3')]))
    );
    vi.stubGlobal('fetch', fetchMock);

    const first = await checkForAppUpdate({ now: 1_000 });
    expect(first?.update?.version).toBe('0.3.0');
    await checkForAppUpdate({ now: 1_000 + UPDATE_CHECK_INTERVAL_MS - 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await checkForAppUpdate({ now: 2_000, force: true });
    await checkForAppUpdate({ now: 2_000 + UPDATE_CHECK_INTERVAL_MS + 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('remembers a dismissed version only', () => {
    dismissUpdate('0.3.0');
    expect(isUpdateDismissed('0.3.0')).toBe(true);
    expect(isUpdateDismissed('0.4.0')).toBe(false);
  });
});
