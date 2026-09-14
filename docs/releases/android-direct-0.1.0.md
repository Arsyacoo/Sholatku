# Sholatku Android Direct Preview 0.1.0

Status: signed local candidate. This is a **Direct Preview / Beta**, not a production or stable release. GitHub
publication remains approval-gated.

## Release metadata

- Version: `0.1.0`
- Version code: `1`
- Release type: `Direct Preview / Beta`
- Build channel: `direct-preview`
- Package ID: `io.github.arsyacoo.sholatku`
- App label: `Sholatku`
- Minimum Android version: Android 7.0 (`minSdkVersion=24`)
- Backend: `https://sholatku-staging.vercel.app` (staging only)

## Artifact status

- APK filename: `sholatku-v0.1.0.apk`
- Local APK path: `dist/releases/sholatku-v0.1.0.apk`
- APK size: `3,735,716` bytes
- APK SHA-256: `dfa487a98dead883d2ef4232c622c13bf1b8a7e55e4c21f5cb8110f35444fe13`
- Certificate SHA-256: `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`
- Checksum file: `dist/releases/sholatku-v0.1.0.apk.sha256`
- Signature verification: `apksigner` passed; certificate matches `sholatku-direct`
- Alignment verification: `zipalign` passed
- Install verification: clean install passed on a local Android API 36 AVD; update compatibility was not claimed because no previous direct-signed build was installed

The direct signing key is stored outside the repository. Future direct APKs must use the same direct signing identity
and a higher `versionCode`. The Google Play upload key must not be reused automatically.

## Known limitations

- This preview uses the staging backend and must not be presented as production.
- Prayer reminders remain best-effort and may be affected by Android or OEM battery management.
- Qibla accuracy depends on device sensors and calibration.
- Direct distribution does not provide automatic Play Store updates.

## Installation guidance

When the artifact is ready, download it only from the official Sholatku website or official GitHub Releases page, verify
the published SHA-256, and allow Install unknown apps only for the browser or file manager used. Do not disable Play
Protect or device security globally.

## Traceability

- Source commit: `01f491a`
- GitHub tag: not created
- GitHub Release: draft not published
