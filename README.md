# Infamous Freight

Infamous Freight is a freight operations platform focused on dispatch, load visibility, carrier operations, invoicing, compliance workflows, and logistics automation.

This repository is a **JavaScript/TypeScript monorepo** with:

- `apps/web` — React + Vite frontend
- `apps/api` — NestJS API
- PostgreSQL via Prisma
- Redis-backed infrastructure modules
- Netlify and Fly.io deployment configuration

## Current status

The repo is actively evolving. A number of major product areas already exist in source form, but some modules are still being wired together and production hardening is still in progress.

### What is implemented today

- React web application with dashboard, dispatch, driver, invoices, compliance, analytics, onboarding, login, and supporting pages
- NestJS API entrypoint and modular feature structure
- Prisma schema for core freight entities such as carriers, drivers, loads, invoices, documents, team members, and audit logs
- Deployment configuration for Fly.io and Netlify
- Basic API health test coverage
- Sentry and Vercel Speed Insights setup on the frontend

### What still needs work

- More complete API test coverage
- CI enforcement on every change
- End-to-end environment validation
- Stronger deployment parity between local, Docker, and hosted environments
- More consistent documentation between product vision and actual shipped code

## Repository structure

```text
.
├── apps/
│   ├── api/                # NestJS API
│   │   ├── prisma/         # Prisma schema
│   │   ├── src/            # Feature modules and controllers
│   │   └── test/           # API tests
│   └── web/                # React + Vite frontend
│       └── src/            # Pages, components, layouts, store
├── docs/                   # Screenshots and supporting docs
├── scripts/                # Workspace helper scripts
├── docker-compose.yml
├── Dockerfile.api
├── fly.toml
├── netlify.toml
└── .env.example
```

## Tech stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS
- Sentry

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- Jest + Supertest

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose
- PostgreSQL and Redis if running without Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

Then fill in the values required for your local environment.

### 3. Start infrastructure

```bash
docker-compose up -d postgres redis
```

### 4. Run database setup

```bash
npm run db:setup
```

### 5. Start the app

```bash
npm run dev
```

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Environment variables

A starter `.env.example` is included. It covers:

- database connection
- Redis
- API runtime
- Stripe
- Supabase
- load board integrations
- ELD providers
- accounting integrations
- email delivery
- frontend runtime values

Do not commit real secrets.

## Testing

Current automated coverage is focused on the API health endpoint.

```bash
npm run test
```

The next recommended step is to add controller, service, and integration tests around loads, invoices, auth, and billing flows.

## Deployment

### Frontend
- Netlify configuration lives in `netlify.toml`

### API
- Fly.io configuration lives in `fly.toml`

Before deploying, make sure hosted environment variables are present and match the ports and URLs used by the application.

## Documentation and contribution standards

- Use Conventional Commits where practical
- Keep README and deployment docs aligned with the actual codebase
- Add tests for new API behavior
- Document any required environment variable changes in pull requests

See `CONTRIBUTING.md` for repo standards.

## Security basics

- Never commit secrets
- Validate external input
- Keep CORS and auth settings environment-aware
- Prefer least-privilege access for third-party integrations
- Review deployment configs whenever ports, prefixes, or auth flows change

## License

Copyright Infamous Freight. All rights reserved.
