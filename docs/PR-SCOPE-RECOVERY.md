# PR Scope Recovery Runbook

Use this runbook when a pull request has grown beyond safe review boundaries, especially when a claimed documentation PR also includes dependency, infrastructure, API, web, Prisma, or workflow changes.

## Goals

- Keep documentation-only changes isolated and reviewable.
- Prevent accidental production, infrastructure, dependency, auth, billing, tenant-isolation, or deployment changes from merging under a documentation label.
- Preserve a repeatable evidence trail for maintainers and CI.

## Immediate containment

1. Block merge in GitHub.
2. Add `scope-broken` and `needs-split` labels.
3. Comment on the PR:

   > This PR contains major scope drift and is not a documentation-only change. It will be split into smaller PRs for safe review and CI validation.

4. Do not merge until the PR is classified and split.

## Classification

Fetch the base branch, then classify the PR branch:

```bash
git fetch origin main --prune
scripts/classify-pr-scope.sh origin/main HEAD
```

For an inspected PR branch, use the branch name as the second argument:

```bash
scripts/classify-pr-scope.sh origin/main pr-2283-inspect
```

The classifier writes these files under `.codex/pr-scope/`:

- `all_changes.txt`
- `docs_changes.txt`
- `dependency_changes.txt`
- `production_changes.txt`
- `review_required_changes.txt`
- `summary.md`

## Buckets

### Documentation-safe candidates

Only these are safe for a documentation-only recovery PR:

- `README.md`
- `LICENSE`
- `docs/**`
- Markdown files (`*.md`)

### Dependency-review candidates

These require a separate dependency PR and lockfile-aware review:

- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`

Use `pnpm`, not npm or yarn, for this repository.

### Production/high-risk candidates

These require separate implementation or release PRs:

- `apps/api/**`
- `apps/web/**`
- `services/**`
- `prisma/**`
- `infra/**`
- `docker-compose.yml`
- `Dockerfile`
- `.github/workflows/**`

If any of these are present, stop the documentation merge path and isolate the changes before review.

## Clean documentation PR path

From an up-to-date `main`:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b codex/pr-2283-docs-clean
```

Apply only files listed in `.codex/pr-scope/docs_changes.txt`, then verify no other files are staged:

```bash
git status --short
git diff --cached --name-only
```

Commit with a documentation-only message, for example:

```bash
git commit -m "docs: isolate PR 2283 documentation updates"
```

## Dependency PR path

Create a separate branch only if dependency files changed intentionally:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b codex/pr-2283-deps-clean
```

Reapply only dependency file changes, then run:

```bash
pnpm install --frozen-lockfile
pnpm run check:prisma-versions
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
```

## Production/system PR path

Create a separate branch only when production files changed intentionally. Treat it as a normal release-impacting PR with explicit validation, rollback, and deployment notes.

Required review areas:

- API authentication and Supabase JWT verification.
- Tenant isolation and organization-scoped queries.
- RBAC behavior for owner, admin, dispatcher, sales, accounting, shipper, carrier, and driver roles.
- Stripe webhook signature verification and idempotency.
- Prisma schema and migration safety.
- Fly.io port, process, Dockerfile, and health-check alignment.
- Netlify redirect/proxy behavior.

## Secret leak check

Before committing any split branch, run targeted scans and manually inspect any suspicious results:

```bash
git grep -n -i "secret\|token\|apikey\|password" -- . ':!pnpm-lock.yaml'
git status --short
```

Never paste secret values into PRs, logs, or chat. If a real secret was committed, remove it and rotate it from an authenticated operator terminal.

## Documentation-only merge gate

A documentation-only recovery PR may merge only when all of the following are true:

- Fewer than 10 files changed, unless a maintainer explicitly approves a larger documentation batch.
- No dependency lockfiles changed.
- No infrastructure files changed.
- No API, web, Prisma, workflow, Docker, auth, billing, or deployment files changed.
- CI passes.
- The PR body includes validation results, production impact, and rollback notes.

## Rollback

Documentation-only rollback is a normal revert:

```bash
git revert <merge_commit_sha>
```

Dependency and production rollback plans must be specific to the changed package, service, migration, deployment, or configuration.
