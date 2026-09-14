# Android Internal Candidate 0.1.0

Status: **SIGNING PENDING**. This is a local Google Play Internal Testing preparation record only. No upload,
publication, rollout, account change, or signing-key generation was performed.

## Candidate identity

- Application ID: `io.github.arsyacoo.sholatku`
- `versionName`: `0.1.0`
- `versionCode`: `1`
- Build channel: `internal-staging`
- Backend: `https://sholatku-staging.vercel.app` (intentional internal-testing staging only)
- Source state: `main` at `c64592e` plus the current uncommitted Sprint 06/07A/07A.1/07A.3.1 worktree changes
- Branding: Sprint 07A.3.1 developer-provided crescent-star launcher system
- Candidate date: `2026-09-14` (`Asia/Jakarta`)

## Artifacts

The release outputs below are unsigned because no upload key exists and no key-generation approval was given.

| Artifact | Path | Size | SHA-256 |
| --- | --- | ---: | --- |
| Internal AAB | `android/app/build/outputs/bundle/release/app-release.aab` | 3,534,197 bytes | `1062ff4356f5468e14cc623fe183942f555f0eefb7ee1780937b92d59c560e45` |
| Unsigned release APK | `android/app/build/outputs/apk/release/app-release-unsigned.apk` | 3,727,504 bytes | `32b413e89611574ccf1e832f868b2e694b51d4fd66c82ee4bd154c0ae14d71f5` |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` | 4,805,754 bytes | `bf87d3006ddf0fe3a6da2015ea4340280ba6ce875ad4cc14602f78476d8d214f` |

## Branding evidence

- Canonical raster: `docs/store-assets/sholatku-app-icon-512.png`, copied byte-for-byte from the developer-provided
  `.local/android/sholatku-final-icon.png` source; SHA-256 `da3c90d50ae7c97bd037d5a65b291a4f6c4c064997b5ad4fb173aba5ea236b8b`.
- Adaptive resources: `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`, each referencing separate
  PNG foreground, background, and monochrome resources derived from the supplied source mark.
- Legacy resources: `mipmap-mdpi` through `mipmap-xxxhdpi` `ic_launcher.png` and `ic_launcher_round.png` exports using
  the supplied rounded-square raster without a symbol redraw.
- Play Store export: `docs/store-assets/sholatku-app-icon-512.png`, 512x512, source-faithful, text-free artwork.
- Splash resources: the supplied crescent-star mark centered on dark teal for default, portrait, and landscape density
  variants.
- Android 12 emulator `emulator-5554`: install succeeded; App info displayed the final icon and `Sholatku` label; launch
  reached the Sholatku Home shell after the branded system splash.

## Verification evidence

- `npm test`: 42 files, 234 tests passed.
- `npm run lint`: passed with no ESLint warnings or errors.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: 41 passed, 1 skipped from 42.
- Mobile E2E against the already-built internal candidate: 1 passed.
- `npm run build:mobile:internal`: passed.
- `npm run verify:mobile-build`: passed.
- `npx cap sync android`: passed.
- Gradle `clean test assembleDebug assembleRelease bundleRelease`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run test:e2e:mobile`: 1 passed; the final internal candidate was then rebuilt and checked with direct mobile E2E.
- Debug APK `apksigner verify`: passed with Android v2 signing.
- Release APK `zipalign -c -P 16`: passed.
- Release APK `apksigner verify`: intentionally failed because it is unsigned.
- AAB `jarsigner -verify`: intentionally reported `jar is unsigned`.
- Merged release manifest: target SDK `36`; cleartext disabled; no exact alarm, battery-exemption, background-location,
  foreground-service, camera, microphone, contacts, phone, or SMS permission.
- Release AAB: no native `.so` entries found.
- Bundle secret scan: no private key or keystore/password material found outside documentation patterns.
- No launcher permission or unrelated Android permission was introduced by the branding changes.

## Manual blockers and next gate

- A developer-managed upload key and Play App Signing registration are still required before this AAB can be uploaded.
- The public privacy-policy URL, privacy/support contact, Play Console declarations, and final store metadata remain
  manual account/product inputs.
- The internal staging candidate must never be uploaded to Production or Open testing.
- Stop before starting the Internal Testing rollout until the developer explicitly approves that exact action.
