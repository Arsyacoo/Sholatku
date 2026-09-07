import fs from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { clearBackActionsForTests, dispatchBackAction, registerBackAction } from '@/lib/platform/back';
import { isRouteActive } from '@/lib/platform/navigation';
import { matchMobileRoute } from '@/mobile/src/MobileRoutes';

describe('mobile route matching', () => {
  it('maps the Android shell routes explicitly', () => {
    expect(matchMobileRoute('/').kind).toBe('home');
    expect(matchMobileRoute('/quran').kind).toBe('quran');
    expect(matchMobileRoute('/quran/offline').kind).toBe('quran-offline');
    expect(matchMobileRoute('/quran/12').kind).toBe('quran-surah');
    expect(matchMobileRoute('/monthly').kind).toBe('monthly');
    expect(matchMobileRoute('/qibla').kind).toBe('qibla');
    expect(matchMobileRoute('/settings').kind).toBe('settings');
    expect(matchMobileRoute('/ramadan').kind).toBe('ramadan');
    expect(matchMobileRoute('/~offline').kind).toBe('offline');
  });

  it('treats nested Quran pages as the Quran tab', () => {
    expect(isRouteActive('/quran', '/quran')).toBe(true);
    expect(isRouteActive('/quran/12', '/quran')).toBe(true);
    expect(isRouteActive('/quran/offline', '/quran')).toBe(true);
    expect(isRouteActive('/monthly', '/quran')).toBe(false);
  });
});

describe('back action stack', () => {
  beforeEach(() => {
    clearBackActionsForTests();
  });

  it('dismisses the highest-priority overlay first', async () => {
    const calls: string[] = [];

    registerBackAction(() => {
      calls.push('modal');
      return true;
    }, 50);
    registerBackAction(() => {
      calls.push('select');
      return true;
    }, 100);

    await expect(dispatchBackAction()).resolves.toBe(true);
    expect(calls).toEqual(['select']);
  });

  it('falls through to the next handler when the top handler declines', async () => {
    const calls: string[] = [];

    registerBackAction(() => {
      calls.push('modal');
      return true;
    }, 50);
    registerBackAction(() => {
      calls.push('select');
      return false;
    }, 100);

    await expect(dispatchBackAction()).resolves.toBe(true);
    expect(calls).toEqual(['select', 'modal']);
  });
});

describe('safe-area contract', () => {
  it('keeps the shared safe-area variables and mobile body padding in CSS', () => {
    const css = fs.readFileSync(path.resolve('app/globals.css'), 'utf8');
    expect(css).toContain('--safe-area-top');
    expect(css).toContain('--safe-area-bottom');
    expect(css).toContain('padding-bottom: calc(5rem + var(--safe-area-bottom))');

    const layout = fs.readFileSync(path.resolve('app/layout.tsx'), 'utf8');
    expect(layout).not.toContain('pb-20 md:pb-0');
  });
});
