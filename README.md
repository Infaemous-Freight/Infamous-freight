# 🚛 Infamous Freight

> **The freight dispatch platform built by truckers, for truckers.**

Infamous Freight is an AI-powered freight and logistics automation platform for dispatch operations, real-time shipment tracking, carrier networks, compliance workflows, and intelligent load orchestration.

Built as a monorepo, the platform combines a NestJS backend, React web application, real-time communications, financial workflows, compliance tooling, and operational automation for modern freight teams.

---

## 🔥 What It Does

Infamous Freight is designed to reduce manual dispatch work, improve load execution speed, increase margin per load, and centralize day-to-day freight operations in one system.

It brings together:

- 🚚 dispatch automation
- 📍 real-time tracking and ETA visibility
- 🤖 AI-assisted load matching and negotiation
- 💬 driver-dispatch messaging
- 📄 digital paperwork and invoicing
- 💵 payroll and factoring workflows
- 🛡️ compliance monitoring
- 📊 rate analytics and broker intelligence

---

## ⚙️ Core Features

- 🤖 **Auto-Dispatch AI** — Matches loads to drivers in as little as 90 seconds
- 💰 **Rate Negotiation Bot** — Counters lowball offers to improve load revenue
- 🎤 **Voice Booking** — Natural-language load search and booking workflows
- 🔌 **Multi-ELD Sync** — Samsara, Motive, Omnitracs, and Geotab integrations
- 🔎 **Load Board Aggregation** — Unified search across DAT, Truckstop, and 123Loadboard
- 📄 **Digital BOL / POD** — Upload, sign, and invoice in one workflow
- 🧾 **Driver Payroll** — Per-mile, percentage, flat-rate, or hourly settlement models
- 🏦 **Factoring Integration** — RTS, OTR, Apex, Bluevine, and eCapital support
- 🛡️ **CSA Score Monitor** — Tracks all 7 BASIC categories
- 🏢 **Broker Credit Checks** — Ratings, payment history, and risk visibility
- 📡 **Geofencing & ETA** — Smart alerts and customer tracking links
- ⛽ **IFTA Auto-Reporting** — Quarterly fuel tax calculations
- 👥 **Team Management** — Role-based access for Owner, Dispatcher, Safety, Accountant, and Driver
- 📈 **Rate Analytics** — Historical trends and market comparisons
- 🧩 **Chrome Extension** — Book loads directly from load boards
- 💬 **Real-Time Chat** — Driver-dispatch messaging with voice notes
- 🔁 **Backhaul Finder** — Minimizes deadhead after delivery
- 📑 **Rate Confirmation Generator** — Professional PDF confirmations
- 🗂️ **Carrier Packet Generator** — W-9, COI, and insurance certificate workflows
- 💳 **Stripe Payments** — Subscription and pay-per-load billing
- 📚 **QuickBooks / Xero Sync** — Automated invoice sync

---

## 📸 Screenshots

### 🖥️ Infamous Freight Landing Page
![Infamous Freight Landing Page](docs/screenshots/infamousfreight-landing-page.png)

### 📊 Platform Overview
![Infamous Freight Platform Overview](docs/screenshots/infamousfreight-platform-overview.png)

---

## ⚡ Quick Start

### 1️⃣ Install dependencies + bootstrap environment files

```bash
npm run env:setup
```

This installs workspace dependencies and creates local `.env` files from `*.env.example` for:

- repo root
- `apps/api`
- `apps/web`

Edit the generated `.env` files with the required API keys and environment values.

> Prisma commands run from the repo root (for example `npm run prisma:generate`) load environment values from the root `.env` file, but API-local overrides (such as `apps/api/.env`) may also apply depending on how Prisma is invoked. If the same variable is defined in multiple places, use the effective override order for your command and verify which `DATABASE_URL` Prisma will use.

### 3️⃣ Start with Docker (recommended)

```bash
docker-compose up -d
```

### 4️⃣ Or start manually

```bash
npm run db:setup
npm run dev
```

---

## 🧪 Development Workflow

### Recommended local flow

```bash
npm run env:setup
npm run db:setup
npm run dev
```

### Common commands

```bash
npm run env:setup
npm run db:setup
npm run dev
npm run build
npm run test
```

### Git remote troubleshooting

If `git push` fails with:

```text
fatal: No configured push destination.
```

Configure an upstream remote and branch:

```bash
git remote add origin <your-repo-url>
git push -u origin <your-branch>
```

You can verify remotes any time with:

```bash
git remote -v
```

---

## 🔍 Error Monitoring (Sentry)

`apps/web` is a **Vite + React** SPA. To set up or re-configure Sentry for it, run the React wizard — **not** the Next.js wizard:

```bash
cd apps/web
npx @sentry/wizard@latest -i react
```

> ⚠️ Do **not** use `-i nextjs` — `apps/web` is not a Next.js app.

**Netlify sourcemap policy:** Public requests for `*.map` files are blocked (404).
Sourcemaps are still uploaded to Sentry during builds when
`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are configured.

### Optional Sentry environment variables

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SENTRY_DSN` | Sentry DSN for the web app | No (Sentry disabled if blank) |
| `VITE_SENTRY_ENABLED` | Set to `false` to disable even when DSN is set | No (defaults enabled in prod) |
| `SENTRY_AUTH_TOKEN` | CI secret — enables sourcemap upload to Sentry | No (skipped if absent) |
| `SENTRY_ORG` | Sentry organization slug | No (only needed with `SENTRY_AUTH_TOKEN`) |
| `SENTRY_PROJECT` | Sentry project slug | No (only needed with `SENTRY_AUTH_TOKEN`) |
| `SENTRY_SOURCEMAPS` | Set to `1` to force sourcemap generation without upload | No |

Sourcemaps are generated **only** when `SENTRY_AUTH_TOKEN` is present or `SENTRY_SOURCEMAPS=1` is set, so local and PR builds are not affected.

---

## 🚀 Deployment

### GitHub Actions CI/CD

Add these secrets to your GitHub repository:

- 🔐 `FLY_API_TOKEN` — Fly.io deployment token
- 🔐 `VITE_API_URL` — Production API URL
- 🔐 `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key
- 🔐 `SENTRY_AUTH_TOKEN` — (optional) Sentry auth token for sourcemap upload
- ⚙️ `SENTRY_ORG` — (optional) Sentry org slug (e.g. `infmous`)
- ⚙️ `SENTRY_PROJECT` — (optional) Sentry project slug (e.g. `infamous-freight`)

Push to `main` and the pipeline deploys:

- 🚚 API to **Fly.io**
- 🌐 Web to **Netlify** (via Netlify's native Git integration)

### Manual deployment

#### API (Fly.io)

```bash
flyctl deploy --app infamous-freight
```

#### Web (Netlify)

Netlify auto-deploys from the `main` branch via its native Git integration.
For manual deploys:

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=apps/web/dist
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 🎨 Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Socket.io |
| 🧠 Backend | NestJS, TypeScript, Prisma ORM |
| 🗄️ Database | PostgreSQL 16 |
| ⚡ Cache | Redis 7 |
| 📡 Realtime | Socket.io WebSockets |
| 💳 Payments | Stripe |
| 🔐 Auth | Supabase Auth + JWT |
| ☁️ Deployment | Fly.io (API), Netlify (Web), Docker |

---

## 🗂️ Project Structure

```text
infamous-all-in/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── dispatch/          # Auto-dispatch AI, backhaul, rate negotiation
│   │   │   ├── loads/             # Load board aggregation
│   │   │   ├── invoice/           # BOL/POD + invoicing
│   │   │   ├── eld/               # ELD integrations
│   │   │   ├── chat/              # Real-time messaging
│   │   │   ├── payroll/           # Driver settlements
│   │   │   ├── factoring/         # Factoring integrations
│   │   │   ├── compliance-csa/    # CSA/SMS monitoring
│   │   │   ├── compliance-expiry/ # Document expiry tracking
│   │   │   ├── accounting/        # QuickBooks + Xero
│   │   │   ├── rate-analytics/    # Rate trends + comparisons
│   │   │   ├── broker-credit/     # Broker scoring
│   │   │   ├── geofencing/        # ETA + alerts
│   │   │   ├── ifta/              # Fuel tax reporting
│   │   │   ├── rbac/              # Role-based access
│   │   │   ├── redis/             # Caching layer
│   │   │   ├── rate-limit/        # API rate limiting
│   │   │   ├── stripe/            # Payment processing
│   │   │   ├── uploads/           # Document uploads
│   │   │   ├── notifications/     # WebSocket notifications
│   │   │   ├── audit/             # Audit logging
│   │   │   └── ...
│   │
│   └── web/              # React frontend
│       ├── src/
│       │   ├── pages/          # Dashboard, Loads, Dispatch, Drivers
│       │   ├── components/     # UI and feature components
│       │   ├── layouts/        # App shell and sidebar
│       │   ├── store/          # Zustand state management
│       │   ├── api-client/     # Axios API wrapper
│       │   └── extension/      # Chrome extension
│
├── compliance/           # Canadian HOS rules
├── templates/            # Cold emails + LinkedIn calendar
├── docs/                 # Sales playbook, launch checklists
├── Dockerfile.api
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/    # CI/CD pipeline
```

---

## 🧩 Platform Areas

### 🚚 Dispatch Operations
Load assignment, driver coordination, backhaul workflows, negotiation automation, and load execution.

### 📡 Tracking & Visibility
Location visibility, smart alerts, ETA workflows, and customer-facing tracking updates.

### 💬 Communication
Real-time dispatch-driver messaging, voice notes, and operational notifications.

### 💵 Financial Workflows
Driver payroll, factoring support, invoice generation, and accounting integrations.

### 🛡️ Compliance & Safety
CSA monitoring, document expiry management, fuel tax reporting, and operational compliance support.

### 📊 Intelligence & Analytics
Broker scoring, market rate analysis, historical pricing, and load decision support.

---

## 📌 Current Status

### ✅ Implemented Areas

- 🧠 AI dispatch and negotiation workflows
- 🔎 load aggregation and booking support
- 💬 real-time chat and operational messaging
- 🧾 document upload, BOL/POD, and invoicing flows
- 💳 payment and subscription infrastructure
- 📊 broker, rate, and operations analytics
- 🔐 role-based access and audit support
- 🛡️ compliance and tracking services
- 🔁 CI/CD pipeline and deployment automation

### 🚧 Expansion Areas

- 📱 deeper mobile operations support
- 🤖 expanded AI orchestration and workflow automation
- 🌍 broader carrier network intelligence
- 📈 improved analytics and operational reporting
- 🔗 expanded third-party integration coverage

---

## 🧭 Why It Exists

Freight operations still run on too many disconnected tools, manual phone calls, spreadsheets, load board tabs, and delayed status updates.

Infamous Freight is built to centralize dispatch, tracking, compliance, communication, paperwork, and financial workflows into a single operating system that reflects how freight teams actually work.

---

## 📚 Operations & Supply Chain Reference

For operational ownership, deployment runbooks, integration provenance, and SBOM review standards, use these docs:

- `docs/INTEGRATIONS-AND-SECRETS.md` — external integrations, secret ownership, deploy failure runbooks, and rotation guidance
- `docs/NETLIFY-BUILDHOOKS.md` — provenance, integrity, and maintenance guidance for Netlify URL-hosted buildhook packages
- `docs/SBOM-POLICY.md` — runtime-vs-build SBOM policy, review cadence, classification rules, and triage standards

---

## 📦 Production Operations

For operating model, compliance, carrier vetting, dispatch, daily operations, sales, and launch execution, use these docs:

- [`docs/production-operations/README.md`](docs/production-operations/README.md) — production operations package index
- [`docs/production-operations/OPERATING_MODEL.md`](docs/production-operations/OPERATING_MODEL.md) — brokerage and logistics operating model
- [`docs/production-operations/LAUNCH_CHECKLIST.md`](docs/production-operations/LAUNCH_CHECKLIST.md) — launch execution checklist
- [`docs/production-operations/COMPLIANCE_CHECKLIST.md`](docs/production-operations/COMPLIANCE_CHECKLIST.md) — freight brokerage compliance checklist
- [`docs/production-operations/CARRIER_VETTING_SOP.md`](docs/production-operations/CARRIER_VETTING_SOP.md) — carrier qualification workflow
- [`docs/production-operations/DISPATCH_WORKFLOW.md`](docs/production-operations/DISPATCH_WORKFLOW.md) — shipment dispatch workflow
- [`docs/production-operations/DAILY_OPERATIONS_SOP.md`](docs/production-operations/DAILY_OPERATIONS_SOP.md) — daily operating cadence
- [`docs/production-operations/SHIPPER_SALES_SCRIPT.md`](docs/production-operations/SHIPPER_SALES_SCRIPT.md) — shipper outreach script
- [`docs/production-operations/GITHUB_EXECUTION_BACKLOG.md`](docs/production-operations/GITHUB_EXECUTION_BACKLOG.md) — repo execution backlog

---

## 🔒 Security

Security expectations include:

- 🚫 never commit secrets
- ✅ validate all external inputs
- 🔐 protect auth and token flows
- 🧱 maintain role-based access boundaries
- 📜 log important operational and audit events

---

## 🤝 Contributing

See `CONTRIBUTING.md`.

### ✅ Pull Request Checklist

Before submitting a PR:

- ✅ build passes
- ✅ tests pass
- ✅ environment changes are documented
- ✅ screenshots or logs are included when relevant

### 🌿 Branch Naming Examples

- `feature/dispatch-engine`
- `feature/rate-negotiation-bot`
- `feature/load-aggregation`
- `fix/api-timeout`
- `docs/readme-update`

### 📝 Commit Format

This repository follows Conventional Commits.

Examples:

- `feat: add broker credit scoring module`
- `fix: resolve websocket reconnect issue`
- `docs: update deployment instructions`

---

## 🌐 Live Project

- Website: [infamousfreight.com](https://infamousfreight.com)
- GitHub Pages Preview: [infaemous-freight.github.io/Infamous-freight](https://infaemous-freight.github.io/Infamous-freight/)
- Repository: [github.com/Infaemous-Freight/Infamous-freight](https://github.com/Infaemous-Freight/Infamous-freight)

---

## 📄 License

Copyright 2025 Infamous Freight. All rights reserved.
