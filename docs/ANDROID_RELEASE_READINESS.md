# Android Release Readiness

Sprint: 07A / 07A.1 / 07A.3.1
Status: internal-testing candidate preparation and final provided-icon branding complete with signing and Play Console gates
remaining.

## Verified in this repository

- Application ID and namespace: `io.github.arsyacoo.sholatku`.
- App label: `Sholatku`.
- `minSdkVersion=24`, `compileSdk=36`, `targetSdk=36`.
- Version: `versionCode=1`, `versionName=0.1.0`; future version codes must only increase.
- Capacitor `8.5.1`, Android Gradle Plugin `8.13.0`, Gradle wrapper `8.14.3`, Java 21 compatibility.
- Static bundled UI remains the Capacitor shell; no permanent `server.url` is configured.
- Android production build mode rejects a missing API URL and the known staging host. The named
  `npm run build:mobile:internal` mode intentionally uses `https://sholatku-staging.vercel.app` and embeds the
  `internal-staging` build channel. The generic mobile/staging mode remains available for existing QA.
- Android manifest explicitly disables clear-text HTTP. The source manifest explicitly removes exact-alarm entries if a
  plugin contributes them; the merged release contains no exact alarm, background location,
  battery-exemption, foreground-service, camera, microphone, contacts, phone, or SMS permission.
- CORS remains restricted to the Capacitor Android origin `https://localhost`; arbitrary browser origins are denied by
  the existing API tests.
- Merged release permissions are `INTERNET`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, and `POST_NOTIFICATIONS`, plus the
  app-internal dynamic receiver signature permission. No exact alarm permission is merged.
- Merged release components are the exported launcher `MainActivity` and the system-protected exported AndroidX profile
  receiver; the Sholatku recovery receiver, FileProvider, local-notification provider, startup provider, and local
  notification receivers are not externally exported. The profile receiver is protected by `android.permission.DUMP`.
- Privacy Policy is available locally at `/privacy` and linked from Settings and the footer.
- Adaptive launcher resources and portrait/landscape splash resources are present; no placeholder asset was found in the
  audited resource tree.
- Final Sholatku launcher branding is implemented from the developer-provided raster source recorded at
  `docs/store-assets/sholatku-app-icon-512.png` (SHA-256 `da3c90d50ae7c97bd037d5a65b291a4f6c4c064997b5ad4fb173aba5ea236b8b`):
  crescent-star adaptive foreground, dark teal adaptive background, round adaptive alias, Android monochrome layer,
  density-specific legacy PNGs, and a source-faithful 512x512 Play Store PNG. The visible launcher label remains
  `Sholatku`.
- Android 12 emulator install/launch QA showed the branded icon in App info and the branded system splash before the
  Sholatku shell loaded. The monochrome resource is compiled and referenced; a separate themed-launcher preview was not
  available from the local emulator configuration.
- No analytics, ads, payment, account, Firebase, Crashlytics, or Sentry SDK was observed in the audited dependency/runtime
  source.
- The current release artifact is rebuilt by Sprint 07A.3.1's explicit internal mode and is recorded in
  `docs/releases/android-internal-0.1.0.md`; it is unsigned because no upload key exists or was created.
- No `.so` entries were found in the release AAB or APK. The current Capacitor/WebView artifact has no packaged native
  shared-library ABI inventory to verify.
- Signing material was not generated or exposed. Keystore patterns are ignored by Git.

## Sprint 07A preparation

- Version remains `versionCode=1`, `versionName=0.1.0`; no Play upload history is available, so the code was not
  incremented merely for local builds.
- Upload-key signing classification: no upload-key signing setup exists yet. Explicit developer approval is required
  before local key generation.
- Internal release notes, tester plan, feedback template, update-path checklist, pre-launch checklist, and manual upload
  runbook are prepared in `docs/`.

## Manual or environment-dependent gates

- [BLOCKER] Final production BFF/API endpoint is not defined. Do not use the staging endpoint as a production release.
- [BLOCKER] Official developer identity, privacy contact, and public privacy-policy URL are not yet supplied.
- [BLOCKER] Upload key / Play App Signing configuration is not present; the release bundle must be signed manually later.
- [BLOCKER] The public HTTPS Privacy Policy URL and official privacy/support contact are not supplied.
- [MANUAL] `minifyEnabled=false` remains a deliberate conservative release choice; evaluate R8/shrinkResources in a later
  optimization sprint with a full regression pass.
- [MANUAL] Data Safety, target audience, content rating, ads, app access, category, store assets, and provider terms.
- [MANUAL] Physical/cloud real-device QA is partial; emulator evidence does not close this gate.
- [MANUAL] Qibla compass calibration, OEM lock-screen/background delivery, and final notification confidence.

## Scope protection

Sprint 04 reminder recovery logic was not modified. Exact alarm permissions and battery optimization exemptions were not
added. No Play Console publication, production upload, account billing, signing-secret creation, or Git push was performed.
