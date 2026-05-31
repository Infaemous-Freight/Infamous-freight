<p align="center">
  <a href="https://infamousfreight.com" target="_blank" rel="noopener noreferrer">
    <img src="/docs/screenshots/infamousfreight-header.svg" alt="Infamous Freight" width="100%">
  </a>
</p>

# Launch Readiness Index

This is the entry point for production readiness, beta approval, paid launch approval, rollback, and operational recovery.

## Current Status

Ready for verification. Not approved for public launch until all critical checks pass with evidence.

Production web builds now keep bundled MVP/demo freight records disabled unless `VITE_ENABLE_DEMO_DATA=true` is set intentionally. Use that flag only for controlled demo environments, not live customer operations.

## Required Documents

| Document | Purpose |
|---|---|
| `docs/PRODUCTION_READINESS_VERIFICATION.md` | Main verification checklist, launch gates, severity rules, and sign-off requirements |
| `docs/PRODUCTION_DASHBOARD_REMAINING_WORK.md` | Remaining production dashboard, secret-management, Stripe webhook, and billing verification work after environment and billing hardening |
| `docs/LAUNCH_EVIDENCE_LOG.md` | Evidence log template for command output, dashboard checks, blocker notes, and final decision |
| `docs/launch-evidence/README.md` | Phase A evidence package workspace for screenshots, command output, deploy IDs, monitoring proof, and final launch decision artifacts |
| `docs/ROLLBACK_PLAN.md` | Rollback triggers and recovery process for API, web, database, billing, notifications, and support |
| `docs/PRODUCTION_TEST_DATA_PLAN.md` | Controlled production test accounts, freight records, documents, billing data, and cleanup rules |
| `docs/MVP_LAUNCH_DEMO_DATA_SET.md` | MVP launch demo data set for sales demos and smoke tests: sample customers, carriers, shipments, tracking events, quotes, and cleanup |
| `docs/STRIPE_WEBHOOK_VERIFICATION.md` | Stripe live/test mode verification, webhook edge cases, idempotency, refunds, and failed payments |
| `docs/ADMIN_RECOVERY_RUNBOOK.md` | Admin recovery procedures for users, roles, shipments, assignments, documents, billing, and notifications |
| `docs/BACKUP_RESTORE_VERIFICATION.md` | Backup configuration and restore proof procedure |
| `docs/NOTIFICATION_DELIVERABILITY_VERIFICATION.md` | Email, SMS, in-app, and support inbox deliverability checks |
| `docs/LAUNCH_BLOCKER_TEMPLATE.md` | Standard format for launch blockers, root cause, workaround, fix plan, and retest evidence |
| `docs/ADMIN_DASHBOARD_MVP_AUDIT.md` | Verification of admin/operator UI coverage for the MVP scope, with documented routes, gaps, and launch-gate impact |

## Execution Order

1. Assign launch owner, rollback owner, support owner, and technical owner.
2. Open `docs/LAUNCH_EVIDENCE_LOG.md` and fill in run metadata.
3. Create a dated file from `docs/launch-evidence/TEMPLATE.md` to collect screenshots, command output, Netlify deploy ID, Fly release ID, monitoring proof, and launch decision evidence.
4. Create test accounts and test records using `docs/PRODUCTION_TEST_DATA_PLAN.md`.
5. Execute `docs/PRODUCTION_READINESS_VERIFICATION.md` from Phase 0 through Phase 7.
6. Use the specialized runbooks when a phase references backup/restore, Stripe, admin recovery, or notifications.
7. Record every test result in the evidence log.
8. Open a blocker for every failed or unknown critical/high result using `docs/LAUNCH_BLOCKER_TEMPLATE.md`.
9. Approve only the highest launch gate supported by actual evidence.

Before any production launch gate is approved, confirm that pending Netlify database migrations have been reviewed and applied to the target database branch or intentionally reset and regenerated.

## Launch Gate Summary

| Gate | Minimum Requirement |
|---|---|
| Private Beta | Core system, auth, freight workflow, logs, basic security, backup existence, and rollback owner verified |
| Paid Beta | Private beta requirements plus Stripe live/test billing proof, webhook idempotency, invoice/receipt flow, support, and admin recovery |
| Public Launch | Paid beta requirements plus restore proof, no critical blockers, security review, real workflow proof, and owner sign-off |

## Hard Rule

Documentation does not equal readiness. A checkbox without evidence is an unknown result. Unknown critical or high-risk results block launch until verified.
