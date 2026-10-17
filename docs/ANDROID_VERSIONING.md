# Android Versioning

## Current candidate

- `versionName`: `0.2.0`
- `versionCode`: `2`
- Application ID: `io.github.arsyacoo.sholatku`

`versionCode 1` (`0.1.0`) shipped publicly as GitHub Pre-release `v0.1.0-preview.1`, so it is superseded and must never
be reused. `0.2.0` / `2` is Direct Preview 2 (`v0.2.0-preview.2`); see `docs/releases/github-direct-preview-0.2.0.md`.

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
