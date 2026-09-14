# Sholatku v0.1.0 - Direct Preview / Beta

> Draft only. Do not publish this GitHub Release until the signed artifact is verified and
> `APPROVE GITHUB DIRECT RELEASE` is received.

Initial Android **Direct Preview / Beta** release for testing only. This is not a production or stable release.

## Highlights

- Prayer schedules
- Quran reading
- Quran audio
- Qibla
- Monthly prayer schedule
- Ramadan information
- Offline Quran support
- Best-effort prayer reminders

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation

Download `sholatku-v0.1.0.apk` only from the official Sholatku website or this official GitHub Release when published.
Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `dfa487a98dead883d2ef4232c622c13bf1b8a7e55e4c21f5cb8110f35444fe13`

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Prayer
reminders are best-effort and may be affected by Android or OEM battery management. Qibla accuracy depends on device
sensors and calibration. Direct updates require the same signing identity and a higher `versionCode`.
