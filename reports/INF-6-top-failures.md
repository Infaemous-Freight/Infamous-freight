# INF-6 — Top 3 Repo Failures (Triage)

Date: 2026-03-31 (UTC)

## 1) Node engine mismatch blocks all standard workspace commands

- **What is failing**: `pnpm install --frozen-lockfile` and standard root scripts (`pnpm run build`, `pnpm run test`, etc.) fail immediately with `ERR_PNPM_UNSUPPORTED_ENGINE` because repo requires Node `24.x` but environment is running `v22.21.1`.
- **Scope affected**: Local development, CI/build, and deploy preflight (anything starting from root scripts).
- **Severity**: **Critical**.
- **Frequency**: **Always** in non-Node-24 environments.
- **Why this is high-friction**: It prevents contributors and automation from executing normal repo workflows unless they manually bypass `engine-strict`, which is not the intended path.

## 2) `packages/genesis` build fails due to invalid TypeScript compiler option

- **What is failing**: `packages/genesis` fails build with `tsconfig.json(12,27): error TS5103: Invalid value for '--ignoreDeprecations'.`
- **Scope affected**: Build (workspace recursive build fails), downstream validation pipelines.
- **Severity**: **High**.
- **Frequency**: **Always** when building workspace packages that include `packages/genesis`.
- **Why this is high-friction**: Even after bypassing engine strictness, the shared build pipeline still fails on this package and blocks release confidence.

## 3) `apps/web` production build fails on TypeScript type error in `useWebSocket`

- **What is failing**: `apps/web` `next build` fails at type-check stage with `Type error: 'socket' is of type 'unknown'` in `lib/useWebSocket.ts` (line around 69).
- **Scope affected**: Frontend build and deploy.
- **Severity**: **High**.
- **Frequency**: **Always** during `apps/web` production builds.
- **Why this is high-friction**: Blocks web artifact generation and deployment readiness.

## Fix order recommendation

1. **Fix Node 24 runtime/tooling enforcement first** (or align repo engine policy and runtime in CI/dev containers). This unblocks all normal command execution.
2. **Fix `packages/genesis` TS config option** to restore recursive workspace build stability.
3. **Fix `apps/web/lib/useWebSocket.ts` typing** so `next build` can complete for deployable frontend artifacts.

## Evidence commands used

- `pnpm -v && node -v`
- `pnpm install --frozen-lockfile`
- `pnpm --config.engine-strict=false -r --if-present --no-bail build`
