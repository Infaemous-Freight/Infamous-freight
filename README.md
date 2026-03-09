# Infæmous Freight

**AI-Powered Freight & Logistics Automation Platform**

Infæmous Freight is a modern logistics intelligence platform for shipment tracking, dispatch operations, carrier management, and AI-powered routing workflows.

[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml) [![CodeQL](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml) [![Security Audit](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml)

## Core Areas

- AI command orchestration
- shipment monitoring
- carrier management
- freight intelligence
- dispatch operations

## Repository Shape

This monorepo is organized around runnable products (`apps/`), reusable modules (`packages/`), documentation (`docs/`), and deployment assets (`infrastructure/` + platform configs). The structure is designed to keep the platform scalable as API, dashboard, and mobile capabilities evolve.

```text
apps/
  api/       Express and orchestration services
  web/       Next.js operations dashboard
  mobile/    React Native / Expo mobile workflows

packages/
  genesis/   Core domain logic and orchestration
  shared/    Shared types, schemas, and utilities

docs/
  architecture/
  api/
  operations/
```

## Local Setup

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate

git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

cp .env.example .env
pnpm install
pnpm build
```

## Development

```bash
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

## Validation

```bash
pnpm run validate
# or step-by-step
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

## Documentation

- [Technical Architecture](./docs/architecture/technical-architecture.md)
- [System Execution Blueprint](./docs/architecture/system-execution-blueprint.md)
- [Deployment Guide](./docs/operations/deployment.md)

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for contribution standards and PR workflow.
