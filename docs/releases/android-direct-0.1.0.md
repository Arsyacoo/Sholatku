# Sholatku Android Direct Preview 0.1.0

Status: preparation only. This is a **Direct Preview / Beta**, not a production or stable release.

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

- APK filename: pending direct signing
- APK SHA-256: pending direct artifact
- Certificate SHA-256: pending direct key creation
- Checksum file: pending direct artifact
- Signature verification: pending direct artifact
- Install verification: pending direct artifact

The direct signing key is intentionally not created yet. Future direct APKs must use the same direct signing identity and
a higher `versionCode`. The Google Play upload key must not be reused automatically.

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

- Source commit: pending signed-artifact checkpoint
- GitHub tag: not created
- GitHub Release: draft not published
