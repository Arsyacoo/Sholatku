# Android Direct Distribution

## Current preview status

The current direct-distribution channel is an explicitly labeled **Direct Preview / Beta**. It is not a production or
stable release.

- Application ID: `io.github.arsyacoo.sholatku`
- App label: `Sholatku`
- Version: `0.1.0` (`versionCode=1`)
- Minimum Android version: Android 7.0 (`minSdkVersion=24`)
- Build mode: `npm run build:mobile:direct`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Production backend: intentionally not used by this preview

The direct preview mode accepts only the documented staging host. The existing `mobile-production` mode remains
fail-closed when no non-staging production BFF/API URL is supplied, and it continues to reject the staging host.

## Signing separation

The Google Play upload identity and the direct-distribution identity are separate:

- Play AAB uploads use the existing `sholatku-upload.jks` through user-local Gradle properties or environment variables.
- Direct APKs will use `sholatku-direct.jks` through `SHOLATKU_DIRECT_*` user-local properties or environment variables.
- The direct keystore must stay outside the repository and must never be uploaded, committed, or shared publicly.
- Direct APK updates must use the same direct certificate and a higher `versionCode`.

The direct signing key has not been created yet. Its creation requires the explicit approval boundary
`APPROVE DIRECT DISTRIBUTION KEY CREATION`.

## Website and release labeling

The official website page is `/download`. It currently identifies the channel as **Direct Preview / Beta**, shows
`direct-preview`, identifies the staging backend, and keeps the download disabled until a signed artifact exists. It
must not imply that the preview is production-ready.

The future GitHub Release must use equivalent Preview / Beta wording and must not be published without the separate
approval `APPROVE GITHUB DIRECT RELEASE`.

## Safe installation and update model

The direct distribution model is manual:

1. Download the official APK from the Sholatku website or official GitHub Releases page.
2. Verify the published SHA-256 checksum.
3. Open the APK and allow installation only for the browser or file manager in use if Android asks.
4. Install Sholatku, then disable that source permission again when it is no longer needed.

Checksum verification helps detect transfer errors, but it does not by itself prove publisher identity. Do not ask users
to disable Play Protect or device security globally.

Direct distribution does not install updates automatically. Future updates require the same direct signing identity and
a higher `versionCode`. No automatic APK installer or background update checker is part of this sprint.

## Future Android Developer Verification

Android's official rollout information is time-sensitive. As of September 2026, Android documents that developer
verification protections begin on **September 30, 2026** for installations from participating app stores on certified
Android devices in Brazil, Indonesia, Singapore, and Thailand, with broader rollout planned for 2027. The official
guidance describes full distribution for developers distributing through channels such as their own website, and a
separate limited-distribution path for small, trusted device groups.

Before the first public direct release, verify the current registration, identity, package-name, and distribution
requirements in the official documentation:

- [Android developer verification](https://developer.android.com/developer-verification)
- [Android developer verification guides](https://developer.android.com/developer-verification/guides)
- [Limited distribution](https://developer.android.com/developer-verification/guides/limited-distribution)
- [Full distribution](https://developer.android.com/developer-verification/guides/full-distribution)

This note does not claim that a current registration has been completed. The preview remains a normal signed APK
preparation flow and does not add permissions or weaken Android security.

## Security boundaries

- No exact alarm permission is added.
- No battery optimization exemption is requested.
- No new Android permission, analytics, advertising, or tracking SDK is added.
- The visible Android app label remains `Sholatku`.
- The Capacitor shell remains local; no remote `server.url` wrapper is introduced.
