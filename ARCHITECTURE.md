# Repository Architecture

## Purpose

This document defines the canonical structure of the Infæmous Freight monorepo.

The goal is to keep a large platform repository legible, enforceable, and safe to evolve.

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Node.js 22.x | `engines.node: "22.x"` |
| Package manager | pnpm 9.x | `pnpm-workspace.yaml`, `shamefully-hoist=true` |
| API framework | Express 5 | TypeScript ESM (`"type":"module"`) |
| Frontend | Next.js 14 + React 18 | App Router + Pages Router |
| Mobile | React Native + Expo | TypeScript |
| ORM | Prisma 6 | PostgreSQL 16 |
| Cache / Queue | Redis 7 | BullMQ for background jobs |
| Auth | JWT (HMAC/RS256) | `jsonwebtoken`, optional JWKS middleware |
| Logging | Pino 10 | JSON in production, pino-pretty in dev |
| Validation | Zod 4 | All env vars and request bodies |
| Testing | Vitest 4 (API/shared), Playwright (E2E) | |
| CI/CD | GitHub Actions | `ci.yml`, `cd.yml`, `fly-deploy.yml` |
| Deployment | Fly.io | `fly.toml` per workspace |

---

## Monorepo Directory Tree

```
.
├── apps/
│   ├── api/            – Node.js/TypeScript Express backend
│   │   ├── src/
│   │   │   ├── index.ts        – ESM entry point (graceful shutdown)
│   │   │   ├── app.ts          – Express app factory
│   │   │   ├── env.ts          – Zod-validated environment config
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts   – Pino structured logger
│   │   │   │   └── errors.ts   – AppError hierarchy
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── requestId.ts
│   │   │   ├── routes/         – Express route handlers
│   │   │   ├── services/       – Business logic
│   │   │   └── middleware/     – Auth, rate-limit, audit, validation
│   │   ├── prisma/             – Prisma schema + migrations
│   │   ├── tsconfig.json
│   │   └── tsconfig.build.json
│   ├── web/            – Next.js 14 frontend
│   ├── mobile/         – React Native / Expo
│   ├── worker/         – Background job workers (BullMQ)
│   └── ai/             – AI orchestration runtime (TypeScript)
├── packages/
│   ├── shared/         – @infamous-freight/shared (types, utils, zod schemas)
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       │   ├── dispatch.ts – Shipment, ShipmentStatus, DispatchAssignment
│   │       │   ├── fleet.ts    – Vehicle, VehicleStatus, FleetTelemetry
│   │       │   ├── driver.ts   – Driver, DriverStatus, DriverCoachingEvent
│   │       │   └── ops.ts      – Organization, OrgPlan, AuditEvent
│   │       ├── constants.ts
│   │       ├── utils.ts
│   │       ├── rbac.ts
│   │       └── scopes.ts
│   └── genesis/        – Seed/factory helpers
├── e2e/                – Playwright E2E tests
├── .github/
│   └── workflows/      – CI/CD pipelines
├── tsconfig.base.json  – Root TypeScript base config (NodeNext)
├── eslint.config.js    – ESLint flat config
├── commitlint.config.cjs
└── playwright.config.ts
```

---

## Domain Boundaries

| Domain | Package / Module | Responsible for |
|--------|-----------------|-----------------|
| Dispatch | `packages/shared/src/types/dispatch.ts` | Shipment lifecycle, status transitions |
| Fleet | `packages/shared/src/types/fleet.ts` | Vehicle inventory, telematics |
| Driver | `packages/shared/src/types/driver.ts` | CDL management, coaching events |
| Operations | `packages/shared/src/types/ops.ts` | Organizations, plans, audit trail |
| API runtime | `apps/api/src/` | HTTP surface, auth, rate-limiting |
| Web UI | `apps/web/src/` | Next.js pages and components |
| Mobile | `apps/mobile/` | React Native screens |
| Background jobs | `apps/worker/` | Async processing via BullMQ |

---

## API Design Principles

1. **All routes** must use the standard middleware chain:
   `limiters → authenticate → requireOrganization → requireScope → auditLog → validators → handleValidationErrors`
2. **Errors** are always delegated via `next(err)` to the global `errorHandler` — never `res.status()` inline.
3. **Tenant isolation** — every database query must be scoped to `organizationId`; cross-tenant queries are prohibited.
4. **Validation** — all user-supplied input is validated with Zod schemas before use.
5. **No raw SQL** — Prisma is used exclusively for all database access.
6. **Structured logging** — use `logger` from `lib/logger.ts`, never `console.log`.

---

## Environment Variable Contract

All environment variables are validated at startup via Zod in `apps/api/src/env.ts`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development` \| `test` \| `production` |
| `PORT` | No | `4000` | API server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection URL |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 32 chars) |
| `CORS_ORIGIN` | No | — | Comma-separated allowed origins |
| `LOG_LEVEL` | No | `info` | `trace`\|`debug`\|`info`\|`warn`\|`error`\|`fatal` |

See `.env.example` for a template. **Never commit `.env` to git.**

---

## Module System Rules

- **All workspaces use ESM** (`"type": "module"` in each `package.json`).
- **TypeScript** targets `NodeNext` module resolution.
- **No `require()` or `module.exports`** in new code — CJS files must use `.cjs` extension.
- **Shared types** must be imported from `@infamous-freight/shared` (built dist), not from `@infamous-freight/shared/src` directly.
- **Build shared before API**: `pnpm --filter @infamous-freight/shared build` whenever shared types change.

---

## Security Baseline

- No secrets, API keys, or credentials committed to source code.
- All authentication and authorization checks are enforced via middleware — never bypassed.
- Rate limiting is applied to all public endpoints.
- Audit logs are written for all state-changing operations.
- Dependencies are scanned automatically on every CI run (`pnpm audit`).
- CodeQL analysis runs on the default branch and on pull requests.
- Cross-tenant data access is impossible by construction (all queries are tenant-scoped).

---

## Architectural Guardrails

1. Avoid duplicate top-level concepts.
2. Prefer moving code into an existing canonical root over creating a new one.
3. Require a `README.md` for every top-level directory that is not self-evident.
4. Every top-level domain must have an owner in `OWNERSHIP.md`.
5. Every ambiguous domain must have an action item in `CONSOLIDATION_PLAN.md`.
