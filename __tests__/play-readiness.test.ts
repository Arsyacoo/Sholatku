import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

describe('Play readiness guardrails', () => {
  it('keeps privacy information bundled and reachable from Settings', () => {
    expect(read('app/privacy/page.tsx')).toContain('PrivacyPolicyContent');
    expect(read('components/privacy/PrivacyPolicyContent.tsx')).toContain('Kebijakan Privasi');
    expect(read('app/settings/page.tsx')).toContain('href="/privacy"');
  });

  it('keeps the Android manifest privacy and permission boundaries explicit', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain('android.permission.SCHEDULE_EXACT_ALARM');
    expect(manifest).toContain('tools:node="remove"');
    expect(manifest).not.toContain('USE_EXACT_ALARM');
    expect(manifest).not.toContain('REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
    expect(manifest).not.toContain('ACCESS_BACKGROUND_LOCATION');
  });

  it('makes a production mobile build require an explicit API mode', () => {
    const packageJson = read('package.json');
    const config = read('vite.mobile.config.ts');
    expect(packageJson).toContain('build:mobile:internal');
    expect(packageJson).toContain('build:mobile:production');
    expect(config).toContain('resolveMobileBuildApiBaseUrl');
    expect(config).toContain('mode !== MOBILE_PRODUCTION_MODE');
    expect(config).toContain('internal-staging');
  });

  it('keeps the final Sholatku launcher branding resource graph intact', () => {
    const adaptiveIcon = read('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml');
    const adaptiveRoundIcon = read('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml');
    const sourcePath = 'docs/store-assets/sholatku-app-icon-512.png';
    const source = fs.readFileSync(sourcePath);

    expect(adaptiveIcon).toContain('@drawable/ic_launcher_foreground');
    expect(adaptiveIcon).toContain('@drawable/ic_launcher_monochrome');
    expect(adaptiveRoundIcon).toContain('@drawable/ic_launcher_foreground');
    expect(fs.existsSync('android/app/src/main/res/drawable/ic_launcher_foreground.png')).toBe(true);
    expect(fs.existsSync('android/app/src/main/res/drawable/ic_launcher_monochrome.png')).toBe(true);
    expect(fs.existsSync('android/app/src/main/res/drawable/ic_launcher_background.png')).toBe(true);
    expect(source.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(source.readUInt32BE(16)).toBe(512);
    expect(source.readUInt32BE(20)).toBe(512);
    expect(fs.existsSync('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml')).toBe(false);
    expect(fs.existsSync('android/app/src/main/res/drawable/ic_launcher_background.xml')).toBe(false);
    expect(fs.existsSync('android/app/src/main/res/values/ic_launcher_background.xml')).toBe(false);
    expect(fs.existsSync('docs/store-assets/sholatku-app-icon.svg')).toBe(false);

    for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      expect(fs.existsSync(`android/app/src/main/res/mipmap-${density}/ic_launcher.png`)).toBe(true);
      expect(fs.existsSync(`android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`)).toBe(true);
    }
  });
});
