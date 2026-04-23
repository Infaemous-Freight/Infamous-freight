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

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Copy environment config

```bash
cp .env.example .env
```

Edit `.env` with the required API keys and environment values.

### 3️⃣ Start with Docker (recommended)

```bash
docker compose up -d
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
npm install
npm run db:setup
npm run dev
```

### Common commands

```bash
npm install
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

**Vercel sourcemap policy:** Public requests for `*.map` files are blocked (404).
Sourcemaps are still uploaded to Sentry during Vercel builds when
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

### One-command deployment automation

Run the CI/CD orchestration script:

```bash
bash DEPLOY_AUTOMATION_SCRIPT.sh
```

This script will:

1. verify required deploy secrets are set (Sentry secrets optional)
2. trigger the combined CI/CD workflow (`ci-cd.yml`) on `main`
3. wait for workflow completion (poll every 15s, timeout 20 minutes)
4. trigger and wait for Fly.io deployment workflow (`fly-deploy.yml`)
5. trigger and wait for Vercel deployment workflow (`vercel-deploy.yml`)

> **Important:** `ci-cd.yml` is not a CI-only workflow. If it is configured to deploy to Fly.io and/or Vercel, running it together with `fly-deploy.yml` and `vercel-deploy.yml` can cause duplicate deployments. Use the separate deployment workflows only when `ci-cd.yml` is configured for validation/build steps only, or otherwise does not deploy those targets.
Prerequisites:

```bash
# Install GitHub CLI
# macOS:  brew install gh
# Linux:  sudo apt-get install gh
# Windows: choco install gh

# Install jq
# macOS:  brew install jq
# Linux:  sudo apt-get install jq
# Windows: choco install jq
gh auth login
```


Set and verify required repository secrets (and optionally make repo private):

```bash
bash setup-secrets-and-privacy.sh
```


### GitHub Actions CI/CD

Add these secrets to your GitHub repository:

- 🔐 `FLY_API_TOKEN` — Fly.io deployment token
- 🔐 `VERCEL_TOKEN` — Vercel auth token
- 🔐 `VERCEL_ORG_ID` — Vercel organization/team ID
- 🔐 `VERCEL_PROJECT_ID` — Vercel project ID for the web app
- 🔐 `VITE_API_URL` — Production API URL
- 🔐 `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key
- 🔐 `SENTRY_AUTH_TOKEN` — (optional) Sentry auth token for sourcemap upload
- ⚙️ `SENTRY_ORG` — (optional) Sentry org slug (e.g. `infmous`)
- ⚙️ `SENTRY_PROJECT` — (optional) Sentry project slug (e.g. `infamous-freight`)

Push to `main` and monitor:

- CI: `https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/ci-cd.yml`
- Fly deploy: `https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/fly-deploy.yml`
- Vercel deploy: `https://github.com/Infaemous-Freight/Infamous-freight/actions/workflows/vercel-deploy.yml`


### DNS verification for `infamousfreight.com`

If Vercel shows **Invalid Configuration**, verify apex DNS with:

```bash
bash scripts/check-vercel-dns.sh infamousfreight.com
```

Expected state for this project:
- `A @ -> 216.198.79.1`
- No conflicting `AAAA @` records

### Manual deployment

#### API (Fly.io)

```bash
flyctl deploy --app infamous-freight-api
```

#### Web (Vercel)

```bash
npm install -g vercel
vercel deploy --prod
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
| ☁️ Deployment | Fly.io (API), Vercel (Web), Docker |

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

- Website: `infaemous-freight.github.io/Infamous-freight/`

---

## 📄 License

Copyright 2025 Infamous Freight. All rights reserved.
