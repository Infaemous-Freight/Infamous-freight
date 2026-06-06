---
name: Live Operations Route Wiring
about: Convert a demo-backed route to live API-backed production behavior
title: "[Live Ops Route]: "
labels: live-ops, production-readiness
assignees: ''
---

## Route

Example: `/quotes`, `/loads`, `/dispatch`, `/carriers`, `/analytics`

## Current Readiness

- [ ] Demo-backed
- [ ] Gated
- [ ] Partially live
- [ ] Unknown

## Target Behavior

Describe the live data source and expected production behavior.

## Required API/Data Work

- [ ] API endpoint exists
- [ ] Endpoint returns tenant-scoped records
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state implemented
- [ ] Demo data removed from production path
- [ ] Auth/role checks verified
- [ ] Audit/event logging added where needed

## Verification Evidence

- Command/check:
- Workflow run URL:
- Screenshot or evidence path:
- Test account or tenant used, without secrets:

## Acceptance Criteria

- [ ] Route displays live API-backed data
- [ ] Route handles no-data state safely
- [ ] Route handles errors safely
- [ ] Route does not expose other tenants' data
- [ ] Route status is updated in `apps/web/src/lib/routeReadiness.ts`
- [ ] Launch evidence is updated

## Notes

Do not paste customer private data, account credentials, database URLs, or tokens.
