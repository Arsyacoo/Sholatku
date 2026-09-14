# Google Play Data Safety Draft

Status: draft only. Do not submit this document as the Play Console form without confirming the current implementation,
provider contracts, and developer declarations.

Evidence reviewed: `lib/storage/preferences.ts`, `lib/storage/quran-preferences.ts`, `lib/storage/quran-db.ts`,
`lib/prayer/api.ts`, `lib/location/geocoding.ts`, `app/api/*`, `hooks/useLocation.ts`, and the native reminder bridge.

## Working answers

| Play data area | Collected off-device? | Shared with third party? | Optional? | Purpose | Retention/deletion | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| Precise location | Yes, when online prayer/location features are used | Yes, BFF/provider path must be confirmed | Optional for manual city selection | Prayer times, Qibla, geocoding | Local values clear with app data; provider retention to verify | MANUAL CONFIRMATION REQUIRED |
| App activity / search queries | Conditional: online Quran search query is transmitted | Provider path through BFF | Optional | Quran search | Provider retention to verify | MANUAL CONFIRMATION REQUIRED |
| App settings and preferences | No central transmission observed | No | Optional | Local personalization and reminders | Clear app data/uninstall | READY |
| Quran offline content and bookmarks | No central transmission observed | No | Optional | Offline reading and navigation | User can remove offline Quran cache; app data clears the rest | READY |
| Audio playback request | Conditional: audio provider receives a media request | Yes, audio provider | Optional | Murottal playback | Provider retention to verify | MANUAL CONFIRMATION REQUIRED |
| Device IDs | No SDK or app code observed | No | N/A | No purpose | N/A | READY, subject to final dependency audit |
| Diagnostics | No app diagnostics collection observed | No | N/A | No purpose | Runtime logs are not a user-data store | READY, subject to hosting review |

## Form decisions to verify manually

- Declare whether precise location and search interactions are considered collected/shared under the final BFF/provider
  contracts. This draft intentionally stays conservative because provider-side retention is not controlled by the app.
- Confirm encryption in transit for every final production endpoint and audio host. Current checked URLs are HTTPS.
- Confirm whether any production hosting logs, CDN logs, or operational monitoring associate request data with an
  identifier. No such SDK is present in the repository, but server configuration is outside this codebase.
- Confirm the deletion statement and privacy policy URL after the official privacy contact and canonical URL exist.
- Confirm the exact Data Safety category mapping in the current Play form before submission; this draft is not a submitted
  declaration.

## Not observed

No account registration, contacts, phone state, camera, microphone recording, SMS, advertising ID, analytics, crash
reporting, or payment collection was found in the audited source/dependencies.
