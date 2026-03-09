# Release Checklist

Use this checklist before promoting a build to staging or production.

## Pre-release validation

- [ ] `pnpm install --frozen-lockfile` succeeds
- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` succeeds
- [ ] `pnpm lint` succeeds
- [ ] `pnpm test` succeeds
- [ ] `scripts/smoke.sh` succeeds against the target API

## Environment / secrets

- [ ] all required environment variables are set
- [ ] no secrets are hardcoded in workflow files or tracked config
- [ ] deployment platform secrets are up to date
- [ ] any previously exposed secrets have been rotated

## Data / migrations

- [ ] database migrations reviewed
- [ ] rollback impact reviewed
- [ ] seed or bootstrap data strategy verified if needed

## Runtime / deployment

- [ ] API health endpoint returns success
- [ ] preview / staging deploy verified
- [ ] monitoring and error tracking configured
- [ ] rollout plan documented
- [ ] rollback plan documented

## Final signoff

- [ ] CI is green on the release commit
- [ ] release notes prepared
- [ ] owner approval complete
