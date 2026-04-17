# Infæmous Freight

[![Netlify deploy status for infamousfreight](https://api.netlify.com/api/v1/badges/d03682ba-fcb4-4dc6-984e-f7eae7fff59c/deploy-status)](https://app.netlify.com/projects/infamousfreight/deploys)

_Deploy status only; a green badge does not guarantee the frontend is rendering correctly._

---

## Overview

Infæmous Freight is an AI-powered freight and logistics operations platform built to optimize dispatch workflows, shipment visibility, fleet coordination, and operational intelligence.

The platform combines modern logistics infrastructure with AI-driven automation and analytics to help carriers, dispatch teams, and logistics operators run efficient freight operations.

The repository is organized as a pnpm monorepo delivering a unified platform across API, web, and mobile surfaces.

---

## Platform Vision

The goal of Infæmous Freight is to become a logistics intelligence platform capable of:

- dispatch automation
- operational analytics
- fleet intelligence
- shipment lifecycle visibility
- driver coordination
- AI-driven operational insights

Rather than acting as a simple load management tool, Infæmous Freight is designed as a freight operating system.

---

## Product Architecture

The Infæmous ecosystem consists of three major layers.

### Infæmous Freight

**Category:** Core Product

The primary logistics platform responsible for managing freight operations.

Capabilities include:

- dispatch workflow automation
- shipment lifecycle tracking
- fleet activity monitoring
- routing intelligence
- operational dashboards
- logistics analytics

Infæmous Freight acts as the system of record for logistics workflows.

---

### Genesis Avatar

**Category:** AI Interface Layer

Genesis Avatar is the conversational AI and avatar interface used to interact with the platform.

Capabilities include:

- conversational operational queries
- AI-driven command execution
- logistics insights
- workflow assistance
- cross-surface assistant experience

Genesis Avatar provides the AI interaction layer for the platform.

---

### Platform Infrastructure

Supporting infrastructure powers the entire ecosystem:

- authentication
- tenant isolation
- data orchestration
- observability
- API infrastructure
- shared domain models

These components support the platform but are not standalone products.

---

## Monorepo Structure

```text
apps/
  api/        Backend logistics engine
  web/        Operations dashboard
  mobile/     Mobile operations interface

packages/
  shared/     Shared schemas, utilities, domain models
```

> Note: This overview highlights the primary product surfaces. Additional internal workspaces (for example, `apps/ai`, `apps/worker`, and `packages/genesis`) also exist in the pnpm monorepo but are omitted here for brevity.

### Repository Boundaries

To keep onboarding clear in a large repository, use the following ownership model:

- `apps/*` and `packages/*` are the primary pnpm workspace surfaces and default contributors should focus here.
- `infra/*` contains deployment/infrastructure assets and should be treated as operations-owned.
- Top-level experiments, prototypes, and incubating initiatives outside `apps/*` / `packages/*` should be considered non-core unless explicitly referenced by active roadmap docs.

When opening PRs, state clearly whether your change targets:

1. Core product workspace (`apps/*`, `packages/*`)
2. Platform infrastructure (`infra/*`, deployment config)
3. Experimental or incubating surfaces

### Surface Responsibilities

| Surface         | Purpose                                  |
|----------------|------------------------------------------|
| apps/api       | Platform orchestration and logistics engine |
| apps/web       | Operations control plane                 |
| apps/mobile    | Field operations interface               |
| packages/shared| Shared types and utilities               |

---

## Technology Stack

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Redis

### Frontend

- Next.js
- TypeScript

### Mobile

- React Native
- Expo

### Infrastructure

- Docker
- GitHub Actions
- CodeQL
- Security audit pipelines

---

## Operator Command Map

Use these root commands for deterministic day-to-day operation:

```bash
pnpm install          # install all workspace dependencies
pnpm dev:api          # run API in dev mode
pnpm build            # generate Prisma client (offline-safe) + build all workspaces
pnpm lint             # lint all workspaces
pnpm typecheck        # strict TypeScript checks
pnpm test             # run workspace tests serially
pnpm audit            # full dependency audit
pnpm audit:prod       # production dependency audit
pnpm health           # lint + typecheck + test (no full workspace build)
pnpm validate         # full build + typecheck + lint + test
```

---

## Getting Started

Clone the repository.

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight
```

Enable pnpm via Corepack.

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

### Reproducible local setup (NVM + pnpm)

To match CI and Codex automation, use the repository-configured Node version through NVM before running installs or builds:

```bash
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "NVM is required for this setup. Install it first: https://github.com/nvm-sh/nvm#installing-and-updating" >&2
  exit 1
fi

nvm install 24
nvm use 24

corepack enable
corepack prepare pnpm@10.33.0 --activate

node -v
pnpm -v
```

Copy environment variables.

```bash
cp .env.example .env
```

Install dependencies.

```bash
pnpm install
```

Or run the one-command API quickstart (installs deps, builds, and starts API):

```bash
pnpm run quickstart:api
```

This quickstart seeds missing env files from templates:
`./.env`, `apps/api/.env`, and `apps/web/.env.local`.

### Optional: GitHub MCP server (Docker)

```bash
cp .mcp.json.example .mcp.json
export GITHUB_PERSONAL_ACCESS_TOKEN=your-personal-access-token
export GITHUB_API_URL=https://github.example.com/api/v3 # optional (GitHub Enterprise)
docker run --rm -i \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=your-personal-access-token \
  -e GITHUB_API_URL=https://github.example.com/api/v3 \
  ifamousfreight/dhi-github-mcp:latest
```

The local `.mcp.json` file is gitignored to avoid committing personal tokens.
You can also run:

```bash
pnpm run mcp:github
```

To query the structure of the main branch from Git:

```bash
pnpm run repo:structure:main
# full tree:
TREE_FULL=true pnpm run repo:structure:main
```

To create a GitHub issue from CLI (title + description + optional labels):

```bash
bash scripts/create-github-issue.sh project/repo "Bug title" "Bug description" "bug,priority:high"
```

To create a PR from your current feature branch to `main`:

```bash
bash scripts/create-github-pr.sh main "PR title" "PR description" "reviewer1,reviewer2"
```

To check the latest CI run status for a PR:

```bash
# current PR inferred by gh:
pnpm run github:pr:ci-status
# or provide PR number:
bash scripts/check-latest-pr-ci-status.sh 123
```

To check your current GitHub API rate limit:

```bash
pnpm run github:rate-limit
```

To find all files using a deprecated API function:

```bash
pnpm run repo:find-deprecated-api -- "<deprecated_function_name>"
```

To verify a pulled image matches an expected SHA256 digest:

```bash
pnpm run docker:verify-digest -- ifamousfreight/dhi-github-mcp:latest sha256:50b2c4f88e0dda38d3a163ad8ef1460fde82a70e2b28da73e6035f93c6f545d9
```

> **Runtime requirement:** this repo enforces Node.js **24.x** (see `.node-version` / `.nvmrc`). If you are not on the pinned Node version, `pnpm` will fail with `ERR_PNPM_UNSUPPORTED_ENGINE`.
>
> If you hit that error, switch to the version defined by the repo and retry install:
>
> ```bash
> nvm install
> nvm use
> corepack enable
> corepack prepare pnpm@10.33.0 --activate
> pnpm install
> ```

Initialize database tooling for local development.

```bash
# PostgreSQL CLI required for createdb
createdb infamous_freight
pnpm prisma:generate
pnpm db:migrate
```

Build the workspace.

```bash
pnpm build
```

### Android (Termux) Node.js setup

If you are developing from Android (for example, a Samsung Galaxy device), use the official Termux build from **F-Droid** or **GitHub**. Do not use the deprecated Google Play release.

1. Update Termux packages:

   ```bash
   pkg update && pkg upgrade -y
   ```

2. Remove existing Node.js packages (only one of `nodejs` or `nodejs-lts` can be installed at a time):

   ```bash
   pkg uninstall nodejs nodejs-lts -y
   ```

3. Install Node.js and verify versions:

   ```bash
   pkg install nodejs -y
   node -v    # expect v24.x.x (or the major version specified in Runtime Policy / .nvmrc)
   npm -v
   npm -v
   ```

5. Install pnpm and verify:

   ```bash
   corepack enable
   corepack prepare pnpm@10.33.0 --activate
   pnpm -v
   ```

6. Reinstall workspace dependencies in your project:

   ```bash
   rm -rf node_modules
   pnpm install
   ```

---

## Development

Canonical developer interface is `pnpm` scripts. `make` targets are convenience wrappers around the same flows.

Recommended daily workflow:

```bash
pnpm install
pnpm dev:api
pnpm lint
pnpm typecheck
pnpm test
```

### API

```bash
pnpm dev
```

or

```bash
pnpm dev:api
```

### Web Dashboard

```bash
pnpm dev:web
```

### Mobile App

```bash
pnpm dev:mobile
```

---

## Local Infrastructure

Infæmous Freight includes a local infrastructure environment for development.

Services include:

- PostgreSQL
- Redis
- API container

Start infrastructure

```bash
make infra-up
```

View logs

```bash
make infra-logs
```

Run health smoke test

```bash
make smoke
```

Stop infrastructure

```bash
make infra-down
```

The smoke test validates the `/health` endpoint to confirm that the platform services are operational.

---

## Validation

Before opening a pull request, run the validation suite.

```bash
pnpm run validate
```

Or step-by-step:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

CI enforces baseline test coverage thresholds (lines/functions/statements: 70%, branches: 60%) for coverage-enabled test suites.

## Runtime Policy

- Required runtime: Node.js 24.x
- Required package manager: pnpm 10.x
- Source of truth: `.nvmrc` + root `package.json` engines

If your local runtime does not match these versions, switch with your version manager before running installs or checks.

---

## Makefile Commands

Common development helpers are available via make.

```bash
make install
make build
make typecheck
make lint
make test
make validate
make dev
make infra-up
make infra-down
make infra-logs
make smoke
```

---

## Contributing

See:

`CONTRIBUTING.md`

### Pull Request Checklist

Before submitting a PR:

- build passes
- lint passes
- tests pass
- validation passes

### Branch naming examples

- `feature/dispatch-engine`
- `feature/shipment-tracking`
- `fix/api-timeout`
- `docs/readme-update`

### Commit format

This repository follows Conventional Commits.

Examples:

- `feat: add shipment tracking API`
- `fix: resolve pnpm workspace dependency issue`
- `docs: update architecture documentation`

---

## CI/CD

The repository defines a core set of CI/CD workflows to keep feedback fast and signal-focused.

Key workflows include (not exhaustive):

- `ci.yml` — build, lint, typecheck, test
- `codeql.yml` — security scanning
- `security-audit.yml` — dependency audits
- `cd.yml` — deployment workflow

Additional workflows (e.g., deploy-*, security-*, e2e) live under `.github/workflows/`; refer to that directory for the complete automation surface area.

---

## Architecture

Full architecture documentation can be found in:

`docs/ARCHITECTURE.md`

Platform model:

```text
Client (Web / Mobile)
       │
       ▼
API Gateway
       │
       ▼
AI Orchestration Layer
       │
       ▼
Business Logic Engine
       │
       ▼
Data Layer (PostgreSQL + Redis)
```

---

## New Platform Expansion Areas

To support the next major build phase with zero overlap to existing workstreams, a dedicated documentation package has been added under:

`docs/platform-expansion/`

Included areas:

1. **Observability & Monitoring**
2. **OpenAPI Documentation**
3. **Testing Strategy**
4. **Mobile App Scaffolding**
5. **Multi-region & Data Residency**
6. **Developer Portal & Webhook Debugger**

Start here:

- `docs/platform-expansion/README.md`

Then review each area document in sequence:

- `docs/platform-expansion/01-observability-monitoring.md`
- `docs/platform-expansion/02-openapi-documentation.md`
- `docs/platform-expansion/03-testing-strategy.md`
- `docs/platform-expansion/04-mobile-app-scaffolding.md`
- `docs/platform-expansion/05-multi-region-data-residency.md`
- `docs/platform-expansion/06-developer-portal-webhook-debugger.md`

---

## Deployment

Deployment guidance is documented in:

`docs/DEPLOYMENT.md`

Deployment documentation includes:

- environment setup
- secret management
- release procedures
- operational expectations

---

## Release Governance

Release procedures are documented in:

`docs/RELEASE.md`

This checklist includes:

- CI verification
- environment validation
- rollback strategy
- smoke testing
- post-release monitoring

---

## Security

Security guidelines include:

- never commit secrets
- validate all external inputs
- maintain RBAC and tenant boundaries
- store production credentials in managed secret stores

---

## Support for Contributors

When contributing:

- keep pull requests focused
- avoid unrelated file changes
- document operational changes
- include logs or screenshots when helpful

The goal is simple:

predictable, repeatable, production-grade logistics software.
