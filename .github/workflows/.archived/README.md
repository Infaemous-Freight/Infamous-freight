# Archived Workflows

This directory contains GitHub Actions workflow files that were archived as part of the
workflow consolidation effort. These files are **inactive** — GitHub Actions only reads
workflow files directly in `.github/workflows/`, not in subdirectories.

## Why Were These Archived?

The `.github/workflows/` directory had grown to 70+ workflow files with massive redundancy:
- Multiple workflows serving the same purpose with slightly different implementations
- CI minute waste from redundant runs on every push and PR
- Maintenance burden requiring changes to be replicated across many files
- Confusion about which workflow was canonical
- Potential conflicts between overlapping triggers

## Canonical Workflow Set (Active)

The following 12 canonical workflows now live in `.github/workflows/`:

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `ci.yml` | CI pipeline: sanity → lint → typecheck → test → build | PR + push to `main` |
| `deploy-api.yml` | API deployment to Fly.io with Prisma migrations | Push to `main` (api paths) |
| `deploy-web.yml` | Web deployment to Vercel | Push to `main` (web paths) |
| `deploy-mobile.yml` | Mobile OTA update via EAS | Push to `main` (mobile paths) |
| `security.yml` | CodeQL + dependency review + secret scanning + audit | PR + push to `main` + weekly |
| `release.yml` | Version bump, tagging, and GitHub Release creation | Push to `main` |
| `monitoring.yml` | Health checks and uptime monitoring | Every 30 minutes (scheduled) |
| `reusable-build.yml` | Reusable: build any workspace package | `workflow_call` |
| `reusable-test.yml` | Reusable: test any workspace package | `workflow_call` |
| `reusable-deploy.yml` | Reusable: deploy to any platform | `workflow_call` |
| `dependabot-automerge.yml` | Auto-merge Dependabot patch/minor PRs | PR opened/updated |
| `labeler.yml` | Auto-label PRs based on changed paths | PR opened/updated |

## Archived Workflow Groups

### CI / Test (11 files)
- `ci-sanity.yml` — Replaced by `ci.yml` sanity job
- `complete-cicd-pipeline.yml` — Replaced by `ci.yml`
- `auto-cicd-complete.yml` — Replaced by `ci.yml`
- `phase9-ci.yml` — Phase-specific, phases are done; replaced by `ci.yml`
- `code-quality.yml` — Replaced by `ci.yml` lint + typecheck jobs
- `test.yml` — Replaced by `ci.yml` test job
- `api-tests.yml` — Replaced by `ci.yml` test job
- `autonoma-tests.yml` — External test tooling, not used in production CI
- `e2e.yml` — Redundant with `ci.yml`; re-enable separately if E2E suite is wired up
- `e2e-tests.yml` — Duplicate of `e2e.yml`
- `contract-testing.yml` — Not yet implemented; archive until ready

### Deploy (19 files)
- `deploy.yml` — Generic; replaced by platform-specific deploys
- `deploy-all.yml` — Calls sub-deploys; superseded by individual canonical deploys
- `deploy-unified.yml` — Replaced by individual canonical deploy files
- `deploy-production.yml` — Replaced by `deploy-api.yml` + `deploy-web.yml`
- `deploy-api-bluegreen.yml` — Blue/green strategy not in use; use `deploy-api.yml`
- `auto-deploy.yml` — Replaced by `deploy-api.yml` / `deploy-web.yml`
- `cd.yml` — Replaced by `deploy-api.yml`
- `deploy-railway.yml` — Railway not the active platform; Fly.io is (`deploy-api.yml`)
- `fly-deploy.yml` — Replaced by `deploy-api.yml`
- `deploy-firebase-hosting.yml` — Firebase Hosting not in active use
- `firebase-deploy.yml` — Duplicate of `deploy-firebase-hosting.yml`
- `vercel-deploy.yml` — Replaced by `deploy-web.yml`
- `deploy-preview.yml` — Preview deploys not yet configured; re-enable when needed
- `deploy-market.yml` — Market/marketplace deploy; scope not active
- `mobile-deploy.yml` — Replaced by `deploy-mobile.yml`
- `eas-scheduled-build.yml` — Scheduled native builds; re-enable when EAS build quota allows
- `deploy-genesis-ai.yml` — AI-specific deploy; not in active production use
- `deploy-ai.yml` — Duplicate AI deploy
- `deploy-supabase.yml` — Supabase not the active DB (Fly Postgres is); archive until needed

### Security (7 files)
- `codeql.yml` — Consolidated into `security.yml` (codeql job)
- `dependency-review.yml` — Consolidated into `security.yml` (dependency-review job)
- `security-audit.yml` — Replaced by `security.yml` dependency-audit job
- `security-tests.yml` — Replaced by `security.yml`
- `security-validation.yml` — Replaced by `security.yml`
- `secret-scan-lite.yml` — Replaced by `security.yml` secret-scan job (Gitleaks)
- `gitguardian-scan.yml` — GitGuardian not configured; Gitleaks is used instead

### Monitoring (5 files)
- `auto-health-monitoring.yml` — Consolidated into `monitoring.yml`
- `production-monitoring.yml` — Consolidated into `monitoring.yml`
- `uptime-check.yml` — Consolidated into `monitoring.yml`
- `daily-health-check.yml` — Consolidated into `monitoring.yml`
- `auto-self-healing.yml` — Self-healing automation; not production-ready; archive

### Misc / Utility (18 files)
- `all-branches-green.yml` — Branch status aggregator; not needed with canonical `ci.yml`
- `auto-updates-security.yml` — Superseded by `dependabot-automerge.yml`
- `compliance-check.yml` — Compliance tooling not configured
- `copilot-checks.yml` — Copilot-specific checks; archive
- `copilot-pr-reminder.yml` — PR reminder bot; archive
- `dependabot-pr-labels.yml` — Label logic moved to `labeler.yml`
- `doc-validation.yml` — Documentation validation; re-enable when docs tooling is set up
- `docker.yml` — Docker builds not in active use (Fly builds from source)
- `lighthouse.yml` — Lighthouse CI audits; re-enable when `LHCI_GITHUB_APP_TOKEN` is configured
- `nextjs.yml` — Next.js-specific CI; replaced by `ci.yml`
- `performance.yml` — Performance benchmarks; re-enable when benchmarks are configured
- `pinger.yml` — Simple ping check; superseded by `monitoring.yml`
- `pr-checks.yml` — Replaced by `ci.yml`
- `pre-deployment-validation.yml` — Pre-deploy validation; merged into `deploy-api.yml`
- `prisma-migrate.yml` — Prisma migrations in CI; now handled in `deploy-api.yml`
- `prisma.yml` — Duplicate Prisma workflow
- `sentry-release.yml.disabled` — Sentry releases handled inside `deploy-api.yml`
- `weekly-maintenance-issue.yml` — Auto-issue creation; not needed

## How to Restore an Archived Workflow

To restore an archived workflow, move it back to `.github/workflows/`:

```bash
mv .github/workflows/.archived/<filename>.yml .github/workflows/<filename>.yml
```

Then review the workflow for any required updates before committing.

## Consolidation Date

Archived on: 2026-03-10  
PR: See consolidation PR description for full rationale
