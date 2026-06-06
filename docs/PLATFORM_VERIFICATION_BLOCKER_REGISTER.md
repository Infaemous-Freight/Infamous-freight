# Platform Verification Blocker Register

Use this register while GitHub Issues are disabled. When Issues are enabled, convert each open blocker into an issue using `.github/ISSUE_TEMPLATE/platform-verification-blocker.md`.

## Status Legend

| Status | Meaning |
| --- | --- |
| Open | Not yet verified or fixed. |
| Blocked | Requires provider access, owner action, or secret-backed environment. |
| In Progress | Fix or verification is underway. |
| Closed | Evidence exists and has been reviewed. |

## Blockers

| ID | Severity | Area | Status | Owner | Required Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| PV-001 | High | GitHub repo settings | Blocked | Owner | GitHub Issues enabled in repo settings | Required before automated issue tracking can be used. |
| PV-002 | Critical | Database | Blocked | Owner/operator | Production Prisma migration status, no failed migrations, DB reachable | Requires production `DATABASE_URL` in secure operator environment. |
| PV-003 | Critical | Backup/restore | Blocked | Owner/operator | Production backup completed and restore tested outside production | Do not expose database URL or dump contents. |
| PV-004 | Critical | Billing/Stripe | Blocked | Owner/operator | Live checkout, webhook delivery, customer portal, payment failure behavior verified | Run only during approved live billing verification window. |
| PV-005 | High | Fly.io runtime | Blocked | Owner/operator | `flyctl status`, checks, logs, and health endpoints verified | Requires Fly authentication. |
| PV-006 | High | Netlify runtime | Blocked | Owner/operator | Production env, deploy status, preview access, and MFA policy verified | Requires Netlify dashboard access. |
| PV-007 | High | Public quote intake | Open | Owner/operator | Live quote request submitted, stored/routed, confirmation verified | Must use safe test data. |
| PV-008 | High | Public tracking | Open | Owner/operator | Known-safe positive tracking lookup returns public-safe payload | Requires safe tracking record, no private data. |
| PV-009 | High | Live operations routes | Open | Engineering | `/quotes`, `/loads`, `/dispatch`, `/carriers`, `/analytics` verified live or clearly gated | Current route-readiness marks key routes demo-backed. |
| PV-010 | Medium | Genesis AI | Open | Engineering | Quote assist remains review-only; recommendations logged; human approval required | Do not allow autonomous dispatch actions. |
| PV-011 | High | Observability | Blocked | Owner/operator | Sentry/logging/alerts verified in provider dashboards | Requires provider access. |
| PV-012 | Critical | Owner sign-off | Open | Owner | Go/no-go, rollback owner, and residual risk acceptance recorded | Final approval cannot be automated. |

## Closeout Process

For each blocker:

1. Run the relevant verification command or provider check.
2. Save evidence under `docs/evidence/` or in the GitHub Actions artifact.
3. Update `docs/LAUNCH_EVIDENCE_LOG.md`.
4. Change this register status.
5. Convert to GitHub Issue when Issues are enabled.

## Safety Notes

- Never paste secret values.
- Use secret names only.
- Do not include customer private data in screenshots or artifacts.
- Do not mark a demo-backed route live without code and evidence updates.
