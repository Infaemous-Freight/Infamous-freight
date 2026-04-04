# Infæmous Freight

<p align="left">
  <img alt="Node.js 24.x" src="https://img.shields.io/badge/node-24.x-339933?logo=node.js&logoColor=white" />
  <img alt="pnpm 9.x" src="https://img.shields.io/badge/pnpm-9.x-F69220?logo=pnpm&logoColor=white" />
  <img alt="Monorepo" src="https://img.shields.io/badge/monorepo-pnpm-18181B" />
  <img alt="Logistics Platform" src="https://img.shields.io/badge/domain-logistics-blue" />
</p>

**Infæmous Freight** is an AI-powered freight operations platform built for dispatch automation, shipment visibility, fleet coordination, and logistics intelligence.

It is structured as a **pnpm monorepo** with shared infrastructure powering three core product surfaces:

- **API** for logistics orchestration and business workflows
- **Web** for operations control and visibility
- **Mobile** for field and driver-facing workflows

## Why this exists

Freight teams need more than basic tracking. Infæmous Freight is designed to act as a **freight operating system** that helps teams:

- automate dispatch workflows
- track shipments across their lifecycle
- monitor fleet activity in real time
- coordinate drivers and operational events
- surface analytics that improve speed, visibility, and decision-making
- use AI to query, assist, and accelerate day-to-day operations

## Platform surfaces

| Surface | Role |
| --- | --- |
| **Infæmous Freight** | Core platform and system of record for freight operations |
| **Genesis Avatar** | AI interaction layer for commands, operational questions, and workflow assistance |
| **Platform Infrastructure** | Shared authentication, tenant isolation, observability, data orchestration, and domain services |

## Repository layout

```text
apps/
  api/        Backend logistics engine
  web/        Operations dashboard
  mobile/     Mobile operations interface

packages/
  shared/     Shared schemas, utilities, and domain models
```

Additional internal workspaces also exist in the monorepo, including AI and worker surfaces.

## Technology stack

| Layer | Stack |
| --- | --- |
| Backend | Node.js, Express, Prisma ORM, PostgreSQL, Redis |
| Web | Next.js, TypeScript |
| Mobile | React Native, Expo |
| Infrastructure | Docker, GitHub Actions, CodeQL, security audit pipelines |

## Quick start

### 1) Clone the repository

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight
```

### 2) Enable pnpm via Corepack

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

> **Runtime requirement:** this repository requires **Node.js 24.x** and **pnpm 9.x**.

### 3) Copy environment variables

```bash
cp .env.example .env
```

### 4) Install dependencies

```bash
pnpm install
```

### 5) Prepare local services and the database

If you are using local PostgreSQL directly:

```bash
createdb infamous_freight
```

Then initialize Prisma and migrations:

```bash
pnpm prisma:generate
pnpm db:migrate
```

### 6) Start the surfaces you need

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

## Environment configuration

Start with `.env.example` and fill in the values required for your setup.

The template includes configuration for:

- PostgreSQL
- Redis
- JWT auth
- Sentry
- object storage
- Stripe
- AI providers
- external integrations

## Development commands

### pnpm scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the API in development mode |
| `pnpm dev:api` | Start the API only |
| `pnpm dev:web` | Start the web app only |
| `pnpm dev:mobile` | Start the mobile app only |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Run TypeScript checks across the repo |
| `pnpm lint` | Run linters across workspaces |
| `pnpm test` | Run tests across workspaces |
| `pnpm validate` | Run build, typecheck, lint, and test |

### Make targets

| Command | Description |
| --- | --- |
| `make install` | Install dependencies |
| `make dev` | Start the API |
| `make dev-api` | Start the API only |
| `make dev-web` | Start the web app only |
| `make dev-mobile` | Start the mobile app only |
| `make dev-all` | Start the API, web, and mobile apps concurrently |
| `make infra-up` | Start the Docker Compose services for postgres, redis, and the API |
| `make infra-down` | Stop the Docker Compose services for postgres, redis, and the API |
| `make infra-logs` | Tail logs for the Docker Compose services |
| `make smoke` | Run the local smoke test |
| `make validate` | Run the full validation pipeline |

## Local infrastructure

Use the local infrastructure workflow when you want the repo-managed dev environment:

```bash
make infra-up
make infra-logs
make smoke
make infra-down
```

## Validation before PRs

Before opening a pull request, run:

```bash
pnpm validate
```

CI is intended to enforce a clean baseline across build, lint, typecheck, tests, and security workflows.

## Contributing

### Keep changes focused

- keep pull requests scoped
- avoid unrelated file changes
- document operational impact when relevant
- include logs or screenshots when they improve review quality

### Branch naming examples

- `feature/dispatch-engine`
- `feature/shipment-tracking`
- `fix/api-timeout`
- `docs/readme-update`

### Commit format

This repository follows **Conventional Commits**.

Examples:

- `feat: add shipment tracking API`
- `fix: resolve pnpm workspace dependency issue`
- `docs: improve onboarding and README structure`

## Security

- never commit secrets
- validate external inputs
- preserve RBAC and tenant boundaries
- keep production credentials in managed secret stores

## Android / Termux setup

If you develop from Android, use the official **Termux** release from **F-Droid** or **GitHub**, not the deprecated Google Play build.

```bash
pkg update && pkg upgrade -y
pkg uninstall nodejs nodejs-lts -y
pkg install nodejs -y
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
```

---

Built for predictable, repeatable, production-grade freight operations.
