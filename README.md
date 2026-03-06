# Infamous Freight

AI-powered freight and logistics automation platform.

This repository is a platform monorepo. It contains product applications, shared packages,
AI services, infrastructure, operational tooling, compliance logic, testing systems,
and developer automation.

## Canonical repository map

### Runtime applications
- `apps/` — first-class runnable applications
  - `apps/api` — backend API
  - `apps/web` — web app
  - `apps/mobile` — mobile app
  - `apps/worker` — background jobs
  - `apps/ai` — app-layer AI runtime if used

### Shared code
- `packages/` — shared libraries and reusable internal packages
  - `packages/shared` — contracts, constants, schemas, utils
  - `packages/genesis` — Genesis avatar / assistant UI package

### Service domains
- `services/` — standalone service domains that are not app shells

### AI / ML services
- `ai/` — standalone AI or ML service runtime
  - currently the canonical home for Python-based model-serving and rate prediction

### Compliance and governance
- `@compliance/` — canonical internal compliance domain package
- `compliance/` — legacy or transitional compliance content; consolidate into `@compliance/` unless a hard separation is required
- `.security/` — security policy and incident response docs

### Infrastructure and deployment
- `docker/` — local container orchestration and service Dockerfiles
- `k8s/` — Kubernetes manifests
- `terraform/` — infrastructure as code
- `deploy/` — deployment scripts and release mechanics
- `infrastructure/` — shared infra assets that do not fit cleanly elsewhere
- `nginx/` — edge/proxy config
- `supabase/` — Supabase-specific assets

### Testing and quality
- `tests/` — shared integration/system tests
- `e2e/` — end-to-end tests
- `k6/` — canonical load/performance testing
- `load-tests/` — legacy or transitional performance tests; consolidate into `k6/` or `tools/load-tests/`
- `tools/load-tests/` — performance test tooling

### Observability and operations
- `monitoring/` — monitoring assets
- `observability/` — tracing/logging/telemetry assets
- `ops/` — operational runbooks and support procedures

### Developer control plane
- `.github/` — GitHub automation and repo governance
- `.devcontainer/` — development container setup
- `.vscode/` — workspace defaults
- `.husky/` — canonical git hooks
- `.codex` — AI coding-agent guardrails

## Canonical rules

1. `apps/` is the primary home for runnable product applications.
2. `packages/` is the primary home for reusable TypeScript libraries.
3. `ai/` is the primary home for standalone Python/ML services.
4. `@compliance/` is the primary home for compliance logic and schemas.
5. `k6/` is the preferred home for performance testing.
6. `infra` concerns stay split by tool, but must be documented through one architecture map.
7. New top-level directories require a clear justification and an ownership update.

## Fast start

### Install
```bash
pnpm install
```

### Run core apps
```bash
pnpm --filter ./apps/api dev
pnpm --filter ./apps/web dev
pnpm --filter ./apps/worker dev
```

### Run platform checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Required reading
- `ARCHITECTURE.md`
- `REPO_MAP.md`
- `OWNERSHIP.md`
- `.github/CONTRIBUTING.md`
