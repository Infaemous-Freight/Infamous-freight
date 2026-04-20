# INFAMOUS FREIGHT

The freight dispatch platform built by truckers, for truckers.

## Features

- **Auto-Dispatch AI** — Matches loads to drivers in 90 seconds
- **Rate Negotiation Bot** — Counters lowball offers, +8% revenue per load
- **Voice Booking** — "Find me a reefer load" → booked
- **Multi-ELD Sync** — Samsara, Motive, Omnitracs, Geotab
- **Load Board Aggregation** — DAT, Truckstop, 123Loadboard unified search
- **Digital BOL/POD** — Upload, sign, invoice — all in one
- **Driver Payroll** — Per-mile, percentage, flat, or hourly
- **Factoring Integration** — RTS, OTR, Apex, Bluevine, eCapital
- **CSA Score Monitor** — All 7 BASIC categories tracked
- **Broker Credit Checks** — A+ to F rating, days-to-pay tracking
- **Geofencing & ETA** — Smart alerts, customer tracking links
- **IFTA Auto-Reporting** — Quarterly fuel tax calculations
- **Team Management** — Role-based access (Owner/Dispatcher/Safety/Accountant/Driver)
- **Rate Analytics** — Historical trends, market comparisons
- **Chrome Extension** — Book loads directly from DAT/Truckstop/123Loadboard
- **Real-time Chat** — Driver-dispatcher messaging with voice notes
- **Backhaul Finder** — Minimize deadhead after every delivery
- **Rate Con Generator** — Professional PDF confirmations
- **Carrier Packet Generator** — W-9, COI, insurance certificates
- **Stripe Payments** — Subscriptions + Pay Per Load
- **QuickBooks/Xero Sync** — Auto invoice sync

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env
# Edit .env with your API keys

# 3. Start with Docker (recommended)
docker-compose up -d

# 4. Or start manually
npm run db:setup    # Prisma generate + migrate + seed
npm run dev         # Starts API + Web concurrently
```

## Deployment

### GitHub Actions CI/CD (Recommended)

1. Add secrets to your GitHub repo:
   - `FLY_API_TOKEN` — Fly.io deployment token
   - `NETLIFY_AUTH_TOKEN` — Netlify auth token
   - `NETLIFY_SITE_ID` — Netlify site ID
   - `VITE_API_URL` — Production API URL
   - `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key

2. Push to `main` branch → auto-deploys API to Fly.io + Web to Netlify

### Manual Deployment

```bash
# API (Fly.io)
flyctl deploy --app infamous-freight-api

# Web (Netlify)
npm run build:web
netlify deploy --prod --dir=apps/web/dist
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Socket.io |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Realtime | Socket.io WebSockets |
| Payments | Stripe |
| Auth | Supabase Auth + JWT |
| Deployment | Fly.io (API) + Netlify (Web) + Docker |

## Project Structure

```
infamous-all-in/
├── apps/
│   ├── api/              # NestJS backend (76+ files)
│   │   ├── src/
│   │   │   ├── dispatch/       # Auto-dispatch AI, backhaul, rate negotiation
│   │   │   ├── loads/          # Load board aggregator
│   │   │   ├── invoice/        # BOL/POD + invoicing
│   │   │   ├── eld/            # Samsara, Motive, Omnitracs, Geotab
│   │   │   ├── chat/           # Real-time messaging
│   │   │   ├── payroll/        # Driver settlements
│   │   │   ├── factoring/      # 5 factoring companies
│   │   │   ├── compliance-csa/ # CSA/SMS monitoring
│   │   │   ├── compliance-expiry/ # Document expiry tracking
│   │   │   ├── accounting/     # QuickBooks + Xero
│   │   │   ├── rate-analytics/ # Rate trends + comparisons
│   │   │   ├── broker-credit/  # Broker scoring
│   │   │   ├── geofencing/     # ETA + alerts
│   │   │   ├── ifta/           # Fuel tax reporting
│   │   │   ├── rbac/           # Role-based access
│   │   │   ├── redis/          # Caching layer
│   │   │   ├── rate-limit/     # API rate limiting
│   │   │   ├── stripe/         # Payment processing
│   │   │   ├── uploads/        # Document uploads
│   │   │   ├── notifications/  # WebSocket notifications
│   │   │   ├── audit/          # Audit logging
│   │   │   └── ...
│   └── web/              # React frontend (30+ files)
│       ├── src/
│       │   ├── pages/          # Dashboard, Loads, Dispatch, Drivers, etc.
│       │   ├── components/     # UI components + feature components
│       │   ├── layouts/        # App shell with sidebar
│       │   ├── store/          # Zustand state management
│       │   ├── api-client/     # Axios API wrapper
│       │   └── extension/      # Chrome extension
├── compliance/           # Canadian HOS rules
├── templates/            # Cold emails + LinkedIn calendar
├── docs/                 # Sales playbook, launch checklists
├── Dockerfile.api
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/    # CI/CD pipeline
```

## License

Copyright 2025 Infamous Freight. All rights reserved.
