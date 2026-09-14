# Android Versioning

## Current candidate

- `versionName`: `0.1.0`
- `versionCode`: `1`
- Application ID: `io.github.arsyacoo.sholatku`

This is the first local Internal Testing candidate. No existing Play Console upload history is available in the
repository, so `versionCode` remains `1`. Local rebuilds do not require a version increment.

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
