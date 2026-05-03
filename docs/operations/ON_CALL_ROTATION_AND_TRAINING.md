# On-Call Rotation and Launch Training

## Purpose

This schedule establishes minimum launch coverage for production incidents, security scan failures, and smoke-test failures.

## Launch coverage model

| Coverage window | Primary | Secondary | Escalation | Notes |
|---|---|---|---|---|
| Launch week | TBD | TBD | Founder/operator | Fill before public traffic increase |
| Week 2 | TBD | TBD | Founder/operator | Rotate primary/secondary weekly |
| Week 3 | TBD | TBD | Founder/operator | Review alert volume before extending |
| Week 4 | TBD | TBD | Founder/operator | Convert to monthly schedule after launch stabilization |

## On-call responsibilities

- Monitor scheduled security and production smoke workflows.
- Respond to failed production checks.
- Triage Dependabot/security PRs that include high-severity updates.
- Run the incident response flow for SEV-1 and SEV-2 events.
- Record evidence in the launch evidence log or linked incident issue.

## Escalation path

1. Primary responder acknowledges and triages.
2. Secondary responder joins if the issue is SEV-1, security-related, customer-facing, or unresolved after the first investigation pass.
3. Founder/operator joins for launch gate decisions, customer communications, credential rotation, vendor dashboard access, or rollback approval.

## Training checklist

- [ ] Walk through the incident response runbook.
- [ ] Confirm who can access GitHub Actions, Netlify, Fly.io, Supabase, Stripe, and Sentry.
- [ ] Run a manual production smoke monitor workflow.
- [ ] Review how to read ZAP baseline results and dependency review output.
- [ ] Practice rollback decision-making from the latest known-good deploy.
- [ ] Confirm secrets-handling rules: no secret values in issues, comments, logs, screenshots, or chat.
- [ ] Assign primary and secondary on-call responders for launch week.

## Weekly review

During launch stabilization, review:

- Failed checks and time to acknowledge.
- False positives from ZAP or dependency audits.
- Incidents opened and resolved.
- Unowned launch blockers.
- Any accepted security risk past its expiry date.
