# Android Signing Setup

Status: instructions only. No keystore was created, inspected, or committed by Sprint 06.

## Recommended release model

Use an Android App Bundle with Google Play App Signing and a separate upload key. Keep the upload keystore and passwords
outside the repository, preferably in a password manager or CI secret store. The upload key is not the Play app-signing key.

## Safe manual setup

1. In the developer's secure environment, create or obtain an upload key according to the current Google Play guidance.
2. Store only local/CI references in Gradle properties. Never put a password, private key, base64 key, or keystore file in
   tracked files.
3. Configure the release signing config only when the developer explicitly approves the key location and secret handling.
4. Verify the signed AAB locally before any manual Play Console upload.
5. Back up the upload key securely and document the recovery owner.

Suggested local-only property names are `SHOLATKU_UPLOAD_STORE_FILE`, `SHOLATKU_UPLOAD_STORE_PASSWORD`,
`SHOLATKU_UPLOAD_KEY_ALIAS`, and `SHOLATKU_UPLOAD_KEY_PASSWORD`. Do not place their values in this document or in the
repository.

The repository ignores `*.jks` and `*.keystore`. The current Sprint 06 release artifact is therefore unsigned unless the
developer later configures signing locally.
