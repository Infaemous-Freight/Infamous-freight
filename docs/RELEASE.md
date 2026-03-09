# Release Guide

This project uses a CI-first release flow with manual verification for production.

## 1) Pre-release validation

Run local checks before opening or merging a release PR:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm lint
pnpm test
scripts/smoke.sh
```

## 2) Versioning and changelog

- Follow semver when bumping versions.
- Include a short summary of user-facing changes and operational risks.
- Link migrations, feature flags, and rollback notes in the PR description.

## 3) Deployment

1. Merge to the protected default branch.
2. Wait for CI to pass.
3. Trigger production deployment workflow.
4. Confirm health endpoint and smoke checks.

## 4) Post-release checks

- Verify API health (`/api/health`).
- Verify critical web and mobile user flows.
- Review logs/alerts for errors and latency regressions.

## 5) Rollback criteria

Rollback immediately if one of the following occurs:

- Smoke checks fail repeatedly after deploy.
- Authentication, payments, or order flows are broken.
- Error rate or latency exceeds SLOs for 15+ minutes.

Document incident details and follow-up actions in the release notes.
