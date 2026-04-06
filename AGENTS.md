# AGENTS.md

## Environment setup (required before install/build)
For this repository, always initialize the runtime in each new shell session before running `pnpm install` or any `pnpm ... build` command:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.33.0 --activate
node -v
pnpm -v
```

Expected versions:
- `node -v` => `v24.x`
- `pnpm -v` => `10.x` (currently `10.33.0`)

## Sentry integration conventions (Codex persistence)
- Keep the existing pnpm workspace tooling (`pnpm`, Node 24, pnpm 10) for dependency and script changes; do not switch package managers.
- Preserve repository runtime conventions: TypeScript + ESM in `apps/api` (`.ts` files, `import` syntax).
- Sentry DSN must be environment-configured via `SENTRY_DSN`. If `SENTRY_DSN` is not set, Sentry must remain disabled. Do not use a real project DSN as a code fallback; if any fallback is retained for local wiring, it must be a clearly non-production placeholder that cannot report to a live Sentry project.
- Keep Sentry initialization in `apps/api/src/instrument.ts` and import it as the very first import in `apps/api/src/server.ts`.
- For Express error capture, keep Sentry exception capture middleware after route registration and before custom error middleware.
- Verify Sentry safely only in non-production and only when Sentry is configured, using `GET /debug/sentry`, which calls `Sentry.captureException(...)`.
