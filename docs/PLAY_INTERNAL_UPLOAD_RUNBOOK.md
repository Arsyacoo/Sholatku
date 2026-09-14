# Internal Testing Upload Runbook

This document describes manual actions only. No Play Console action was executed by Sprint 07A.

## Prepare locally

1. Confirm `main` or the explicitly chosen release commit and review `git diff`.
2. Build the named internal candidate with `npm run build:mobile:internal`.
3. Run `npm run verify:mobile-build` and `npx cap sync android`.
4. Build `bundleRelease` from `android/`.
5. Confirm the AAB has the expected package, `versionCode`, `versionName`, `internal-staging` channel, staging endpoint,
   and no secrets.
6. Sign the AAB with the developer-managed upload key only after the key is securely configured.
7. Verify the signed artifact and record its public certificate fingerprint and SHA-256.

## Manual Play Console flow

1. Log into Play Console manually.
2. Select or create the Sholatku app only after verifying package identity `io.github.arsyacoo.sholatku`.
3. Confirm Play App Signing setup and upload-key registration.
4. Open Internal testing and configure the intended tester list without storing addresses in this repository.
5. Create a new internal release and upload the signed AAB.
6. Review `versionCode=1`, `versionName=0.1.0`, validation warnings, device compatibility, and release notes.
7. Confirm the Data Safety, privacy policy URL, ads, app access, target audience, and content rating declarations are
   ready for the account.
8. Save the release as a draft.
9. Stop before starting the Internal Testing rollout unless the developer explicitly approves that exact action.

## Safety boundaries

- Never upload the unsigned local AAB.
- Never upload a staging artifact to Production or Open testing.
- Do not accept legal agreements, change billing, change monetization, or publish automatically.
- Do not ask automation to handle passwords, private keys, or Google account credentials.
