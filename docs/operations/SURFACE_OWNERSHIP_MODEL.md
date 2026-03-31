# Surface Ownership Model

## Goal
Create explicit ownership and operational responsibilities across API, web, mobile, and shared packages to reduce cross-team drift and improve release quality.

## Ownership Matrix

| Surface | Primary Owner | Backup Owner | On-call Rotation | Release Cadence |
|---|---|---|---|---|
| `apps/api` | Platform Backend | Staff Backend | Weekly backend rota | Twice weekly |
| `apps/web` | Product Frontend | Design Engineer | Weekly frontend rota | Weekly |
| `apps/mobile` | Mobile Team | Platform Backend | Weekly mobile rota | Biweekly |
| `packages/shared` | Platform Architecture | Backend + Frontend leads | N/A | With dependent release |

## Responsibilities by Surface

### API (`apps/api`)
- Tenant isolation guarantees and auth boundary correctness
- Schema migrations and backwards compatibility windows
- SLA/SLO ownership for API latency and error budgets
- Production incident commander for API-impacting events

### Web (`apps/web`)
- Dispatcher/operator workflow UX quality
- Accessibility and locale parity for supported languages
- Feature flag rollout and rollback playbooks
- Frontend telemetry completeness for critical funnels

### Mobile (`apps/mobile`)
- Offline sync correctness and background-task reliability
- Push notification delivery and actionable deep links
- Device capability support matrix (biometrics/camera/location)
- Field-release quality gates and phased rollout controls

### Shared (`packages/shared`)
- Contract schemas and backward compatibility
- Type safety standards and serialization guarantees
- Versioning policy and release notes for breaking changes

## Delivery and Incident Rules
- Every roadmap item must map to one **single accountable owner**.
- Cross-surface changes require a release coordinator.
- P1 incidents designate one incident commander and one comms owner.
- Postmortems are required for all Sev1/Sev2 incidents and tracked to closure.

## Cadence
- Weekly triage: blockers, dependencies, upcoming releases.
- Biweekly quality review: escaped defects, flaky tests, rollback events.
- Monthly reliability review: SLO attainment and action plan.
