# Android Versioning

## Current candidate

- `versionName`: `0.2.6`
- `versionCode`: `8`
- Application ID: `io.github.arsyacoo.sholatku`

Published direct previews, none of whose codes may be reused: `0.1.0` / `1` (`v0.1.0-preview.1`), `0.2.0` / `2`
(`v0.2.0-preview.2`), `0.2.1` / `3` (`v0.2.1-preview.3`), `0.2.2` / `4` (`v0.2.2-preview.4`), `0.2.3` / `5`
(`v0.2.3-preview.5`), `0.2.4` / `6` (`v0.2.4-preview.6`) and `0.2.5` / `7` (`v0.2.5-preview.7`). `0.2.6` / `8` is
Direct Preview 8 (`v0.2.6-preview.8`); see `docs/releases/github-direct-preview-0.2.6.md`.

## Rules

- `versionCode` is a monotonically increasing integer for every future uploaded Play artifact.
- Increase `versionCode` for the next candidate only after the current candidate is intentionally superseded.
- `versionName` is the user-facing product version and may follow the product release convention.
- Never decrease or reuse an uploaded `versionCode`.
- Record each candidate's source commit, build channel, backend mode, artifact hash, and signing status.

## Update test

For a later candidate, build A and build B with consecutive codes, for example `1` then `2`. Install A, change local
preferences and save offline Quran data, then update to B. Verify preferences, favorites, bookmarks, last-read state,
offline data where schema-compatible, and reminder settings remain available. Do not simulate this by changing the current
candidate code without a concrete test build.
