# INFÆMOUS FREIGHT

### 🚛 AI-powered freight operations platform

Dispatch • Fleet Intelligence • Driver Coordination • Shipment Visibility • Compliance • Billing • Analytics • Enterprise Logistics Execution

![license](https://img.shields.io/github/license/Infaemous-Freight/Infamous-freight)
[![code style: TypeScript](https://img.shields.io/badge/code%20style-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![deploy](https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/deploy.yml/badge.svg)](https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/deploy.yml)

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
| 🗄️ Database | PostgreSQL |
| ⚡ Cache | Redis where configured |
| 🔐 Auth | Supabase Auth and JWT-derived trusted claims |
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
      ├── Supabase Auth / JWT Claims
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

### Authenticated and operator-facing routes

- `/ops`
- `/loads`
- `/dispatch`
- `/ops/drivers`
- `/invoices`
- `/analytics`
- `/compliance`
- `/settings`
- `/settings/billing`
- `/billing`
- `/carriers`
- `/accounting`
- `/quotes`
- `/messages`
- `/driver-app`

Read [`docs/current-status.md`](docs/current-status.md) before treating any route as fully live, fully wired, or production-ready.

---

## 🔌 API And Netlify Routing

Production browser traffic should use the same-origin Netlify API path:

```bash
VITE_API_URL=/api
```

Launch-critical checks should verify:

- `https://www.infamousfreight.com`
- `https://infamousfreight.com` redirects to the `www` host
- `https://www.infamousfreight.com/api/health`
- public API routes under `/api/public/*` through the Netlify-to-Fly proxy

Direct `api.infamousfreight.com` checks are useful for operations diagnostics only after that domain is confirmed.

---

## 🧪 Production Smoke Testing

Recommended public production smoke check:

```bash
pnpm run production:smoke-test
```

Launch-critical manual checks should include canonical website load, apex-to-www redirect, health endpoints, public quote request, public shipment tracking cases, Stripe Checkout, Stripe Customer Portal, authenticated route gating, operator demo-backed warnings, and Netlify launch evidence capture.

See [`docs/PRODUCTION_SMOKE_TESTING.md`](docs/PRODUCTION_SMOKE_TESTING.md) for the full checklist.

---

## 🔌 Health & Runtime Verification

```bash
curl -X GET https://www.infamousfreight.com/api/health
curl -X GET https://www.infamousfreight.com/api/health/live
curl -X GET https://www.infamousfreight.com/api/health/ready
```

Use these during local verification, pre-launch validation, post-deploy smoke checks, and production incident response.

---

## 💼 Business Model

INFÆMOUS FREIGHT is designed for subscription-based freight operations access, with optional paid workflow features, billing tools, and future marketplace/automation opportunities.

Primary revenue paths may include monthly SaaS subscriptions, carrier and dispatcher operations plans, broker/team plans, enterprise logistics plans, paid billing/compliance/analytics workflows, and future transaction or automation-based revenue.

---

## 🧪 CI/CD & Quality Gates

| Gate | Purpose |
| --- | --- |
| Lint | Code style and hygiene |
| Typecheck | Strict TypeScript validation |
| Test | Deterministic verification |
| Build | CI-stable production output |
| Runtime checks | Docker, Fly.io, Netlify, API health, and smoke validation |

Repository rules:

- CI runs through GitHub Actions under [`.github/workflows/`](.github/workflows/).
- Pull requests should not merge unless lint, typecheck, build, tests, and relevant runtime checks pass.
- Environment checks must pass before production deployment.
- Secrets must never be committed to source control.

---

## 🗂️ Project Structure

```text
apps/
  api/      # Express 5 backend, TypeScript, Prisma
  web/      # React 19 + Vite frontend
  mobile/   # Reserved mobile surface

netlify/
  event-functions/      # Event-handler bundle area
  disabled-functions/   # Parked handlers
  functions/            # Retained fallback API function entrypoints
  database/migrations/  # Netlify database migrations

docs/       # Architecture, operations, launch, readiness
scripts/    # Setup, validation, deployment, runtime checks
.github/    # CI workflows, automation, repository metadata
```

---

## 📝 Coding Standards

- TypeScript-first implementation
- pnpm workspace discipline
- explicit exports
- small composable modules
- predictable file layouts
- clear domain boundaries across dispatch, fleet, driver, billing, compliance, and operations modules
- strict validation for external input
- environment-driven configuration
- no secrets in code
- lint, typecheck, tests, and builds required before merge

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for PR and style expectations.

---

## 🛡️ Security & Compliance

INFÆMOUS FREIGHT is built with production-sensitive freight workflows in mind.

Security posture includes JWT-based authentication flow, trusted-claim checks, role-based access control direction, environment-based secret management, strict external input validation, CI-enforced quality checks, least-privilege deployment posture, audit logging direction, and responsible disclosure through [`SECURITY.md`](SECURITY.md).

---

## 🚀 Deployment & Operations

Pushes to `main` can deploy:

- 🚚 API to Fly.io
- 🌐 web app to Netlify

Supporting references:

- [`docs/production-operations/README.md`](docs/production-operations/README.md)
- [`docs/INTEGRATIONS-AND-SECRETS.md`](docs/INTEGRATIONS-AND-SECRETS.md)
- [`docs/NETLIFY-BUILDHOOKS.md`](docs/NETLIFY-BUILDHOOKS.md)
- [`docs/CUSTOM-DOMAIN.md`](docs/CUSTOM-DOMAIN.md)
- [`docs/netlify-deploy-checklist.md`](docs/netlify-deploy-checklist.md)
- [`docs/PRODUCTION_SMOKE_TESTING.md`](docs/PRODUCTION_SMOKE_TESTING.md)

### Netlify form event note

Netlify form submissions are captured natively by Netlify Forms. Any Drizzle/Netlify Database mirror handlers should stay parked or carefully scoped unless the site's function-scoped environment payload and deployment constraints are verified.

---

## 🧭 Product Roadmap

### Current foundation

- production web deployment path
- production API deployment path
- Stripe billing/paywall foundation
- public shipment tracking foundation
- health checks and smoke-test documentation
- public marketing and intake surfaces

### In progress

- live API wiring for remaining operator modules
- dispatch workflow hardening
- quote and tracking workflow expansion
- authenticated freight operations polish
- dashboard metrics from live operational data
- production smoke coverage for every critical path

### Planned

- mobile driver/operator app
- AI dispatch assistant
- advanced carrier portal
- customer portal expansion
- predictive routing
- automated compliance monitoring
- richer fleet intelligence
- enterprise reporting and audit exports

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the expanded roadmap.

---

## 📚 Documentation

- [Project Docs Index](docs/README.md)
- [Current Runtime Status](docs/current-status.md)
- [Local Startup Checklist](docs/LOCAL_STARTUP_CHECKLIST.md)
- [Environment Variables Reference](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)
- [Detailed Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API-REFERENCE.md)
- [Production Smoke Testing](docs/PRODUCTION_SMOKE_TESTING.md)
- [Screenshot Checklist](docs/SCREENSHOTS.md)
- [Product Roadmap](docs/ROADMAP.md)
- [Production, Compliance, and Launch Docs](docs/LAUNCH_READINESS_INDEX.md)

---

## 👩‍💻 Contributing & Onboarding

- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for full guidelines.
- Every PR should include a clear summary, test notes, risk notes, and rollback considerations where relevant.
- Branches should follow `feature/*`, `fix/*`, `docs/*`, `chore/*`, or `security/*`.
- Use GitHub Issues or Discussions for planning and implementation questions.

---

## 📄 License / Ownership

Copyright 2025–2026 Infamous Freight.

Released under the MIT License. See [`LICENSE`](LICENSE) for details.

> This project and its code/modules are production-sensitive. Handle them with the same care expected for enterprise procurement, auditing, customer review, and security operations.

---

## 🏁 Vision

INFÆMOUS FREIGHT aims to become an AI-powered operating system for modern freight transportation by connecting carriers, brokers, drivers, shippers, dispatchers, and logistics teams through one unified execution platform.
