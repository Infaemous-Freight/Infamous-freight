# Infamous Freight

[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml)
[![CodeQL](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml)
[![Security Audit](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml)

Infamous Freight is a logistics and freight operations platform organized as a pnpm monorepo with API, web, mobile, and shared workspace packages.

## Quick Start

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate

git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

cp .env.example .env
pnpm install
pnpm build
pnpm dev
```

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 22.x |
| pnpm | 9.x |

## Workspace Layout

```text
apps/
  api/       Express API
  web/       Next.js operations dashboard
  mobile/    Expo / React Native mobile app

packages/
  shared/    shared types and utilities

.github/
  workflows/ CI, CodeQL, and security workflows

docs/
  architecture, deployment, and operational docs

scripts/
  local setup and validation helpers
```

## Architecture Overview

```text
Client Interfaces
│
├── Web Dashboard (Next.js)
├── Mobile Driver App (Expo / React Native)
│
API Layer
│
└── Express API
    ├── Authentication
    ├── Dispatch Services
    ├── Shipment Tracking
    └── Operational APIs
│
Shared Layer
│
└── packages/shared
    ├── types
    ├── validation
    └── utilities
```

## Development

### Start API

```bash
pnpm dev
# or
pnpm dev:api
```

### Start Web

```bash
pnpm dev:web
```

### Start Mobile

```bash
pnpm dev:mobile
```

### Start all main surfaces

```bash
scripts/dev-all.sh
```

## Quality Checks

Run everything:

```bash
pnpm validate
```

Run checks individually:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

Or use the local validation helper:

```bash
scripts/validate-local.sh
```

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Typical variables include:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_PUBLIC_KEY=
JWT_PRIVATE_KEY=
SENTRY_DSN=
WEBHOOK_SECRET=
```

Secrets must never be committed. Use GitHub Actions secrets and deployment platform secrets for CI and production environments.

## CI / Security

This repository uses GitHub Actions to run:
- repository validation
- linting
- typechecking
- tests
- builds
- security audit
- CodeQL

CI should pass before merging to main.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start API workspace |
| `pnpm dev:api` | Start API workspace |
| `pnpm dev:web` | Start web workspace |
| `pnpm dev:mobile` | Start mobile workspace |
| `pnpm build` | Build shared package and all workspaces |
| `pnpm typecheck` | Build shared package and run typechecks |
| `pnpm lint` | Run lints across workspaces |
| `pnpm test` | Build shared package and run tests |
| `pnpm validate` | Full repo validation |

## Setup Helpers

Bootstrap local development:

```bash
scripts/setup.sh
```

Validate everything locally:

```bash
scripts/validate-local.sh
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)

## Contribution Workflow

1. Create a feature branch
2. Run `pnpm validate`
3. Commit with a clear message
4. Open a pull request
5. Wait for CI to pass before merge

## License

MIT
