# Infæmous Freight

Infæmous Freight is an AI-powered freight and logistics operations platform that optimizes dispatch workflows, shipment visibility, fleet coordination, and operational intelligence across web, mobile, and API surfaces.

---

## Quick Start

1) Clone and enter the repo

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight
```

2) Match the runtime (Node 24.x, pnpm 10.x)

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.15.0 --activate
node -v
pnpm -v
```

3) Install dependencies and env vars

```bash
cp .env.example .env
pnpm install
```

4) Prep the database (PostgreSQL required)

```bash
createdb infamous_freight
pnpm prisma:generate
pnpm db:migrate
```

5) Start local services

```bash
make infra-up         # Postgres, Redis, API container
pnpm dev:api          # or pnpm dev
pnpm dev:web          # dashboard
pnpm dev:mobile       # Expo client
```

6) Validate before pushing

```bash
pnpm run validate     # build + typecheck + lint + test
```

> If `pnpm install` complains about an unsupported engine, ensure you are using the Node version pinned in `.nvmrc`/`.node-version` and re-run the setup block above.

---

## Environment Setup

### Node & pnpm (POSIX shells)

Use NVM to match CI and automation. Run these in every new shell before installs or builds:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.15.0 --activate
node -v
pnpm -v
```

### Android (Termux)

1. Install the official Termux from F-Droid or GitHub (not Play Store).
2. Update and install Node:
   ```bash
   pkg update && pkg upgrade -y
   pkg uninstall nodejs nodejs-lts -y
   pkg install nodejs -y
   node -v
   npm -v
   corepack enable
   corepack prepare pnpm@10.15.0 --activate
   pnpm -v
   ```
3. Reinstall workspace deps if needed:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

---

## Monorepo Map

```text
apps/
  api/        Backend logistics engine
  web/        Operations dashboard
  mobile/     Field operations interface
  ai/         AI orchestration layer
  worker/     Background processing

packages/
  shared/     Shared schemas, utilities, domain models
  genesis/    AI/agent building blocks
```

Treat `infra/*` as operations-owned. Experimental roots outside `apps/*` and `packages/*` are non-core unless called out in roadmap docs.

### Surface Responsibilities

| Surface          | Purpose                                    |
|------------------|--------------------------------------------|
| apps/api         | Platform orchestration and logistics engine|
| apps/web         | Operations control plane                   |
| apps/mobile      | Field operations interface                 |
| apps/ai          | Conversational/agent layer                 |
| apps/worker      | Async jobs and pipelines                   |
| packages/shared  | Shared types and utilities                 |
| packages/genesis | Agent + avatar primitives                  |

---

## Platform Vision

The platform aims to be a freight operating system delivering dispatch automation, operational analytics, fleet intelligence, shipment lifecycle visibility, driver coordination, and AI-driven insights instead of a simple load management tool.

### Technology Stack

- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL, Redis
- **Frontend:** Next.js, TypeScript
- **Mobile:** React Native, Expo
- **Infrastructure:** Docker, GitHub Actions, CodeQL, security audit pipelines

---

## Development Workflow

Canonical tooling is `pnpm`; `make` wraps the same flows.

```bash
pnpm install                # dependencies
pnpm dev:api                # API (or pnpm dev)
pnpm dev:web                # dashboard
pnpm dev:mobile             # Expo client
pnpm prisma:generate        # regenerate Prisma client
pnpm db:migrate             # apply migrations locally
pnpm lint                   # repo lint
pnpm typecheck              # TS/Prisma checks
pnpm test                   # unit/integration tests
pnpm build                  # workspace build
pnpm run validate           # build + typecheck + lint + test
make infra-up               # start local infra
make infra-down             # stop local infra
make infra-logs             # tail infra logs
make smoke                  # /health smoke test
```

CI enforces the coverage settings defined in the repository and workspace test configuration for suites that report coverage.

---

## Local Infrastructure

Use the provided Docker-based stack for local development:

- PostgreSQL
- Redis
- API container

```bash
make infra-up    # start
make infra-logs  # view logs
make smoke       # basic /health check
make infra-down  # stop
```

---

## Documentation Guide

Start with these references:

- `docs/ARCHITECTURE.md` — platform architecture
- `docs/DEPLOYMENT.md` — deployment steps and expectations
- `docs/RELEASE.md` — release governance and rollback
- `docs/platform-expansion/` — observability, testing, mobile scaffolding, multi-region, developer portal, OpenAPI
- `docs/repository-structure.md` — workspace layout and ownership notes

---

## Contributing

- Follow the PR template and keep changes scoped.
- Conventional commits are required (e.g., `feat: add shipment tracking API`).
- Suggested branch names: `feature/dispatch-engine`, `feature/shipment-tracking`, `fix/api-timeout`, `docs/readme-update`.
- Before opening a PR, ensure build, lint, tests, and validation pass.
- Document operational changes and include logs/screenshots when helpful.

---

## CI/CD & Security

- Core workflows: `ci.yml` (build/lint/typecheck/test), `codeql.yml`, `security-audit.yml`, `cd.yml` plus additional deploy/security/e2e workflows under `.github/workflows/`.
- Never commit secrets; validate external inputs; enforce RBAC and tenant boundaries; store production credentials in managed secret stores.

---

## Support

Keep pull requests focused, avoid unrelated changes, and call out whether changes target core product (`apps/*`, `packages/*`), platform infrastructure (`infra/*`), or experimental areas. The goal is predictable, repeatable, production-grade logistics software.
