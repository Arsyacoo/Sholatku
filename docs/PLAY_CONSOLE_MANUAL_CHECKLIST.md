# Play Console Manual Checklist

No item in this checklist was executed automatically.

## Account and identity

- [ ] Verify developer account type and creation date.
- [ ] Complete any required identity, contact, and payment-profile steps manually.
- [ ] Do not share account passwords with automation.

## App content and policy

- [ ] Host the final Privacy Policy at a public HTTPS URL.
- [ ] Ensure the in-app `/privacy` page and hosted policy agree.
- [ ] Complete Data Safety from the evidence draft and current provider contracts.
- [ ] Complete Target Audience and Content Rating questionnaires.
- [ ] Declare ads, app access, category, and content accurately.

## Artifact and testing

- [ ] Configure Play App Signing and a secure upload key.
- [ ] Use `docs/PLAY_INTERNAL_UPLOAD_RUNBOOK.md` and upload only a signed `internal-staging` AAB.
- [ ] Build and verify a signed release AAB locally.
- [ ] Complete physical/cloud real-device notification, audio, offline, Qibla, and lock-screen matrix.
- [ ] Complete internal or closed testing track manually.
- [ ] Review staged rollout and production safeguards before any future publish decision.
- [ ] Stop before starting Internal Testing rollout unless explicitly approved for that exact action.
