# Sholatku Privacy Policy

Last updated: 9 September 2026

This policy describes the current Sholatku web and Android implementation. It is an evidence-based product draft, not
legal advice. The official developer identity and privacy contact must be filled in before a public Google Play listing.

## Summary

Sholatku has no user accounts. Core preferences and offline content are stored locally. Online features send the minimum
request data needed to calculate prayer times, find a location, load Quran data, or play Quran audio.

## Stored locally

The app stores data in browser local storage and IndexedDB, including:

- selected city, latitude, longitude, timezone, and auto-detection state;
- calculation method, madhab, minute adjustments, theme, time format, and reminder preferences;
- Ramadan preferences;
- Quran last-read state, favorites, bookmarks, display preferences, and audio preferences;
- cached prayer schedules and selected Quran surahs/search indexes for offline use.

The app does not create an account or associate these values with a named person.

## Sent to servers and providers

- Prayer requests may send date, latitude, longitude, timezone, calculation method, madhab, and adjustments to the
  Sholatku BFF. If the local BFF request fails, the current prayer implementation can call AlAdhan directly as a
  fallback.
- Location search and reverse geocoding may send a search query or coordinates to Nominatim OpenStreetMap when curated
  local city data is not enough.
- Quran detail and online search requests go through the Sholatku BFF. The BFF currently reads from the Quran providers
  used by the API routes.
- Quran audio is fetched from the HTTPS URL returned by the Quran data or the app fallback source.
- Network services may receive normal connection metadata such as IP address, request time, and user agent. Sholatku
  does not use these values to create an account profile.

## Location

Users can choose a city manually. Automatic detection uses browser/WebView geolocation only after the user invokes that
feature. The app does not request background location permission. Coordinates are used for prayer times and Qibla and
may be sent to the services listed above when online features are used.

## Notifications and audio

Prayer reminders are local device notifications. Sholatku does not use a push notification service. Audio is played when
the user selects playback; the app does not record microphone input.

## Analytics, advertising, and payments

The current implementation does not include analytics, crash-reporting, advertising, payment, or account SDKs. This must
be reviewed again if dependencies or product services change.

## Retention and deletion

Local data remains until the user removes Quran offline data, clears app/browser data, or uninstalls the app. There is no
central account data and therefore no account deletion flow. Server/provider logs and caching follow the relevant service
operator's policies and are outside the local app's control.

## Security

The Android shell uses a bundled UI and HTTPS API configuration. The release manifest explicitly disables clear-text HTTP.
No security measure can guarantee protection against every device, browser, or provider risk.

## Children

Sholatku is not designed specifically for children and does not knowingly collect children's personal information. The
Google Play target-audience declaration remains a manual release gate.

## Changes and contact

This policy may change when the implementation or providers change.

**Privacy contact: TODO - insert the official developer privacy email before Play listing.**
