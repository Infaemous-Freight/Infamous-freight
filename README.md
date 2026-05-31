# INFÆMOUS FREIGHT

### 🚛 AI-powered freight operations platform

Dispatch • Fleet Intelligence • Driver Coordination • Shipment Visibility • Compliance • Billing • Analytics • Enterprise Logistics Execution

![license](https://img.shields.io/github/license/Infaemous-Freight/Infamous-freight)
[![code style: TypeScript](https://img.shields.io/badge/code%20style-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![deploy](https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/deploy.yml/badge.svg)](https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/deploy.yml)

---

## 🚛 Overview

**INFÆMOUS FREIGHT** is an AI-powered freight operations platform built to help carriers, brokers, dispatchers, owner-operators, shippers, and logistics teams manage freight execution from intake through delivery.

The platform is designed as a unified command center for:

- dispatch execution
- load and shipment visibility
- driver coordination
- fleet intelligence
- compliance workflows
- billing and customer payments
- operational analytics
- AI-assisted freight automation

Built as a **pnpm monorepo**, the current production path uses a **React 19 + Vite web application on Netlify**, an **Express 5 API on Fly.io**, **Drizzle ORM-backed PostgreSQL data access**, **Socket.io realtime flows**, and **Stripe-powered billing**.

> **Status source of truth:** For what is currently live, demo-backed, gated, or still in progress, always use [`docs/current-status.md`](docs/current-status.md). README provides platform positioning and onboarding context; when there is any conflict, `docs/current-status.md` is authoritative.

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
| 🧭 Dispatchers | Assign loads, coordinate drivers, update statuses, and control operational workflows. |
| 🌎 Enterprise logistics teams | Centralize freight visibility, reporting, compliance, workflow automation, and operational governance. |

---

## 🔥 Platform Highlights

- ✅ **Production deployment path:** Netlify web frontend, Fly.io API backend, same-origin `/api/*` browser traffic, and active health verification.
- ✅ **Billing foundation:** Stripe Checkout, Customer Portal, webhook handling, and paid access workflows.
- ✅ **Freight operations surfaces:** dispatch, loads, drivers, quotes, tracking, invoices, analytics, compliance, carriers, and accounting surfaces are represented in the app.
- 🧪 **In progress:** some internal operator modules are still demo-backed while production API wiring is completed.
- 🛣️ **Roadmap:** deeper AI-assisted dispatch, mobile operations, compliance automation, carrier workflows, and enterprise-grade workflow hardening.

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

INFÆMOUS FREIGHT is being built toward AI-assisted logistics execution, including:

- dispatch recommendations
- freight workflow automation
- operational insights
- shipment exception detection
- customer and driver notification support
- analytics summaries
- predictive routing and load-planning opportunities

AI features should always be implemented with freight-domain guardrails, auditability, and operator control.

---

## 📦 Monorepo Overview

| Path | Purpose |
| --- | --- |
| `apps/api` | Node.js + Express 5 backend, TypeScript, Drizzle ORM, billing helpers, health checks, and freight workflow logic. |
| `apps/web` | React 19 + Vite frontend, TypeScript, Tailwind CSS, operator surfaces, public routes, and browser API helpers. |
| `apps/mobile` | Reserved mobile surface for future driver/operator workflows. |
| `netlify/functions` | Retained fallback function entrypoints; normal deploys currently proxy browser API traffic to Fly.io. |
| `netlify/event-functions` | Event-handler bundle area; currently kept lean to avoid Netlify function environment payload issues. |
| `netlify/disabled-functions` | Parked handlers that can be restored when runtime constraints are resolved. |
| `docs` | Architecture, launch, operations, security, production-readiness, Stripe, Netlify, and environment references. |
| `scripts` | Local setup, validation, deployment helpers, smoke tests, and operational tooling. |
| `.github` | CI workflows, repository automation, and metadata. |

> Workspace managed with **pnpm**. The web app and production API are deployed separately. Browser traffic should use same-origin `/api/*` routes from Netlify, which proxy to the Fly.io API origin.

---

## 🧱 Active Tech Stack

| Layer | Technology |
| --- | --- |
| 🎨 Frontend | React 19, Vite, TypeScript, Tailwind CSS, Zustand, Socket.io client |
| 🧠 Backend | Express 5, TypeScript, Drizzle ORM |
| 🗄️ Database | PostgreSQL |
| ⚡ Cache | Redis |
| 🔐 Auth | Supabase Auth and JWT-derived trusted claims |
| 💳 Billing | Stripe Checkout, Customer Portal, webhooks, and one-time payments |
| 📡 Realtime | Socket.io |
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
      ├── PostgreSQL via Drizzle ORM
      ├── Redis
      ├── Stripe Billing
      ├── Supabase Auth / JWT Claims
      ├── Socket.io Realtime
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

Recommended product screenshots to add as the app matures:

| View | Target File |
| --- | --- |
| 🚚 Dispatch Board | `docs/screenshots/dispatch-board.png` |
| 📦 Shipment Detail | `docs/screenshots/shipment-detail.png` |
| 👨‍✈️ Driver Operations | `docs/screenshots/driver-ops.png` |
| 💬 Realtime Chat | `docs/screenshots/chat-view.png` |
| 💳 Billing / Invoicing | `docs/screenshots/billing-invoice.png` |
| 📊 Analytics Dashboard | `docs/screenshots/analytics-dashboard.png` |
| 🛡️ Compliance Panel | `docs/screenshots/compliance-panel.png` |
| 🗂️ Carrier Packet Workflow | `docs/screenshots/carrier-packet.png` |

### 🖼️ GitHub Social Preview

The social preview image should live at:

```text
.github/social-preview.png
```

Regenerate after branding updates:

```bash
pnpm run social-preview:generate
```

Then upload the PNG manually in GitHub under **Settings → General → Social preview**. GitHub does not accept SVG for that setting and does not expose a normal repository API for changing it.

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
- `/drivers`
- `/invoices`
- `/analytics`
- `/compliance`
- `/settings`
- `/billing`
- `/carriers`
- `/accounting`
- `/quotes`

Read [`docs/current-status.md`](docs/current-status.md) before treating any route as fully live, fully wired, or production-ready.

---

## 🔌 API And Netlify Routing

Production browser traffic should use the same-origin Netlify API path:

```bash
VITE_API_URL=/api
```

The committed Netlify configuration should:

- publish the Vite output from `apps/web/dist`
- redirect the apex host and default Netlify hostname to `https://www.infamousfreight.com`
- keep repo-owned Netlify Functions out of normal deploys unless intentionally restored
- proxy `/api/health`, public freight intake routes, and broader `/api/*` traffic to the Fly.io API
- keep the SPA fallback last

Launch-critical checks should verify:

- `https://www.infamousfreight.com`
- `https://infamousfreight.com` redirects to the `www` host
- `https://www.infamousfreight.com/api/health`
- public API routes under `/api/public/*` through the Netlify-to-Fly proxy

Direct `api.infamousfreight.com` checks are useful for operations diagnostics only after that domain is confirmed.

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
  api/      # Express 5 backend, TypeScript, Drizzle ORM
  web/      # React 19 + Vite frontend
  mobile/   # Reserved mobile surface

netlify/
  event-functions/      # Active event-handler bundle area
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

Security posture includes:

- JWT-based authentication flow
- trusted-claim checks
- role-based access control direction
- environment-based secret management
- strict external input validation
- CI-enforced quality checks
- least-privilege deployment posture
- audit logging direction
- responsible disclosure process through [`SECURITY.md`](SECURITY.md)

Operational security expectations:

- never commit `.env` files or secrets
- rotate credentials after any suspected exposure
- verify production environment variables before deploy
- keep public payloads sanitized
- treat freight, billing, customer, driver, and shipment records as sensitive operational data

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

Production verification should always include:

- canonical website load at `https://www.infamousfreight.com`
- apex redirect from `https://infamousfreight.com`
- proxied health check at `https://www.infamousfreight.com/api/health`
- public intake route checks under `/api/public/*`
- Fly.io runtime status after API deploy
- Stripe webhook verification when billing changes ship
- controlled authenticated smoke testing before launch-critical releases

### Netlify form event note

Netlify form submissions are captured natively by Netlify Forms. The Drizzle mirror handler is parked at `netlify/disabled-functions/submission-created.mts.disabled` because Netlify attaches the full site environment payload to every function, and the payload previously exceeded upload/runtime constraints. Restore it into `netlify/event-functions/` only after the site's function-scoped environment variables are reduced enough for reliable deploys.

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

---

## 📚 Documentation

- [Project Docs Index](docs/README.md)
- [Current Runtime Status](docs/current-status.md)
- [Local Startup Checklist](docs/LOCAL_STARTUP_CHECKLIST.md)
- [Environment Variables Reference](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)
- [Detailed Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API-REFERENCE.md)
- [Production, Compliance, and Launch Docs](docs/LAUNCH_READINESS_INDEX.md)

---

## 👩‍💻 Contributing & Onboarding

- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for full guidelines.
- Every PR should include a clear summary, test notes, risk notes, and rollback considerations where relevant.
- Branches should follow `feature/*`, `fix/*`, `docs/*`, `chore/*`, or `security/*`.
- Use GitHub Issues or Discussions for planning and implementation questions.

Recommended PR checklist:

- [ ] Summary is clear
- [ ] Tests or verification steps are documented
- [ ] Secrets are not included
- [ ] Public/runtime impact is explained
- [ ] Rollback path is known for production-sensitive changes

---

## 📄 License / Ownership

Copyright 2025–2026 Infamous Freight.

Released under the MIT License. See [`LICENSE`](LICENSE) for details.

> This project and its code/modules are production-sensitive. Handle them with the same care expected for enterprise procurement, auditing, customer review, and security operations.

---

## 🏁 Vision

INFÆMOUS FREIGHT aims to become an AI-powered operating system for modern freight transportation by connecting carriers, brokers, drivers, shippers, dispatchers, and logistics teams through one unified execution platform.
