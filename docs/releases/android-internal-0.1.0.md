# Android Internal Candidate 0.1.0

Status: **SIGNED INTERNAL TESTING CANDIDATE READY**. This is a local Google Play Internal Testing preparation record
only. No upload, publication, rollout, or account change was performed.

## Candidate identity

- Application ID: `io.github.arsyacoo.sholatku`
- `versionName`: `0.1.0`
- `versionCode`: `1`
- Build channel: `internal-staging`
- Backend: `https://sholatku-staging.vercel.app` (intentional internal-testing staging only)
- Source commit: `7c2794a` (`build(android): configure secure release signing`)
- Release metadata checkpoint commit: `5af73c5` (`docs(release): record signed internal checkpoint`)
- Branding: Sprint 07A.3.1 developer-provided crescent-star launcher system
- Candidate date: `2026-09-14` (`Asia/Jakarta`)
- Upload keystore: `C:\Users\arsya\.sholatku\signing\sholatku-upload.jks` (outside repository)
- Upload alias: `sholatku-upload`
- Upload certificate SHA-256: `31:BA:5F:BC:F9:A3:95:50:6D:1D:E8:28:1B:32:45:01:B5:B0:C3:3A:F8:B5:A9:A1:01:2A:90:77:A7:98:48:52`

## Artifacts

The internal AAB below is signed with the developer-managed upload key. Passwords remain outside the repository and are
provided to Gradle only through local environment variables or user-local Gradle properties.

| Artifact | Path | Size | SHA-256 |
| --- | --- | ---: | --- |
| Internal AAB | `android/app/build/outputs/bundle/release/app-release.aab` | 3,564,996 bytes | `65d385fff3f5522a3d0d53f98076fa19d50ec3000e98f20fe906474ed10979e8` |
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

- `npm test`: 42 files, 235 tests passed.
- `npm run lint`: passed with no ESLint warnings or errors.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: 41 passed, 1 skipped from 42.
- Mobile E2E against the already-built internal candidate: 1 passed.
- `npm run build:mobile:internal`: passed.
- `npm run verify:mobile-build`: passed.
- `npx cap sync android`: passed.
- Gradle `test`, `clean`, `assembleDebug`, and signed `bundleRelease`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run test:e2e:mobile`: 1 passed; the signed internal candidate was rebuilt afterward from source commit `7c2794a`.
- Debug APK `apksigner verify`: passed with Android v2 signing.
- Release APK `zipalign -c -P 16`: passed.
- Release APK `apksigner verify`: intentionally failed because it is unsigned.
- AAB `jarsigner -verify`: `jar verified`; the public signer certificate matches the upload keystore fingerprint above.
- AAB signing uses a self-signed developer upload certificate, so the local JDK reports an untrusted certificate-chain
  warning; this is expected until the certificate is registered with Google Play App Signing.
- AAB signature has no timestamp; repeat the signing step before the certificate expiry if a long-lived archive must be
  independently validated after `2054-01-30`.
- Merged release manifest: target SDK `36`; cleartext disabled; no exact alarm, battery-exemption, background-location,
  foreground-service, camera, microphone, contacts, phone, or SMS permission.
- Release AAB: no native `.so` entries found.
- Bundle secret scan: no private key or keystore/password material found outside documentation patterns.
- No launcher permission or unrelated Android permission was introduced by the branding changes.

## Manual blockers and next gate

- Play App Signing registration and the first manual Play Console upload remain required before this AAB can be used in
  Internal Testing.
- The public privacy-policy URL, privacy/support contact, Play Console declarations, and final store metadata remain
  manual account/product inputs.
- The internal staging candidate must never be uploaded to Production or Open testing.
- Stop before starting the Internal Testing rollout until the developer explicitly approves that exact action.
