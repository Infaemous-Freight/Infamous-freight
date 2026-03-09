## Summary
Describe what changed and why.

## Scope
- [ ] API
- [ ] Web
- [ ] Mobile
- [ ] Shared packages
- [ ] Prisma / DB
- [ ] CI/CD
- [ ] Infra
- [ ] Docs / Config

## Risk Review
- [ ] Auth reviewed
- [ ] Tenant isolation preserved
- [ ] Input validation reviewed
- [ ] Error handling reviewed
- [ ] Logging / observability preserved
- [ ] No secrets added
- [ ] No unsafe raw SQL added

## Freight Domain Review
- [ ] Shipment / load status transitions reviewed
- [ ] Tracking integrity preserved
- [ ] Rate / invoice changes are traceable
- [ ] Cross-tenant access is not introduced

## Testing
- [ ] lint
- [ ] typecheck
- [ ] test
- [ ] build

## DB / Migration
- [ ] No migration
- [ ] Migration included
- [ ] Backfill required
- [ ] Rollback considered
- [ ] Tenant scoping reviewed in DB queries

## Release Checklist
- [ ] env vars verified
- [ ] health checks verified
- [ ] observability verified
- [ ] rollout plan noted
- [ ] rollback plan noted

## Follow-up Work
List any tasks that are intentionally deferred or out of scope for this PR. Open separate issues for each.

- N/A

## Notes for Reviewers
Add known tradeoffs, follow-ups, or risk areas here.
