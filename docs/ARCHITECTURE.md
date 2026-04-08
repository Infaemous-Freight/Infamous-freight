# Architecture Overview

> For the full technical narrative, see
> [`docs/architecture.md`](architecture.md).

## Monorepo Layout

```
apps/
  api/       Express REST API — auth, routing, Prisma ORM, PostgreSQL
  web/       Next.js 14 operations dashboard — TypeScript, Tailwind CSS
  mobile/    React Native + Expo cross-platform app

packages/
  shared/    Domain types, Zod schemas, constants, shared utilities
```

## High-Level Layers

```
Client (Web / Mobile)
  └── API Gateway  (apps/api — Express, JWT, rate limiting)
        └── AI Orchestration Layer  (prompt routing, skill selection)
              └── Business Logic Engine  (billing, dispatch, compliance)
                    └── Data + Memory Layer  (PostgreSQL + Redis)
                          └── Automation + Jobs  (BullMQ / scheduled tasks)
```

### Layer Responsibilities

| Layer                | Responsibility                                              |
| -------------------- | ----------------------------------------------------------- |
| **Client**           | Stateless UI — Next.js SSR pages, React Native screens      |
| **API Gateway**      | Auth (JWT/JWKS), rate limiting, request validation, routing |
| **AI Orchestration** | Prompt routing, model selection, memory injection, fallback |
| **Business Logic**   | Domain services: loads, shipments, billing, compliance      |
| **Data Layer**       | PostgreSQL (Prisma), Redis cache/session, audit streams     |
| **Jobs**             | Scheduled tasks, background workers, health checks          |

## Key Technology Choices

| Concern         | Technology                                  |
| --------------- | ------------------------------------------- |
| Runtime         | Node.js 24.x                                |
| Package manager | pnpm 9.x (workspace monorepo)               |
| API framework   | Express + TypeScript                        |
| ORM             | Prisma                                      |
| Database        | PostgreSQL                                  |
| Frontend        | Next.js 14, TypeScript, Tailwind CSS        |
| Mobile          | React Native, Expo                          |
| Auth            | JWT (HMAC default, optional RS256 via JWKS) |
| Validation      | Zod (shared schemas in `@infamous/shared`)  |
| CI              | GitHub Actions                              |

## Cross-Cutting Concerns

- **Multi-tenancy**: All database queries are tenant-scoped by construction.
- **Security**: No raw SQL — Prisma only. All endpoints use the standard
  middleware stack.
- **Shared contracts**: Domain types and Zod schemas live in `packages/shared`
  and are imported by all apps.
- **Secrets**: Never committed; managed via `.env` locally and GitHub Secrets in
  CI.

## Further Reading

- [`docs/architecture.md`](architecture.md) — full technical narrative
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) — deployment guide
- [`docs/adr/`](adr/) — Architecture Decision Records
