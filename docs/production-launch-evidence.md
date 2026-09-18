# Production launch evidence checklist

_Last verified: 2026-09-18 UTC._

This document is the operator-facing evidence log for approving Infamous Freight production launch readiness. Do not mark a gate complete from assumptions, local-only checks, or screenshots without matching production evidence.

## Current release identity

- Canonical production site: https://www.infamousfreight.com
- Netlify site ID: `d03682ba-fcb4-4dc6-984e-f7eae7fff59c`
- Current GitHub `main` launch-readiness commits include `6f23db1` and `91163f5`.
- Last verified Netlify production deployment remains commit `5ec0b815d41929d4af5f4208185ad6e81da62cc3` from 2026-06-03.
- Therefore the current production deployment does **not** yet prove the September launch-readiness code is live.

## Current decision

**END-TO-END PRODUCTION PROOF: BLOCKED**

The blocker is deployment identity. Production evidence collected against the June deployment cannot be used as proof for the current September release.

## Evidence standards

For each gate, record:
- date/time with timezone
- operator name
- production URL, workflow, or command used
- sanitized result summary
- artifact location, such as CI run URL, Stripe event ID, Fly release ID, or log reference
- follow-up issue or PR if failed

Never paste secrets, tokens, customer payment details, raw JWTs, full database URLs, private keys, or service-role keys into this document.

## Critical gates

| Gate | Required evidence | Status |
| --- | --- | --- |
| Repository validation | Frozen install, env safety checks, Prisma validation, typecheck, lint, test, and build pass on launch commit. | Pending |
| Production deployment identity | Netlify production deploy commit equals approved GitHub launch commit. | **BLOCKED** |
| Fly API health | Production Fly health/live/readiness checks pass. | Pending |
| Netlify web health | Canonical site returns expected HTTP response and canonical redirect behavior. | Pending |
| Same-origin API proxy | `www.infamousfreight.com/api/health` reaches the production API successfully. | Pending |
| Production DB migrations | Launch schema is confirmed current with no unsafe pending migration. | Pending |
| Public quote intake | Controlled quote request creates a production system-of-record record. | Pending |
| Tracking negative cases | Malformed/unknown tracking inputs return safe expected errors. | Pending |
| Tracking positive case | Known-safe tracking record returns sanitized production payload. | Pending |
| Registration/login/session | Controlled production user can authenticate and maintain session. | Pending |
| Tenant isolation | Cross-tenant access is denied. | Pending |
| Load creation | Controlled tenant creates a real load through the live path. | Pending |
| Carrier verification/assignment | Controlled carrier reaches approved assignment state from production records. | Pending |
| Dispatch workflow | Load progresses through auditable dispatch states without demo data. | Pending |
| Shipment/tracking workflow | Shipment events persist and public tracking reflects approved state. | Pending |
| Delivery/POD | Delivery completion and POD persist against the load. | Pending |
| Invoice | Invoice is generated from the real operational record. | Pending |
| Stripe Checkout | Eligible production payment flow starts in live Stripe mode. | Pending |
| Stripe webhook | Live signed webhook is verified, idempotently processed, and reconciled to backend state. | Pending |
| Revenue reconciliation | Payment, invoice, carrier payout/fee, and revenue records reconcile. | Pending |
| Audit trail | Operational and financial mutations are attributable and auditable. | Pending |
| Security headers | HSTS, CSP, and X-Frame-Options are present as required. | Pending |
| Secret exposure | No secrets are exposed in browser assets, logs, docs, or committed files. | Pending |
| Rollback | Known-good Netlify and Fly rollback targets are identified and restorable. | Pending |
| Genesis authorization boundary | Binding quote, booking, carrier, dispatch, compliance, and billing actions require the defined authorization path. | Pending |

## Launch rule

A green repository build, healthy API, or successful web deployment alone is not end-to-end production proof.

Full proof requires the controlled production money loop:

`shipper → quote → review → load → verified carrier → dispatch → tracking → delivery/POD → invoice → payment → revenue → audit`

Every financial mutation must be traceable. Every freight event must be auditable. Every AI binding action must be authorization-bounded.

## Deployment execution note

The connected Netlify deployment operation returned the site-specific deployment command, but this environment cannot execute that command against the repository network. A new production deploy therefore must be triggered by the repository's Netlify integration/CI or by an authenticated operator terminal.

Once a new deploy is published, re-run the production evidence bundle and replace this blocked status only after the deployed commit is verified.

## Existing verified Netlify deployment

- Deploy ID: `6a1ff804e5f8190008d78326`
- State: ready
- Commit: `5ec0b815d41929d4af5f4208185ad6e81da62cc3`
- Published: 2026-06-03
- Redirect rules: 16 processed without errors
- Header rules: 7 processed without errors
- Secret scan: 651 files scanned, 0 matches
- Netlify Forms: enabled

These facts validate the June deployment only; they do not establish current September production readiness.
