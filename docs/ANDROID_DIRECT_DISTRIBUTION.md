# Android Direct Distribution

## Current preview status

The current direct-distribution channel is an explicitly labeled **Direct Preview / Beta**. It is not a production or
stable release.

- Application ID: `io.github.arsyacoo.sholatku`
- App label: `Sholatku`
- Version: `0.2.2` (`versionCode=4`), Direct Preview 4 (`v0.2.2-preview.4`); earlier previews were `0.2.1` (`3`), `0.2.0` (`2`) and `0.1.0` (`1`)
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

The direct signing key has been created after the explicit approval boundary. It is stored outside the repository at
`C:\Users\arsya\.sholatku\signing\sholatku-direct.jks`, alias `sholatku-direct`. Its public certificate SHA-256 is
`35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`.

Back up `sholatku-direct.jks` in an encrypted offline location and store its password separately. Never upload the
keystore or password to GitHub, chat, or public cloud storage.

## Website and release labeling

The official website page is `/download`. It identifies the channel as **Direct Preview / Beta**, shows
`direct-preview`, identifies the staging backend, and keeps the download disabled until the GitHub Release is published.
It must not imply that the preview is production-ready.

The locally verified artifact is `dist/releases/sholatku-v0.1.0.apk` with SHA-256
`dfa487a98dead883d2ef4232c622c13bf1b8a7e55e4c21f5cb8110f35444fe13`. The matching checksum file is
`dist/releases/sholatku-v0.1.0.apk.sha256`. The APK is signed with the direct certificate above.

The planned public preview identity is explicit and must not be changed to stable or production semantics:

- Git tag: `v0.1.0-preview.1`
- GitHub Release title: `Sholatku v0.1.0 Preview 1`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.1.0`
- Android `versionCode`: `1`
- Preview asset URL: `https://github.com/Arsyacoo/Sholatku/releases/download/v0.1.0-preview.1/sholatku-latest.apk`

The GitHub Release must not be published without the separate approval `APPROVE GITHUB DIRECT RELEASE`. The preview
download page must use the explicit pre-release tag asset URL above, never `releases/latest/download/`.

## Safe installation and update model

The direct distribution model is manual:

1. Download the official APK from the Sholatku website or official GitHub Releases page.
2. Verify the published SHA-256 checksum.
3. Open the APK and allow installation only for the browser or file manager in use if Android asks.
4. Install Sholatku, then disable that source permission again when it is no longer needed.

Checksum verification helps detect transfer errors, but it does not by itself prove publisher identity. Do not ask users
to disable Play Protect or device security globally.

Direct distribution does not install updates automatically. Future updates require the same direct signing identity and
a higher `versionCode`.

### In-app update notice

Starting with the build after 0.2.0, the Android app checks GitHub Releases (`lib/platform/app-update.ts`) at most once
every 12 hours, plus on demand from Settings → "Cek pembaruan". When a newer release exists it shows a banner on the home
screen. From 0.2.3, "Perbarui" downloads the APK inside the app (`SholatkuUpdatePlugin`, into the app cache) and opens
the system installer, because Chrome's custom-tab view can leave APK downloads stuck at 100%. The first time, Android
opens "Install unknown apps" for Sholatku; the user allows it, returns, and taps again. The plugin only accepts URLs under
the repository's `releases/download/` path and rejects an APK whose package differs or whose `versionCode` is not
higher. `REQUEST_INSTALL_PACKAGES` is declared in `android/app/src/direct/AndroidManifest.xml` only. There is no silent
install: Android always asks the user to confirm, and keeps local data.

For the checker to see a release, every release must:

- use a tag `vMAJOR.MINOR.PATCH[-suffix]` whose version is higher than the previous `versionName` (bump `versionName`,
  not just the preview number), and set `versionName` in `android/app/build.gradle` to that same version;
- be published (not a draft) and attach the APK as `sholatku-latest.apk`;
- keep the direct signing certificate and a higher `versionCode`, or Android refuses the in-place update.

Users on 0.2.0 or earlier have no checker and must download the first build that includes it manually once.

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
