# Full Platform Verification Runbook

Use this runbook to verify the entire Infamous Freight platform across repository health, frontend, backend, database, production routing, public intake, tracking, billing, and launch evidence.

## Purpose

The platform is not considered production-approved until verification evidence is created and reviewed. Documentation alone is not proof of readiness.

## Verification Options

### Option 1: GitHub Actions

Use the manual workflow:

```text
Actions → Platform Verification → Run workflow
```

Inputs:

| Input | Default | When to change |
| --- | --- | --- |
| `run_production_checks` | `true` | Set `false` for repo-only verification. |
| `run_billing_checks` | `false` | Set `true` only during an approved live billing verification window. |
| `run_build_checks` | `true` | Set `false` only when build checks are intentionally deferred. |

The workflow uploads an artifact named:

```text
platform-verification-evidence
```

Download that artifact and copy the final summary into `docs/LAUNCH_EVIDENCE_LOG.md` or a dated file under `docs/evidence/`.

### Option 2: Local Operator Terminal

From the repo root:

```bash
pnpm run verify:platform
```

To skip production-facing checks:

```bash
RUN_PRODUCTION_CHECKS=0 pnpm run verify:platform
```

To run approved live billing checks:

```bash
RUN_BILLING_CHECKS=1 pnpm run verify:platform
```

To skip build checks during a fast diagnostic run:

```bash
RUN_BUILD_CHECKS=0 pnpm run verify:platform
```

The script writes a Markdown evidence file under:

```text
docs/evidence/
```

## What the Script Checks

The script runs:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run prisma:validate
pnpm run test
pnpm run build
pnpm run env:check:strict
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run audit:production-security
pnpm run prisma:migrate:status
pnpm run production:preflight
pnpm run production:smoke-test
pnpm run production:capture-netlify-evidence
```

Billing verification is intentionally opt-in:

```bash
pnpm run billing:verify-live
```

## Required Evidence After a Run

Record:

- Timestamp
- Commit SHA
- Workflow run URL or local terminal owner
- Pass/fail result
- Failed checks
- Follow-up owner
- Launch decision impact

Use:

```text
docs/LAUNCH_EVIDENCE_TEMPLATE.md
```

or update:

```text
docs/LAUNCH_EVIDENCE_LOG.md
```

## Production Approval Rules

Do not approve production launch if any of these remain unknown or failed:

- Production database migration status
- Production database backup and restore proof
- Stripe live checkout and webhook proof
- Authenticated Fly.io status/log diagnostics
- Netlify production environment and preview access review
- Public quote intake proof
- Positive public tracking proof with known-safe tracking number
- End-to-end workflow proof for quote → load → dispatch → tracking → delivery/POD → billing
- Owner sign-off and rollback owner sign-off

## Safety Rules

- Never paste secret values into docs, issues, workflow logs, screenshots, or chat.
- Record secret names only.
- Do not run live billing checks unless the operator approves the live billing verification window.
- Do not mark demo-backed routes as production-ready without live-data evidence.
- Keep Genesis review-only until audit logging and approval controls are complete.

## Known Current Platform Blockers

As of this runbook creation, the following categories still need evidence before production approval:

1. GitHub Issues are disabled in the repository.
2. Several authenticated app routes are demo-backed.
3. Positive public tracking lookup needs a known-safe production tracking number.
4. Public quote intake requires fresh evidence after deploy.
5. Stripe live-mode verification remains pending.
6. Production database migration and backup/restore proof remain pending.
7. Authenticated Fly.io diagnostics remain pending.
8. Owner launch sign-off remains pending.

## Recommended Closeout Sequence

1. Enable GitHub Issues.
2. Run the Platform Verification workflow.
3. Download the verification artifact.
4. Update launch evidence.
5. Create issues for any failed checks.
6. Fix blockers in priority order.
7. Re-run verification.
8. Record owner go/no-go decision.
