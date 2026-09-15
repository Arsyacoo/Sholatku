# Sholatku Android Direct Preview 0.1.0 Real-Device Smoke Test

Status: **BLOCKED - real-device application smoke tests were not reached.** Public release and artifact integrity
validation passed. BrowserStack Free Trial real-device time was exhausted before a live Android device became available.

## Release identity

- Test date: 2026-09-15, Asia/Jakarta
- Public release: https://github.com/Arsyacoo/Sholatku/releases/tag/v0.1.0-preview.1
- Tag: `v0.1.0-preview.1`
- Source/tag commit: `974c519f9ae293e8b19dfba545d7e0f2f2887531`
- Release type: GitHub Pre-release
- Channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Package: `io.github.arsyacoo.sholatku`
- Version: `0.1.0` (`versionCode=1`)
- Public APK: https://github.com/Arsyacoo/Sholatku/releases/download/v0.1.0-preview.1/sholatku-v0.1.0.apk
- Public APK alias: https://github.com/Arsyacoo/Sholatku/releases/download/v0.1.0-preview.1/sholatku-latest.apk
- Public checksum: https://github.com/Arsyacoo/Sholatku/releases/download/v0.1.0-preview.1/sholatku-v0.1.0.apk.sha256
- APK SHA-256: `dfa487a98dead883d2ef4232c622c13bf1b8a7e55e4c21f5cb8110f35444fe13`
- Direct certificate SHA-256: `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Public release and artifact integrity

| Check | Result | Evidence |
| --- | --- | --- |
| GitHub release exists | PASS | Title `Sholatku v0.1.0 Preview 1`, tag `v0.1.0-preview.1` |
| Release classification | PASS | `isDraft=false`, `isPrerelease=true`; release text remains Preview/Beta and staging-only |
| Published assets | PASS | Exactly `sholatku-v0.1.0.apk`, `sholatku-latest.apk`, and `sholatku-v0.1.0.apk.sha256` |
| Public APK download | PASS | All three assets freshly downloaded from the GitHub release URLs |
| Versioned APK SHA-256 | PASS | Matches the recorded expected SHA-256 |
| Latest APK SHA-256 | PASS | Matches the recorded expected SHA-256 |
| APK byte identity | PASS | Versioned and latest APK bytes are identical |
| Checksum contents | PASS | References `sholatku-v0.1.0.apk` with the expected hash |
| APK signature | PASS | `apksigner verify` passed using v2 signing |
| Certificate | PASS | APK signer digest matches the recorded direct certificate |
| Package and version | PASS | `io.github.arsyacoo.sholatku`, `versionName=0.1.0`, `versionCode=1` |

## Permission audit

The downloaded public APK requests only:

- `android.permission.INTERNET`
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.RECEIVE_BOOT_COMPLETED`
- `android.permission.WAKE_LOCK`
- `io.github.arsyacoo.sholatku.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`

The public APK does not request `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`,
`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, background location, foreground service, camera, record audio, contacts,
phone, or SMS permissions.

## Real-device matrix

| Device | Android | Type | Install path | Result |
| --- | --- | --- | --- | --- |
| Google Pixel 7 | Android 13 | BrowserStack cloud real device | Public GitHub APK URL uploaded to BrowserStack | BLOCKED before live device UI; session returned to dashboard and device became unavailable |
| Google Pixel 8 Pro | Android 14 | BrowserStack cloud real device | Public GitHub APK URL selected in BrowserStack | BLOCKED; BrowserStack reported Free Trial time exhausted before a live device UI was available |

BrowserStack did not provide browser-download/package-installer evidence. Uploading the exact public GitHub APK URL was
prepared only to validate application behavior on a real cloud device; it does not substitute for browser-download
installation UX.

## Smoke results

| Area | Result | Notes |
| --- | --- | --- |
| Clean install | NOT RUN | No live cloud device became available |
| First launch and visual smoke | NOT RUN | No live cloud device became available |
| Home and monthly schedule | NOT RUN | No live cloud device became available |
| Quran reading, favorites, bookmarks, Last Read | NOT RUN | No live cloud device became available |
| Restart persistence | NOT RUN | No live cloud device became available |
| Offline Quran and network transitions | NOT RUN | No live cloud device became available |
| Audio and Media Session | NOT RUN | No live cloud device became available |
| Qibla and real magnetometer | PENDING | Cloud session unavailable; cloud magnetometer would not establish real-world sensor confidence |
| Ramadan, Settings, Privacy | NOT RUN | No live cloud device became available |
| Notification permission and reminder smoke | NOT RUN | No live cloud device became available |
| Background/foreground and process recreation | NOT RUN | No live cloud device became available |
| Reboot smoke | NOT RUN | No live cloud device became available |
| Uninstall/reinstall | NOT RUN | No live cloud device became available |
| Update compatibility | PENDING | Preview 1 is the first public direct-signed release; Preview 1 to Preview 2 update testing requires a later higher `versionCode` release |

## Issues and limitations

- No product defect was observed because no app surface was reached on a real device.
- Environment limitation: BrowserStack Free Trial time was exhausted. No billing action, upgrade, or security bypass was attempted.
- No physical Android device was connected through ADB.
- No screenshots were retained or committed because the real-device application surface was not reached.

## Remaining gates

- Run the clean-install and core smoke matrix on a physical Android phone or an active real cloud-device session.
- Validate Android 13+ notification permission grant and denial paths without exact alarms.
- Validate local Quran state, restart persistence, offline Quran behavior, and lifecycle flows on a real device.
- Mark Qibla real-world magnetometer validation pending until tested on physical hardware with usable sensors.
- Validate Preview 1 to a higher-versionCode Preview 2 update and local-data preservation when such a release exists.

## Conclusion

`ANDROID SPRINT 07B.1 - PUBLIC ARTIFACT VALIDATION PASSED; REAL-DEVICE SMOKE BLOCKED BY CLOUD DEVICE ACCESS`

No source, APK, release, tag, signing material, or published asset was modified. No automatic push occurred.
