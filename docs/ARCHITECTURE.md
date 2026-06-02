<p align="center">
  <a href="https://infamousfreight.com" target="_blank" rel="noopener noreferrer">
    <img src="/docs/screenshots/infamousfreight-header.svg" alt="Infamous Freight" width="100%">
  </a>
</p>

# Infamous Freight — Canonical Architecture Reference

_Last updated: June 2026_

This document is the single source of truth for the Infamous Freight backend architecture.
Update this file whenever the framework, entry point, ports, or route structure changes.

---

## Canonical Backend: Express 5

The active backend is an **Express 5** application written in TypeScript.

| File | Purpose |
|---|---|
| `apps/api/src/server.ts` | HTTP server entry point — calls `createApp()` and binds to `PORT` |
| `apps/api/src/app.ts` | Express app factory — registers middleware, health checks, and all API routes |
| `apps/api/src/data-store.ts` | Data access layer (Prisma ORM) |
| `apps/api/src/billing.ts` | Stripe billing helpers |
| `apps/api/src/ai-usage.ts` | AI usage tracking store |
| `apps/api/src/stripe-webhook-events.ts` | Stripe webhook event idempotency store |

The server starts via:

```bash
# development
pnpm run dev:api          # uses tsx watch on apps/api/src/server.ts

# production
pnpm run start            # runs node apps/api/dist/src/server.js after build
```

---

## Ports

| Context | Port / URL | Source |
|---|---|---|
| Local API development | `http://localhost:3000` | `apps/api/src/server.ts` default (`PORT ?? 3000`) |
| Vite dev proxy target | `http://localhost:3000` | `apps/web/vite.config.ts` default `VITE_DEV_API_PROXY_TARGET` |
| Docker Compose API internal port | `3000` | `docker-compose.yml` → `PORT: 3000` |
| Docker Compose direct API diagnostics | `http://localhost:4000` | `docker-compose.yml` host mapping `4000:3000` |
| Docker Compose web entrypoint | `http://localhost:3000` | nginx `web` container maps host `3000` to container `80` |
| Docker nginx API upstream | `http://api:3000` | `nginx.conf` proxy target |
| Fly.io API internal port | `3000` | `fly.toml` → `internal_port = 3000` |
| Production direct API | `https://api.infamousfreight.com` | Netlify/Fly production routing |
| Production browser API path | `https://www.infamousfreight.com/api` | same-origin Netlify proxy to Fly API |

> **Port rule:** The API process binds to port `3000` inside local, Docker, and Fly runtimes. Docker exposes a separate host diagnostic port `4000`, while the Docker web container uses host port `3000` for browser access.

---

## Framework Decision

**Canonical backend framework: Express 5**

The API package uses Express as its only backend runtime. The server starts from `apps/api/src/server.ts`, which imports `createApp()` from `apps/api/src/app.ts`. Earlier alternate-framework planning files were removed because they were not represented in `apps/api/package.json`, were not wired into production, and created a second apparent backend architecture.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Socket.io | `apps/web` |
| Backend | **Express 5**, TypeScript | `apps/api` |
| ORM | Prisma | PostgreSQL schema in `apps/api/prisma/` |
| Database | PostgreSQL 16+ / Supabase Postgres | Supabase production project currently reports Postgres 17 |
| Cache | Redis 7 | Local/Docker support; production optional by env |
| Payments | Stripe | Checkout, Customer Portal, Webhooks |
| Auth | Supabase Auth + JWT-derived trusted claims | Production protected routes derive user, tenant, and role from verified bearer tokens |
| Monitoring | Sentry (`@sentry/node`) | Opt-in via `SENTRY_DSN` |
| Deployment | Fly.io (API), Netlify (Web) | |
| Tracking/Routing | Traccar + GraphHopper | Planned integrations; see `docs/logistics-gems-integration-blueprint.md` |

## Netlify Web Runtime

Netlify builds only the React/Vite web app and publishes `apps/web/dist`.

The production browser API path is `/api`, not a hardcoded direct API origin. Netlify currently keeps repo-owned functions disabled for normal deploys, proxies `/api/health`, exact public freight paths, and broader `/api/*` traffic to the Fly.io API, and serves the SPA fallback after those API rules.

The canonical public web host is `https://www.infamousfreight.com`. The apex domain and default Netlify hostname redirect to that host.

---

## Implemented API Routes

See [`docs/API-REFERENCE.md`](API-REFERENCE.md) for the full route reference.

---

## Docker Setup

```bash
docker compose up -d
```

Services started:

- `postgres` — PostgreSQL on host `127.0.0.1:5432`
- `redis` — Redis on host `127.0.0.1:6379`
- `api` — Express 5 API on internal container port `3000`, exposed to host `127.0.0.1:4000`
- `web` — nginx serving the React SPA on host `3000`, proxying `/api` and `/socket.io` to `api:3000`

The API container runs `node apps/api/dist/src/server.js` with `PORT=3000`.

---

## Local Development Setup

```bash
# 1. Install dependencies + create .env files from examples
pnpm run env:setup

# 2. Set up the database (generate Prisma client, run migrations, seed)
pnpm run db:setup

# 3. Start both API and web in watch mode
pnpm run dev
```

---

## Planned / In-Development Features

The following feature areas are not fully production-ready in the active Express API. Add or complete them as Express route modules when they become product priorities:

| Module | Directory | Status |
|---|---|---|
| Load board aggregation | Express route module / existing load APIs | Partially implemented; production workflow evidence still required |
| Invoice / BOL / POD | Express route module | Not fully implemented |
| ELD integrations | Express route module | Not fully implemented |
| AI site assistant chat | `apps/api/src/ai-chat.ts` | Implemented at `POST /api/chat` with SSE streaming |
| Driver payroll | Express route module | Not implemented |
| Factoring | Express route module | Not implemented |
| CSA compliance monitoring | Express route module | Not implemented |
| Document expiry | Express route module | Not implemented |
| Accounting / QuickBooks / Xero | Express route module | Not fully implemented |
| Rate analytics | Express route module | Not fully implemented |
| Broker credit scoring | Express route module | Not implemented |
| Geofencing / ETA | Traccar + GraphHopper integration modules | Planned; see logistics gems blueprint |
| IFTA reporting | Express route module | Not implemented |
| Rate confirmations | Express route module | Not implemented |
| Auto-dispatch AI | Dispatch automation / routing modules | Partially implemented; production evidence still required |

**Implementation path:** Add route handlers in `apps/api/src/app.ts` or extracted Express Router files, then wire them to the Prisma data store and existing framework-free domain helpers.

---

## Deprecated / Superseded Route Patterns

The following route patterns appear in older planning documents but are **not implemented** in the current codebase:

| Planned route pattern | Status | Notes |
|---|---|---|
| `GET /api/freight/:resource` | Not implemented | Superseded by `/api/freight-operations/:resource` |
| `POST /api/freight/:resource` | Not implemented | Superseded by `/api/freight-operations/:resource` |
| tRPC-style type-safe RPC | Not used | API uses REST over HTTP |

---

## Related Documents

- [`docs/API-REFERENCE.md`](API-REFERENCE.md) — Implemented API routes
- [`docs/INTEGRATIONS-AND-SECRETS.md`](INTEGRATIONS-AND-SECRETS.md) — External integrations and secret management
- [`docs/logistics-gems-integration-blueprint.md`](logistics-gems-integration-blueprint.md) — Traccar, GraphHopper, and logistics OSS adoption plan
- [`docs/production-launch-evidence.md`](production-launch-evidence.md) — Production launch gate evidence checklist
- [`docs/REPO-ACCURATE-STATUS.md`](REPO-ACCURATE-STATUS.md) — Evidence-based capability claims
