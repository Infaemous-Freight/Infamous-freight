# CI Contract

This document defines the runtime and validation contract for Infamous Freight CI.

## Standard runtime

- Node.js: `22`
- pnpm: `9`
- install command: `pnpm install --frozen-lockfile`

## Required CI environment

### Shared defaults
- `CI=true`
- `NEXT_TELEMETRY_DISABLED=1`

### Validation jobs
- `NODE_ENV=test`

### Preview / deploy build jobs
- `NODE_ENV=production`

## Validation order

The pipeline should follow this order:

1. setup
2. lint
3. typecheck
4. build
5. tests
6. preview deploys (non-blocking)

## Determinism rules

- All workflows must use the same Node.js major version.
- All workflows must use the same pnpm major version.
- Dependency installation must always use the lockfile.
- Preview deploy failures must not block core validation unless explicitly promoted to required checks.
- New workflows must follow the same runtime contract unless documented otherwise.

## Required secrets and variables

Only set secrets required for the specific workflow.

Common CI environment defaults:
- `CI=true`
- `NEXT_TELEMETRY_DISABLED=1`

Provider-specific preview secrets may include:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `FIREBASE_TOKEN`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

These should be treated as optional for preview workflows unless the preview is a required gate.

## Branch protection

Recommended required checks for `main`:

- `CI`
- `Security`
- `Analyze`
- `secret-scan`
- `dependency-review`
- `repo-structure`

Preview deploy checks should remain non-blocking unless they are consistently stable and intentionally required.
