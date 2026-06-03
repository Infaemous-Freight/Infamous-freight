# INFÆMOUS FREIGHT

### 🚛 AI-powered freight operations platform

Dispatch • Fleet Intelligence • Driver Coordination • Shipment Visibility • Compliance • Billing • Analytics • Enterprise Logistics Execution

![license](https://img.shields.io/github/license/Infaemous-Freight/Infamous-freight)
[![code style: TypeScript](https://img.shields.io/badge/code%20style-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![deploy](https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/deploy.yml/badge.svg)](https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/deploy.yml)
![Production Readiness](https://img.shields.io/badge/Production%20Readiness-96%25-brightgreen)
![Node](https://img.shields.io/badge/Node-22.x-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Fly.io](https://img.shields.io/badge/API-Fly.io-purple)
![Netlify](https://img.shields.io/badge/Web-Netlify-teal)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

---

## 🚛 Overview

**INFÆMOUS FREIGHT** is an AI-powered freight operations platform built to help carriers, brokers, dispatchers, owner-operators, shippers, and logistics teams manage freight execution from intake through delivery.

The platform is designed as a unified command center for dispatch execution, load and shipment visibility, driver coordination, fleet intelligence, compliance workflows, billing, operational analytics, and AI-assisted freight automation.

Built as a **pnpm monorepo**, the current production path uses a **React 19 + Vite web application on Netlify**, an **Express 5 API on Fly.io**, **Prisma-backed PostgreSQL access in the active API**, and **Stripe-powered billing**. Drizzle/Netlify Database assets may exist for Netlify form-submission workflows, but the active API runtime should be treated as Prisma-backed unless [`docs/current-status.md`](docs/current-status.md) says otherwise.

> **Status source of truth:** For what is currently live, demo-backed, gated, or still in progress, always use [`docs/current-status.md`](docs/current-status.md). README provides platform positioning and onboarding context; when there is any conflict, `docs/current-status.md` is authoritative.

---

## ✅ Runtime Readiness Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Web deployment | Live path active | Netlify serves the React/Vite app. |
| API deployment | Live path active | Fly.io hosts the Express API behind same-origin `/api/*` browser traffic. |
| Billing/paywall | Live | Stripe billing and paid-access paths are production-enabled. |
| Public tracking | Foundation active | Positive production lookup requires a known-safe public tracking record for launch evidence. |
| Public quote/contact intake | Active path | Verify and record evidence after deploys. |
| Operator dashboard | Demo-backed | Live operations data wiring remains in progress. |
| Dispatch/load workflows | Demo-backed | Not yet the production source of dispatch execution. |
| Mobile app | Planned / not ready | `/driver-app` remains gated. |
| AI dispatch automation | In progress | Requires freight-domain guardrails, auditability, and operator approval. |

---

## 🚦 Production Status

| Area | Status |
| --- | --- |
| Netlify Web | ✅ Live |
| Fly.io API | ✅ Live |
| PostgreSQL | ✅ Live |
| Stripe Billing | ✅ Integrated |
| RBAC | ✅ Active |
| Tenant Isolation | ✅ Active |
| CI/CD | ✅ Active |
| Driver Tracking | 🚧 In Progress |
| Traccar Integration | 🚧 Planned |
| GraphHopper Routing | 🚧 Planned |
| Mobile App | 🚧 Planned |

---

## 🎯 Mission

INFÆMOUS FREIGHT exists to simplify freight operations by combining dispatch coordination, shipment tracking, compliance visibility, billing, analytics, and artificial intelligence into one operational platform.

The goal is to reduce fragmented logistics workflows, replace manual spreadsheets and disconnected tools, and give freight professionals a faster, clearer way to keep shipments moving.

---

## 👥 Who It Is For

| Audience | Use Case |
| --- | --- |
| 🚚 Owner-operators | Manage loads, documents, invoices, status updates, and day-to-day freight work. |
| 🚛 Carriers | Coordinate drivers, fleet activity, dispatch execution, compliance, and billing. |
| 📦 Freight brokers | Track shipments, manage customers, coordinate carriers, and monitor load execution. |
| 🏢 Shippers | Submit freight requests and monitor shipment movement. |
| 🧭 Dispatchers | Assign loads, coordinate drivers, update statuses, and manage operational workflows. |
| 🌎 Enterprise logistics teams | Centralize freight visibility, reporting, compliance, workflow automation, and governance. |

---

## 🔥 Platform Highlights

- ✅ **Production deployment path:** Netlify web frontend, Fly.io API backend, same-origin `/api/*` browser traffic, and health verification.
- ✅ **Billing foundation:** Stripe Checkout, Customer Portal, webhook handling, and paid access workflows.
- ✅ **Freight operations surfaces:** dispatch, loads, drivers, quotes, tracking, invoices, analytics, compliance, carriers, and accounting surfaces are represented in the app.
- 🧪 **In progress:** some internal operator modules are still demo-backed while production API wiring is completed.
- 🛣️ **Roadmap:** deeper AI-assisted dispatch, mobile operations, compliance automation, carrier workflows, and enterprise workflow hardening.

For exact route-by-route readiness, use [`docs/current-status.md`](docs/current-status.md).

---

## 🧩 Core Product Capabilities

### 🚚 Dispatch Management

- load assignment workflows
- dispatcher control surfaces
- driver coordination
- shipment status updates
- operational exception visibility

### 📦 Shipment Tracking

- public shipment tracking path
- customer-facing shipment visibility
- tracking-number validation
- status and timestamp visibility
- safe public payload handling

### 👨‍✈️ Driver Operations

- driver roster surfaces
- driver coordination workflows
- operational status visibility
- future mobile driver workflow support

### 💳 Billing & Payments

- Stripe Checkout
- Stripe Customer Portal
- one-time payment support
- webhook processing
- paid-access gating
- billing and invoice surfaces

### 🛡️ Compliance Workflows

- compliance panel surfaces
- document and expiration tracking direction
- operational governance posture
- security-conscious data handling

### 📊 Analytics & Fleet Intelligence

- dashboard metrics
- load and shipment visibility
- operational reporting surfaces
- AI-assisted freight intelligence direction

---

## 🤖 AI Freight Intelligence

INFÆMOUS FREIGHT is being built toward AI-assisted logistics execution, including dispatch recommendations, freight workflow automation, operational insights, shipment exception detection, notification support, analytics summaries, predictive routing, and load-planning opportunities.

AI features should be implemented with freight-domain guardrails, auditability, and operator approval.

---

## 📦 Monorepo Overview

| Path | Purpose |
| --- | --- |
| `apps/api` | Node.js + Express 5 backend, TypeScript, Prisma-backed PostgreSQL access, billing helpers, health checks, and freight workflow logic. |
| `apps/web` | React 19 + Vite frontend, TypeScript, Tailwind CSS, operator surfaces, public routes, and browser API helpers. |
| `apps/mobile` | Reserved mobile surface for future driver/operator workflows. |
| `netlify/functions` | Retained fallback function entrypoints; normal deploys currently proxy browser API traffic to Fly.io. |
| `netlify/event-functions` | Event-handler bundle area for event workflows when enabled. |
| `netlify/disabled-functions` | Parked handlers that can be restored when runtime constraints are resolved. |
| `docs` | Architecture, launch, operations, security, production-readiness, Stripe, Netlify, and environment references. |
| `scripts` | Local setup, validation, deployment helpers, smoke tests, and operational tooling. |
| `.github` | CI workflows, repository automation, and metadata. |

---

## 🧱 Active Tech Stack

| Layer | Technology |
| --- | --- |
| 🎨 Frontend | React 19, Vite, TypeScript, Tailwind CSS, Zustand |
| 🧠 Backend | Express 5, TypeScript, Prisma |
| 🗄️ Database | PostgreSQL, Prisma ORM, Supabase RLS, Redis where configured |
| ⚡ Cache | Redis where configured |
| 🔐 Auth | Netlify Identity, JWT trusted claims, and Supabase-backed authorization |
| 💳 Billing | Stripe Checkout, Customer Portal, webhooks, and one-time payments |
| ☁️ Deployment | Netlify web, Fly.io API, Docker |
| 🚨 Monitoring | Sentry opt-in through environment configuration |

---

## 🏗️ Solution Architecture

```text
Browser / Web App
      │
      ▼
Netlify Web + Same-Origin /api Proxy
      │
      ▼
Fly.io Express API
      │
      ├── PostgreSQL via Prisma
      ├── Redis where configured
      ├── Stripe Billing
      ├── Netlify Identity / JWT Claims
      ├── Supabase-backed authorization and RLS
      └── Optional Sentry Monitoring
```

Full references:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md)

---

## 📸 Screenshots & Visual Assets

Current repository visuals, when present:

```md
![Landing Experience](docs/screenshots/infamousfreight-landing-page.svg)
![Platform Overview](docs/screenshots/infamousfreight-platform-overview.svg)
```

Recommended screenshot targets:

| View | Target File |
| --- | --- |
| Landing page | `docs/screenshots/landing-page.png` |
| Quote request page | `docs/screenshots/quote-request.png` |
| Tracking page | `docs/screenshots/tracking-page.png` |
| Operator dashboard | `docs/screenshots/operator-dashboard.png` |
| Dispatch Board | `docs/screenshots/dispatch-board.png` |
| Shipment Detail | `docs/screenshots/shipment-detail.png` |
| Driver Operations | `docs/screenshots/driver-ops.png` |
| Billing / Invoicing | `docs/screenshots/billing-invoice.png` |
| Analytics Dashboard | `docs/screenshots/analytics-dashboard.png` |
| Compliance Panel | `docs/screenshots/compliance-panel.png` |

See [`docs/SCREENSHOTS.md`](docs/SCREENSHOTS.md) for the screenshot checklist.

### 🖼️ GitHub Social Preview

The social preview image should live at `.github/social-preview.png`.

```bash
pnpm run social-preview:generate
```

Then upload the PNG manually in GitHub under **Settings → General → Social preview**.

---

## ⚡ Quick Start

```bash
pnpm install
pnpm run env:setup
# Edit .env files for repo root, apps/api, and apps/web as needed
pnpm run db:setup
pnpm run dev
```

Recommended local infrastructure alternative:

```bash
docker-compose up -d
```

Further setup references:

- [`docs/LOCAL_STARTUP_CHECKLIST.md`](docs/LOCAL_STARTUP_CHECKLIST.md)
- [`docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md`](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)

> Never commit secrets. Use local `.env` files and managed deployment secret stores.

---

## 🌐 Public And App Surfaces

### Public marketing and intake routes

- `/`
- `/services`
- `/request-quote`
- `/track-shipment`
- `/customer-portal`
- `/carrier-portal`
- `/load-board`
- `/pricing`
- `/partners`
- `/drive`
- `/contact`

### Authenticated operational routes

- `/ops`
- `/loads`
- `/dispatch`
- `/drivers`
- `/invoices`
- `/analytics`
- `/compliance`
- `/settings`
- `/billing`
- `/carriers`
- `/accounting`
- `/quotes`

---

## 🔌 API And Netlify Routing

Production browser traffic should use the same-origin Netlify API path:

```bash
VITE_API_URL=/api
```

The committed Netlify configuration publishes the Vite output from `apps/web/dist`, redirects the apex and default Netlify hostname to `https://www.infamousfreight.com`, keeps repo-owned Netlify Functions out of normal deploys, proxies `/api/health`, public freight intake paths, broader `/api/*` traffic, and `/socket.io/*` traffic to the Fly.io API, and keeps the SPA fallback last.

Launch-critical checks should verify:

- `https://www.infamousfreight.com`
- `https://infamousfreight.com` redirecting to the `www` host
- `https://www.infamousfreight.com/api/health`
- public API routes under `/api/public/*` through the Netlify-to-Fly proxy

Direct `api.infamousfreight.com` checks are useful for operations diagnostics after DNS and Fly health are confirmed.

---

## 🔌 Health & Runtime Verification

Recommended checks:

```bash
curl -X GET https://www.infamousfreight.com/api/health
curl -X GET https://www.infamousfreight.com/api/health/live
curl -X GET https://www.infamousfreight.com/api/health/ready
```

Use these during:

- local verification
- pre-launch validation
- post-deploy smoke checks
- production incident response

---

## 🧪 CI/CD & Quality Gates

| Gate | Purpose |
| --- | --- |
| Lint | Code style and hygiene |
| Typecheck | Strict TypeScript validation |
| Test | Deterministic verification |
| Build | CI-stable output |
| Runtime checks | Docker, Fly, and health validation |

- CI runs through GitHub Actions under `.github/workflows/`.
- All checks must pass before PR merge.
- Workspace scripts enforce path discipline, validation consistency, and environment sanity.

---

## 🗂️ Project Structure

```text
apps/
  api/      # Express 5 backend, TypeScript, Prisma
  web/      # React 19 + Vite frontend
  mobile/   # Reserved mobile surface

netlify/
  functions/            # Public intake and lookup routes retained for fallback/future packaging
  database/migrations/  # Netlify database migrations where used

docs/       # Architecture, operations, launch, readiness
scripts/    # Setup, validation, deployment, runtime checks
.github/    # CI workflows, automation, repository metadata
```

---

## 🛣️ Roadmap

### Phase 1 — Production foundation

- Authentication and owner-controlled access
- Billing and paid-access gating
- Dispatch/load workflow foundations
- RBAC and tenant isolation
- Netlify/Fly deployment hardening

### Phase 2 — Logistics integrations

- Driver tracking foundation
- Traccar integration
- GraphHopper routing and dispatch scoring
- Geofencing workflows
- Public tracking evidence collection

### Phase 3 — Intelligence and scale

- AI dispatch optimization
- Predictive ETA and exception detection
- Fleet intelligence and performance scoring
- Mobile driver operations
- Enterprise compliance and audit workflows

---

## 📝 Coding Standards

- TypeScript-first implementation.
- pnpm workspace discipline.
- Explicit exports and small composable functions.
- Predictable file layouts.
- Clear domain boundaries across dispatch, fleet, driver, billing, and operations modules.
- All changes must pass lint, typecheck, test, and build.
- Environment configuration belongs in `.env` files and managed secret stores.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for PR and style expectations.

---

## 👩‍💻 Contributing & Onboarding

- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for full guidelines.
- Every PR should include a clear summary, logical commit structure, and CI readiness.
- Branches should follow `feature/*`, `fix/*`, `docs/*`, `chore/*`, or `security/*`.
- Use GitHub Discussions or Issues for questions and planning.

---

## 📚 Documentation

- [`docs/README.md`](docs/README.md) — Project docs index
- [`docs/LOCAL_STARTUP_CHECKLIST.md`](docs/LOCAL_STARTUP_CHECKLIST.md) — Local startup checklist
- [`docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md`](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md) — Environment variables reference
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Detailed architecture
- [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md) — API reference
- [`docs/current-status.md`](docs/current-status.md) — Runtime truth and current readiness

---

## 🚀 Deployment & Operations

Pushes to `main` can deploy:

- API to Fly.io
- Web to Netlify

Supporting references:

- [`docs/production-operations/README.md`](docs/production-operations/README.md)
- [`docs/INTEGRATIONS-AND-SECRETS.md`](docs/INTEGRATIONS-AND-SECRETS.md)
- [`docs/NETLIFY-BUILDHOOKS.md`](docs/NETLIFY-BUILDHOOKS.md)
- [`docs/CUSTOM-DOMAIN.md`](docs/CUSTOM-DOMAIN.md)
- [`docs/netlify-deploy-checklist.md`](docs/netlify-deploy-checklist.md)

Verification should always include:

- `https://www.infamousfreight.com`
- redirect from `https://infamousfreight.com`
- `https://www.infamousfreight.com/api/health`
- public intake routes under `/api/public/*`
- Fly.io runtime status after deploy

---

## 🔒 Security & Compliance

- External input must be validated before use.
- Secrets must never be hardcoded or committed.
- Production credentials belong in local or managed environment configuration.
- Least privilege should be preserved across platform services and workflows.
- Sentry monitoring and operational observability are supported when configured.
- RBAC and trusted-claim checks are enforced at the API layer.
- Supabase RLS and plan-aware auth hardening guidance are documented under `docs/security/`.

Responsible disclosure: see [`SECURITY.md`](SECURITY.md).

---

## 📄 License / Ownership

Copyright 2025–2026 Infamous Freight. All rights reserved. MIT License.

This project and its code/modules are production-sensitive. Handle them with the same care expected for enterprise procurement, auditing, customer review, and security operations.
