# Platform Verification Activation Evidence

Date: 2026-06-05
Repository: `Infaemous-Freight/Infamous-freight`

## Summary

Full-platform verification has been enabled as both a local/operator command and a GitHub Actions workflow.

## Enabled Artifacts

| Artifact | Purpose |
| --- | --- |
| `scripts/verify-entire-platform.sh` | Runs repo, environment, security, Prisma, production, smoke, evidence, and optional billing checks. |
| `package.json` → `verify:platform` | Provides a standard npm/pnpm entrypoint for full-platform verification. |
| `.github/workflows/platform-verification.yml` | Runs full-platform verification manually and on pushes to `main`. |
| `docs/PLATFORM_VERIFICATION_RUNBOOK.md` | Explains how to run verification, collect evidence, and close launch blockers. |
| `docs/README.md` | Updated to link the new verification runbook. |

## What Runs Automatically

On push to `main`, the Platform Verification workflow runs:

```bash
pnpm run verify:platform
```

Default automatic behavior:

- Production-facing smoke/evidence checks: enabled
- Build checks: enabled
- Live billing checks: disabled

Billing checks remain opt-in and require manual workflow dispatch with `run_billing_checks=true`.

## What the Script Checks

The verification script covers:

- dependency installation
- lint
- typecheck
- Prisma schema validation
- tests
- build
- strict environment check
- frontend environment safety
- Supabase client environment safety
- production security audit
- Prisma migration status
- production preflight
- production smoke test
- Netlify launch evidence capture
- optional Stripe live billing verification

## Safety Controls

- Secret values must never be printed, pasted, or committed.
- Live billing checks do not run automatically.
- Failed provider checks should record only secret names and missing access, never secret values.
- Demo-backed routes must not be marked live without production evidence.
- Genesis should remain review-only until audit logging and approval controls are complete.

## Remaining Manual Requirements

The following still require operator/provider access or repo settings changes:

1. Enable GitHub Issues in repository settings.
2. Confirm GitHub Actions secrets are present by name only.
3. Confirm Netlify production environment and preview-access settings.
4. Confirm Fly.io authenticated status/log diagnostics.
5. Confirm production database migration status.
6. Confirm production database backup and restore proof.
7. Confirm Stripe live checkout and webhook proof during approved verification window.
8. Create or identify a known-safe public tracking number and record positive tracking evidence.
9. Record owner go/no-go sign-off.

## Launch Decision

This activation does not approve production launch. It creates the mechanism to run and collect full-platform verification evidence.
