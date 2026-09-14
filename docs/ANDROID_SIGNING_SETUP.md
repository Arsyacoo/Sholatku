# Android Signing Setup

Status: signed Internal Testing candidate rebuilt from source commit `7c2794a` and verified; Play Console registration/upload
remains manual and awaits explicit upload approval.

## Recommended release model

Use an Android App Bundle with Google Play App Signing and a separate upload key. Keep the upload keystore and passwords
outside the repository, preferably in a password manager or CI secret store. The upload key is not the Play app-signing key.

The local developer-managed upload keystore is stored at `C:\Users\arsya\.sholatku\signing\sholatku-upload.jks` with
alias `sholatku-upload`. This path is outside the repository and the keystore file is ignored by Git. Its public
certificate has SHA-256 fingerprint `31:BA:5F:BC:F9:A3:95:50:6D:1D:E8:28:1B:32:45:01:B5:B0:C3:3A:F8:B5:A9:A1:01:2A:90:77:A7:98:48:52`.

The verified internal candidate is `android/app/build/outputs/bundle/release/app-release.aab`, version `0.1.0`
(`versionCode=1`), channel `internal-staging`, backend `https://sholatku-staging.vercel.app`, size 3,564,996 bytes,
SHA-256 `65d385fff3f5522a3d0d53f98076fa19d50ec3000e98f20fe906474ed10979e8`. The AAB signature was verified and its
public signer certificate matches the fingerprint above.

## Safe manual setup

1. Create or obtain the upload key in the developer's secure environment according to the current Google Play guidance.
2. Store only local/CI references in Gradle properties. Never put a password, private key, base64 key, or keystore file in
   tracked files.
3. Configure the release signing config using the four `SHOLATKU_UPLOAD_*` properties only after the developer explicitly
   approves the key location and secret handling.
4. Verify the signed AAB locally before any manual Play Console upload.
5. Back up the upload key securely and document the recovery owner.

Suggested local-only property names are `SHOLATKU_UPLOAD_STORE_FILE`, `SHOLATKU_UPLOAD_STORE_PASSWORD`,
`SHOLATKU_UPLOAD_KEY_ALIAS`, and `SHOLATKU_UPLOAD_KEY_PASSWORD`. Do not place their values in this document or in the
repository.

The repository ignores `*.jks` and `*.keystore`. `android/app/build.gradle` keeps debug signing unchanged, reads release
signing only from environment variables or user-local Gradle properties, and fails `assembleRelease`/`bundleRelease`
clearly when the four properties are missing. The local build helper uses an interactive password prompt and temporary
environment variables, then clears them after Gradle exits.
