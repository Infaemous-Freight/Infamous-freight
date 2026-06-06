---
name: Platform Verification Blocker
about: Track a failed or unknown full-platform verification gate
title: "[Verification Blocker]: "
labels: verification, launch-readiness
assignees: ''
---

## Verification Area

Select one:

- [ ] Repository gates
- [ ] Environment/secrets
- [ ] Frontend/public web
- [ ] API/backend
- [ ] Database/migrations
- [ ] Backup/restore
- [ ] Public quote intake
- [ ] Public tracking
- [ ] Authenticated app route
- [ ] Billing/Stripe
- [ ] Fly.io runtime
- [ ] Netlify runtime
- [ ] Observability
- [ ] Security/access control
- [ ] Owner sign-off

## Severity

- [ ] Critical — blocks production launch
- [ ] High — blocks paid beta or live operations
- [ ] Medium — launch allowed only with documented workaround
- [ ] Low — cosmetic or non-blocking
- [ ] Unknown — must be treated as failed until verified

## Evidence Source

- Workflow run URL:
- Evidence artifact/file:
- Command or check:
- Timestamp UTC:
- Commit SHA:

## Expected Result

Describe what should have happened.

## Actual Result

Describe what happened. Do not paste secret values.

## Impact

Explain operational, customer, billing, security, or launch impact.

## Fix Plan

- [ ] Owner assigned
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Verification rerun
- [ ] Evidence log updated

## Notes

Never include API keys, database URLs, JWT secrets, Stripe secrets, or provider tokens in this issue.
