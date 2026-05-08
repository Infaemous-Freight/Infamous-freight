<p align="center">
  <img src="assets/infamous-freight-header.svg" alt="Infamous Freight" width="100%">
</p>

# 🚛 Infamous Freight

> **AI-driven freight operations platform: dispatch, fleet intelligence, driver coordination, compliance, and enterprise-ready logistics execution.**

[![CI](https://img.shields.io/github/actions/workflow/status/Infaemous-Freight/Infamous-freight/main.yml?branch=main&label=CI)](https://github.com/Infaemous-Freight/Infamous-freight/actions)
[![License](https://img.shields.io/github/license/Infaemous-Freight/Infamous-freight)](LICENSE)
[![Code Style: TypeScript](https://img.shields.io/badge/code%20style-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)

Infamous Freight is an AI-powered freight operations platform for dispatch execution, shipment visibility, driver coordination, compliance workflows, billing flows, and logistics automation.

Built as a **pnpm monorepo**, the platform combines an **Express 4 API**, **React + Vite web application**, **Prisma/PostgreSQL data layer**, **real-time messaging**, and **Stripe-powered billing** for modern freight teams and enterprise-ready operations.

If you want one system for dispatch, tracking, paperwork, analytics, compliance, and operational control, this is the platform.

---

## 🧱 Monorepo Overview

- `apps/api` — 🛠️ Node.js + Express backend, TypeScript, ESM-first
- `apps/web` — 🌐 React + Vite frontend, strict TypeScript
- `apps/mobile` — 📱 React Native / Expo surface *(planned)*
- `shared/` — 🧩 shared TS modules and reusable platform utilities
- `configs/` — ⚙️ lint, tsconfig, and workspace config
- `docs/` — 📚 architecture, operations, launch, security, and readiness docs
- `.github/` — 🔁 CI workflows, badges, automation, and social preview assets

> **Workspace managed with pnpm. ESM enforced. CommonJS is avoided except where unavoidable for vendor compatibility.**

---

## 🔥 Platform Highlights

- 🚚 AI-assisted dispatch workflows
- 📍 Real-time shipment location, ETA, and status visibility
- 💬 Driver-dispatch chat with voice-note support
- 🤖 Load matching and negotiation workflows
- 📄 Digital paperwork, BOL/POD, and invoicing flows
- 🛡️ Role-based, tenant-aware compliance controls
- 💳 Stripe billing, payroll, and factoring support
- 📊 Broker, rate, and operational analytics
- 🔎 Load-board, ELD, geofencing, CSA, IFTA, and related freight workflow support

---

## 🛡️ Enterprise-Grade Quality & Security

- ✅ Production-focused defaults for operationally sensitive freight workflows
- ✅ Strict typing, explicit exports, and CI-enforced code quality
- ✅ Structured validation and error handling across the stack
- ✅ Nothing ships without CI: lint, typecheck, build, and test must pass before merge
- ✅ No secrets in code: use `.env` files and managed secret stores only
- ✅ Principle of least privilege across services, workflows, and runtime configuration
- ✅ Security contact: see [`SECURITY.md`](SECURITY.md) for responsible disclosure

---

## 🧠 What It Does

Infamous Freight is designed to reduce manual dispatch work, improve operational visibility, centralize paperwork, and give freight teams a single system for execution and control.

It brings together:

- 🚚 dispatch execution
- 📍 shipment tracking and ETA visibility
- 💬 driver communication
- 📄 digital paperwork and invoicing
- 💵 billing, payroll, and factoring workflows
- 🛡️ compliance and governance
- 📊 broker, pricing, and operational analytics

---

## 🎯 Why It Matters

Freight teams often still rely on calls, texts, spreadsheets, disconnected load boards, fragmented paperwork, and delayed status updates.

Infamous Freight is built to reduce that operational drag by centralizing:

- 🚚 dispatch execution
- 📍 shipment visibility
- 👨‍✈️ driver coordination
- 📄 paperwork and invoicing
- 🛡️ compliance workflows
- 📊 reporting and operational intelligence

---

## ⚙️ Product Capability Areas

These areas describe product direction and repository scope. Keep external claims aligned with [`docs/REPO-ACCURATE-STATUS.md`](docs/REPO-ACCURATE-STATUS.md) and current production evidence.

- 🤖 **Auto-Dispatch AI** — Supports load-to-driver matching and dispatch workflows
- 💰 **Rate Negotiation Bot** — Supports negotiation workflows and margin protection
- 🎤 **Voice Booking** — Natural-language load search and booking workflows
- 🔌 **Multi-ELD Sync** — Samsara, Motive, Omnitracs, and Geotab integrations
- 🔎 **Load Board Aggregation** — Unified search across DAT, Truckstop, and 123Loadboard
- 📄 **Digital BOL / POD** — Upload, sign, and invoice in one workflow
- 🧾 **Driver Payroll** — Per-mile, percentage, flat-rate, or hourly payroll models
- 🏦 **Factoring Integration** — RTS, OTR, Apex, Bluevine, and eCapital support
- 🛡️ **CSA Score Monitor** — Supports CSA and compliance monitoring
- 🏢 **Broker Credit Checks** — Ratings, payment history, and risk visibility
- 📡 **Geofencing & ETA** — Smart alerts and customer tracking links
- ⛽ **IFTA Auto-Reporting** — Fuel tax workflow support
- 👥 **Team Management** — Role-based access across owner, dispatcher, safety, accountant, and driver roles
- 📈 **Rate Analytics** — Historical trends and market comparisons
- 🧩 **Chrome Extension** — Load-board workflow support
- 💬 **Real-Time Chat** — Dispatch-driver messaging with voice-note support
- 🔁 **Backhaul Finder** — Deadhead-reduction workflows
- 📑 **Rate Confirmation Generator** — PDF confirmation workflows
- 🗂️ **Carrier Packet Generator** — W-9, COI, and insurance certificate workflows
- 💳 **Stripe Payments** — Subscription and pay-per-load billing
- 📚 **QuickBooks / Xero Sync** — Accounting sync workflows

---

## 📌 Current Working Scope

### ✅ Working Now

- API runtime and health endpoints
- tenant-aware request handling
- role-based access guards
- load, driver, and shipment API surfaces
- Prisma-backed data access patterns
- Docker-based local startup
- CI/CD and deployment support docs
- environment bootstrap and validation scripts

### 🚧 In Active Build

- deeper dispatch decision automation
- richer shipment lifecycle workflows
- expanded analytics and reporting
- broader integrations and monitoring coverage
- production operations hardening

### 🗺️ Roadmap

- broader mobile operations support
- deeper AI orchestration
- expanded carrier network intelligence
- more complete automation around billing, notifications, brokerage workflows, and reporting

---

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/infamousfreight-showcase-banner.svg" alt="Infamous Freight Showcase" width="100%">
</p>

### 🖥️ Landing Experience
![Infamous Freight Landing Page](docs/screenshots/infamousfreight-landing-page.svg)

### 📊 Platform Overview
![Infamous Freight Platform Overview](docs/screenshots/infamousfreight-platform-overview.svg)

### 🚚 Header Artwork
![Infamous Freight Header](assets/infamous-freight-header.svg)

### 🧭 Recommended Additional Product Screenshots

Add real product screenshots here as the platform matures:

- 📋 **Dispatch Board** — load assignment, status, and carrier coordination
- 🚛 **Shipment Detail View** — pickup, delivery, ETA, and live event timeline
- 👨‍✈️ **Driver Operations View** — driver status, notes, and task workflow
- 💬 **Realtime Chat View** — dispatcher-driver messaging and voice-note workflow
- 🧾 **Billing / Invoicing View** — invoice creation, payment state, and reconciliation
- 📈 **Analytics Dashboard** — broker, margin, volume, and utilization insights
- 🛡️ **Compliance Panel** — CSA, document expiry, and operational controls
- 🗂️ **Carrier Packet Workflow** — insurance, W-9, onboarding packet management

### 🖼️ Social Preview

The GitHub social preview image should live at [`.github/social-preview.png`](.github/social-preview.png).

To regenerate after updating the header asset:

```bash
pnpm run social-preview:generate
```

> Maintainers must upload the resulting PNG via **Settings → General → Social preview**. GitHub does not accept SVG there and does not expose an API for this setting.

---

## 🏗️ Solution Architecture

```text
web/   ─▶  api/   ─▶  db (Postgres/Prisma)
        │         ├─▶ Redis
        │         ├─▶ Stripe (billing)
        │         ├─▶ Socket.io (realtime)
        │         └─▶ Auth (Supabase)
```

Full references:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md)

---

## ⚡ Quick Start

```bash
pnpm install
pnpm run env:setup
# Edit .env files for repo root, apps/api, and apps/web as needed
pnpm run db:setup
pnpm run dev
# Recommended alternative for local infra:
docker-compose up -d
```

Further setup references:

- [`docs/LOCAL_STARTUP_CHECKLIST.md`](docs/LOCAL_STARTUP_CHECKLIST.md)
- [`docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md`](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)

> Never commit secrets.

---

## 🧪 CI/CD & Quality Gates

| Gate | Purpose |
|---|---|
| Lint | Code style and hygiene |
| Typecheck | Strict TypeScript validation |
| Test | Deterministic verification |
| Build | ESM-compatible, CI-stable output |

- 🔁 CI runs through GitHub Actions under [`.github/workflows/`](.github/workflows/)
- ✅ All checks must pass before PR merge
- 🧩 Workspace scripts enforce path discipline, validation consistency, and environment sanity

---

## 🗂️ Project Structure

```text
apps/
  api/      # Express backend, TypeScript, ESM-first
  web/      # React + Vite frontend
  mobile/   # React Native / Expo (planned)

shared/     # Shared TS utilities and modules
configs/    # Lint, tsconfig, and related config
docs/       # Architecture, operations, launch, and compliance docs
.github/    # CI workflows, badges, and social preview
Dockerfile*, docker-compose.yml, etc.
```

---

## 📝 Coding Standards

- TypeScript-first
- ESM enforced
- explicit exports
- small composable functions
- predictable file layouts
- clear domain boundaries across dispatch, fleet, driver, and operations modules
- all changes must pass lint, typecheck, test, and build
- environment configuration via `.env`

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for PR and style expectations.

---

## 👩‍💻 Contributing & Onboarding

- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for full guidelines
- Every PR should include a clear summary, logical commit structure, and CI readiness
- Branches should follow `feature/*`, `fix/*`, `docs/*`, `chore/*`, `security/*`
- Use GitHub Discussions or Issues for questions and planning

---

## 🔐 Environment References

For deployment-ready variable setup, use:

- [`docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md`](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)
- [`docs/environment/CODEX_ENV_VARIABLES.txt`](docs/environment/CODEX_ENV_VARIABLES.txt)
- [`docs/environment/README.md`](docs/environment/README.md)

---

## 🔍 Error Monitoring (Sentry)

`apps/web` is a Vite + React SPA. To set up or re-configure Sentry for it, run:

```bash
cd apps/web
pnpm dlx @sentry/wizard@latest -i react
```

> Do not use `-i nextjs` — `apps/web` is not a Next.js app.

### Sentry MCP Server

For Sentry issue triage via MCP-compatible clients, configure the Sentry MCP endpoint with environment-based auth. Never hardcode or commit tokens.

```json
{
  "mcpServers": {
    "sentry": {
      "url": "https://mcp.sentry.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${SENTRY_ACCESS_TOKEN}"
      }
    }
  }
}
```

Example local setup:

```bash
export SENTRY_ACCESS_TOKEN="<sentry-token>"
```

### Netlify Sourcemap Policy

Public requests for `*.map` files are blocked (`404`). Sourcemaps are still uploaded to Sentry during builds when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are configured.

---

## 🏗️ Architecture Overview

```text
Web App (React + Vite)
        │
        ▼
API (Express 4 + TypeScript)
        │
        ├── Prisma ORM
        │      │
        │      ▼
        │  PostgreSQL
        │
        ├── Redis / caching workflows
        ├── Billing / Stripe
        ├── Notifications / messaging
        └── Analytics / operations logic
```

---

## 🔌 API Example

### Liveness Check

```bash
curl -X GET http://localhost:3000/api/health/live
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "api": "running"
  }
}
```

### Readiness Check

```bash
curl -X GET http://localhost:3000/api/health/ready
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### Tenant-Scoped Loads Request

```bash
curl -X GET http://localhost:3000/api/loads \
  -H "x-tenant-id: demo-tenant" \
  -H "x-user-role: dispatcher" \
  -H "x-subscription-status: active"
```

Example response:

```json
{
  "data": [
    {
      "id": "load_123",
      "tenantId": "demo-tenant",
      "status": "assigned"
    }
  ],
  "count": 1
}
```

Expected headers for protected routes:

- `x-tenant-id`
- `x-user-role`

> Tenant IDs are accepted only from `x-tenant-id`. Query-string and request-body tenant values should not be relied on. Protected routes prefer the carrier billing status stored in the database from Stripe webhook sync. Client-set subscription headers are limited to tests or transitional environments that explicitly set `ALLOW_CLIENT_SUBSCRIPTION_STATUS_HEADER=true`.

---

## 🚀 Deployment

### GitHub Actions CI/CD

This repository is standardized on **pnpm workspaces**. Build, test, and deploy flows should stay aligned to pnpm to avoid lockfile drift and install inconsistencies.

Add these secrets to your GitHub repository:

- `FLY_API_TOKEN`
- `VITE_API_URL`
- `VITE_STRIPE_PUBLIC_KEY`
- `SENTRY_AUTH_TOKEN` *(optional)*
- `SENTRY_ORG` *(optional)*
- `SENTRY_PROJECT` *(optional)*

Push to `main` and the pipeline deploys:

- 🚚 API to Fly.io
- 🌐 Web to Netlify

### Manual Deployment

#### API (Fly.io)

```bash
flyctl deploy --app infamous-freight
```

#### Web (Netlify)

```bash
pnpm add -g netlify-cli
netlify deploy --prod --dir=apps/web/dist
```

### Deploy Verification

```bash
curl -X GET https://infamousfreight.com/api/health/live
curl -X GET https://infamousfreight.com/api/health/ready
```

Confirm:

- ✅ API returns `200` on liveness
- ✅ readiness reports database connectivity as healthy
- ✅ required env vars are present
- ✅ Fly app is listening on the expected internal port
- ✅ Netlify build points to the correct API URL

---

## 📚 Documentation

- [Project Docs Index](docs/README.md)
- [Local Startup Checklist](docs/LOCAL_STARTUP_CHECKLIST.md)
- [Environment Variables Reference](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)
- [Detailed Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API-REFERENCE.md)
- [Production, Compliance, and Launch Docs](docs/PRODUCTION_READINESS_VERIFICATION.md)

---

## 📚 Docs by Goal

### New here

- [Quick Start](#-quick-start)
- [Development Workflow](#-development-workflow)
- [Environment References](#-environment-references)

### Understand the system

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md)

### Deploy and operate

- [`docs/INTEGRATIONS-AND-SECRETS.md`](docs/INTEGRATIONS-AND-SECRETS.md)
- [`docs/NETLIFY-BUILDHOOKS.md`](docs/NETLIFY-BUILDHOOKS.md)
- [`docs/REQUIRED-CLIS.md`](docs/REQUIRED-CLIS.md)
- [`docs/SBOM-POLICY.md`](docs/SBOM-POLICY.md)

### Launch readiness

- [`docs/PRODUCTION_READINESS_VERIFICATION.md`](docs/PRODUCTION_READINESS_VERIFICATION.md)
- [`docs/ROLLBACK_PLAN.md`](docs/ROLLBACK_PLAN.md)

### Freight operations

- [`docs/production-operations/OPERATING_MODEL.md`](docs/production-operations/OPERATING_MODEL.md)
- [`docs/production-operations/DISPATCH_WORKFLOW.md`](docs/production-operations/DISPATCH_WORKFLOW.md)
- [`docs/production-operations/DAILY_OPERATIONS_SOP.md`](docs/production-operations/DAILY_OPERATIONS_SOP.md)

---

## 📚 Operations & Supply Chain Reference

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md)
- [`docs/INTEGRATIONS-AND-SECRETS.md`](docs/INTEGRATIONS-AND-SECRETS.md)
- [`docs/NETLIFY-BUILDHOOKS.md`](docs/NETLIFY-BUILDHOOKS.md)
- [`docs/REQUIRED-CLIS.md`](docs/REQUIRED-CLIS.md)
- [`docs/SBOM-POLICY.md`](docs/SBOM-POLICY.md)

---

## ✅ Launch Readiness

Use these before private beta, paid beta, or public launch:

- [`docs/LAUNCH_READINESS_INDEX.md`](docs/LAUNCH_READINESS_INDEX.md)
- [`docs/PRODUCTION_READINESS_VERIFICATION.md`](docs/PRODUCTION_READINESS_VERIFICATION.md)
- [`docs/LAUNCH_EVIDENCE_LOG.md`](docs/LAUNCH_EVIDENCE_LOG.md)
- [`docs/ROLLBACK_PLAN.md`](docs/ROLLBACK_PLAN.md)
- [`docs/PRODUCTION_TEST_DATA_PLAN.md`](docs/PRODUCTION_TEST_DATA_PLAN.md)
- [`docs/STRIPE_WEBHOOK_VERIFICATION.md`](docs/STRIPE_WEBHOOK_VERIFICATION.md)
- [`docs/ADMIN_RECOVERY_RUNBOOK.md`](docs/ADMIN_RECOVERY_RUNBOOK.md)
- [`docs/BACKUP_RESTORE_VERIFICATION.md`](docs/BACKUP_RESTORE_VERIFICATION.md)
- [`docs/NOTIFICATION_DELIVERABILITY_VERIFICATION.md`](docs/NOTIFICATION_DELIVERABILITY_VERIFICATION.md)
- [`docs/LAUNCH_BLOCKER_TEMPLATE.md`](docs/LAUNCH_BLOCKER_TEMPLATE.md)

---

## 📦 Production Operations

- [`docs/production-operations/README.md`](docs/production-operations/README.md)
- [`docs/production-operations/OPERATING_MODEL.md`](docs/production-operations/OPERATING_MODEL.md)
- [`docs/production-operations/LAUNCH_CHECKLIST.md`](docs/production-operations/LAUNCH_CHECKLIST.md)
- [`docs/production-operations/COMPLIANCE_CHECKLIST.md`](docs/production-operations/COMPLIANCE_CHECKLIST.md)
- [`docs/production-operations/CARRIER_VETTING_SOP.md`](docs/production-operations/CARRIER_VETTING_SOP.md)
- [`docs/production-operations/DISPATCH_WORKFLOW.md`](docs/production-operations/DISPATCH_WORKFLOW.md)
- [`docs/production-operations/DAILY_OPERATIONS_SOP.md`](docs/production-operations/DAILY_OPERATIONS_SOP.md)
- [`docs/production-operations/SHIPPER_SALES_SCRIPT.md`](docs/production-operations/SHIPPER_SALES_SCRIPT.md)
- [`docs/production-operations/GITHUB_EXECUTION_BACKLOG.md`](docs/production-operations/GITHUB_EXECUTION_BACKLOG.md)

---

## 🔒 Security & Compliance

- all external input is strictly validated
- no hardcoded secrets
- production tokens and keys stay in local or managed environment config
- principle of least privilege
- Sentry monitoring
- RBAC enforced at the API layer

Responsible disclosure: [`SECURITY.md`](docs/SECURITY.md)

---

## 📄 License / Ownership

Copyright 2025–2026 Infamous Freight.  
[MIT License](LICENSE)

> This project and its code/modules are production-sensitive. Handle them with the same care expected for enterprise procurement, auditing, customer review, and security operations.

---

For more, see the full documentation and use the discussion board for implementation and roadmap Q&A.