[![Netlify Status](https://api.netlify.com/api/v1/badges/f6837275-9828-47d7-86ce-da52f48b6a84/deploy-status)](https://app.netlify.com/projects/infamousfreight/deploys)

## Infamous Freight Enterprises ♊️
**AI-Powered Freight & Logistics Automation Platform**

## Deployment Architecture

Infamous Freight operates a multi-platform, enterprise-grade CI/CD pipeline designed for reliability, scalability, and zero-drift builds.

### 🌐 Web Frontend (Netlify primary, Vercel secondary)
- Auto-deploys on every push to `main`
- pnpm workspace monorepo support
- Locked dependency installs via `pnpm install --frozen-lockfile`
- Shared packages build before web app
- Next.js runtime with Edge + Functions support
- Deployed to Netlify as the primary frontend, with Vercel used for preview/secondary environments
- Cache-safe builds using Corepack + pinned pnpm

### 🔌 API (Fly.io)
- Deployed via GitHub Actions
- Prisma migrations validated per release
- Zero-downtime rolling deployments
- Health-checked with automatic rollback

### 📱 Mobile (Expo EAS)
- OTA updates enabled
- Release channels synced to GitHub environments
- Store builds aligned with CI pipeline

### 🔐 CI Integrity
- All platforms share version-locked tooling
- No environment drift between local and CI
- Build reproducibility enforced across pipelines

# Infæmous Freight

**Version: v2.0.0** | **Proprietary Software** | **© 2025 Infæmous Freight. All Rights Reserved.**

[![Test Coverage](https://img.shields.io/badge/coverage-86.2%25-brightgreen.svg)](./api/coverage)
[![Tests](https://img.shields.io/badge/tests-197%20passing-brightgreen.svg)](./api)
[![Node.js](https://img.shields.io/badge/node-20.0.0+-brightgreen.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.0-orange.svg)](https://pnpm.io)
[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](./LICENSE)

## Deployment Status

[![Auto Deploy](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/auto-deploy.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/auto-deploy.yml)
[![Deploy API (Fly.io)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/fly-deploy.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/fly-deploy.yml)
[![Deploy Web (Vercel)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/vercel-deploy.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/vercel-deploy.yml)
[![Deploy Mobile (Expo)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/mobile-deploy.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/mobile-deploy.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/ea96723a-5981-4a9b-a2fc-9c5a367e0313/deploy-status)](https://app.netlify.com/projects/infamousfreight/deploys)

**Live Deployments:**

- 🌐 **Web**: [infamous-freight-enterprises.vercel.app](https://infamous-freight-enterprises.vercel.app) | Netlify Project: [infamousfreight](https://app.netlify.com/projects/infamousfreight/deploys)
- 🔌 **API**: [infamous-freight-api.fly.dev](https://infamous-freight-api.fly.dev/api/health)
- 📱 **Mobile**: [Expo EAS](https://expo.dev/@infamous-freight/mobile)

**China CDN Integration (Netlify):**
- Adds `@21yunbox/netlify-plugin-21yunbox-deploy-to-china-cdn` to publish static assets to a mainland China CDN.
- Configure required env vars in Netlify:
   - `YUNBOX_TOKEN` and `YUNBOX_SITE_ID` (per plugin docs)
   - Optionally set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE` to your public API.

### 🗄️ Netlify + Neon Database Access
- Netlify can auto-provide `NETLIFY_DATABASE_URL` for Neon.
- Example query using the Netlify Neon client:

```js
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`;
```

> **🎉 100% AUTO-DEPLOYMENT READY!** All platforms configured with smart change detection. Push to `main` to deploy automatically!

**Quick Start:**

```bash
# Verify configuration
./scripts/verify-auto-deploy.sh

# Check live services
./scripts/check-deployments.sh

# One-command setup (first time)
./scripts/setup-auto-deploy.sh
```

**Documentation:**

- 📝 [Quick Start Guide](AUTO_DEPLOY_READY.md) - 3 steps to deploy
- 🔍 [Deployment Dashboard](DEPLOYMENT_STATUS.md) - Live status & monitoring
- 📚 [Complete Guide](deploy/100_PERCENT_AUTO_DEPLOY.md) - Full documentation
- ✅ [Vercel Project Settings](deploy/vercel-project-settings.md) - Execution plan checklist
- 🐛 [Troubleshooting](deploy/FLY_TROUBLESHOOTING.md) - Debug issues

## 🐳 Docker - 100% Production-Ready

[![Docker Build](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/docker-build.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/docker-build.yml)

> **✅ OPTIMIZED!** All Dockerfiles hardened with multi-stage builds, security best practices, and monorepo support.

**Quick Commands:**

```bash
# Start all services
./scripts/docker-manager.sh up

# Check health
./scripts/docker-manager.sh health

# View logs
./scripts/docker-manager.sh logs

# Production build
./scripts/docker-manager.sh prod-build
```

**Features:**

- ✅ Multi-stage builds (base → deps → builder → runner)
- ✅ Security hardened (non-root users, minimal attack surface)
- ✅ Health checks for all services (30s interval)
- ✅ Monorepo-aware (shared package support)
- ✅ Optimized caching (pnpm store mounts)
- ✅ Production-ready (PostgreSQL 16, Redis 7, Alpine Linux)

**Documentation:** [DOCKER_COMPLETE.md](DOCKER_COMPLETE.md) - Complete Docker guide

## �📊 Workflow Status

[![CI/CD Pipeline](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/ci-cd.yml)
[![CI](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/e2e.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/e2e.yml)
[![Deploy API (Render)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/render-deploy.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/render-deploy.yml)
[![Deploy Web (Vercel)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/vercel-deploy.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/vercel-deploy.yml)
[![Docker Build](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/docker-build.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/docker-build.yml)
[![GitHub Pages](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/deploy-pages.yml)
[![CodeQL](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/codeql.yml)
[![Quality Checks](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/quality.yml)
[![GHCR Build](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/docker-ghcr.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/docker-ghcr.yml)
[![Prod Deploy](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/deploy-docker-compose.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/deploy-docker-compose.yml)

A modern full-stack freight management platform with AI-powered features, real-time voice capabilities, and integrated billing system.

**Company**: Infæmous Freight | **Owner**: Santorio Djuan Miles | **Jurisdiction**: Oklahoma, USA

## 🏆 Conglomerate Mode

Infæmous Freight + Genesis AI are operating as a unified global logistics + fintech + AI SaaS conglomerate. See the full activation brief and market-ready positioning in [CONGLOMERATE_MODE.md](CONGLOMERATE_MODE.md).

## 📋 Project Overview

Infamous Freight Enterprises is a comprehensive logistics and fleet management solution built as a monorepo with:

## 🚀 Enterprise Expansion Activation

The enterprise expansion scope for Infæmous Freight + Genesis AI is documented in the activation brief below:

- [Enterprise Expansion 100% Activated](ENTERPRISE_EXPANSION_100_ACTIVATED.md)

## ✨ Latest Updates (v2.0.0 - December 30, 2025)

🎉 **MAJOR RELEASE - Complete Rebranding & IP Protection:**

✅ **Company Rebranding**

- Rebranded from "Infamous Freight Enterprises LLC" to "**Infæmous Freight**"
- Updated all documentation with new branding (æ ligature)
- Updated package metadata across all packages
- Version bumped to **v2.0.0**

✅ **Intellectual Property Protection**

- Added proprietary LICENSE file with comprehensive protections
- Added COPYRIGHT notice with owner information
- Added AUTHORS file crediting Santorio Djuan Miles as founder
- Added LEGAL_NOTICE.md with enforcement terms
- Added OWNERS file for GitHub code ownership
- Added copyright headers to source code
- Set license to "Proprietary" across all package.json files

✅ **Code Quality & Perfection**

- Fixed all TypeScript errors (0 errors, 0 warnings)
- Cleaned and optimized repository caches
- Repository size optimized to 71MB
- Git history cleaned with aggressive garbage collection
- All tests passing and type-safe

✅ **Deployment & Production**

- Deployed to Vercel production
- Code pushed to GitHub repository
- Automatic CI/CD triggered
- Ready for enterprise use

📚 **Critical Documentation**:

- [LICENSE](./LICENSE) - Proprietary software license
- [COPYRIGHT](./COPYRIGHT) - Copyright and IP information
- [AUTHORS](./AUTHORS) - Project authorship
- [LEGAL_NOTICE.md](./LEGAL_NOTICE.md) - Legal terms and enforcement
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints & examples

## � GitHub Actions Documentation

Comprehensive workflow documentation and guides:

- **[Workflow Index](./.github/INDEX.md)** - Complete navigation guide
- **[Workflow Guide](./.github/WORKFLOW_GUIDE.md)** - All 13 workflows explained in detail
- **[Decision Tree](./.github/WORKFLOW_DECISION_TREE.md)** - When and why workflows trigger
- **[Security Guide](./.github/SECURITY.md)** - Secrets rotation & compliance
- **[Performance](./.github/PERFORMANCE.md)** - Performance budgets & monitoring
- **[Metrics](./.github/METRICS.md)** - Cost tracking & monthly reviews

See [.github/INDEX.md](./.github/INDEX.md) for quick navigation to all workflow documentation.

## �🚀 Quick Start

# Response

"timestamp": 1702756800000,
"status": "ok",
"database": "connected"
}

````

**Full API Reference**: See [API_REFERENCE.md](API_REFERENCE.md) for all endpoints, auth, and curl examples

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Git

### One-Command Setup

```bash
# Run automated setup script
./setup.sh
````

This will:

- Install pnpm (if needed)
- Install all dependencies
- Build shared package
- Setup environment template
- Configure git hooks
- Generate Prisma client

### Manual Setup

1. **Install pnpm**

   ```bash
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   source ~/.bashrc  # or restart terminal
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Build Shared Package**

   ```bash
   pnpm --filter @infamous-freight/shared build
   ```

4. **Configure Environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

5. **Initialize Database**

   ```bash
   cd api
   pnpm prisma:migrate:dev
   pnpm prisma:seed  # Optional: seed initial data
   ```

6. **Start Development**

   ```bash
   # Start all services
   pnpm dev

   # Or start individually:
   pnpm api:dev      # API on http://localhost:3001
   pnpm web:dev      # Web on http://localhost:3000
   ```

## 📁 Project Structure

```
├── api/                           # Express.js backend
│   ├── prisma/                   # Database schema and migrations
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Security & utilities
│   │   └── server.js             # Express server
│   └── scripts/                  # Database and utility scripts
├── web/                          # Next.js frontend
│   ├── pages/                    # API routes and pages
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   └── styles/                   # Global styles
├── mobile/                       # React Native mobile app
│   ├── App.tsx                   # Main app component
│   └── assets/                   # Mobile assets
├── packages/
│   └── shared/                   # Shared TypeScript package
│       ├── src/
│       │   ├── types.ts         # Common types
│       │   ├── constants.ts     # App constants
│       │   ├── utils.ts         # Utility functions
│       │   └── env.ts           # Environment helpers
│       └── package.json
├── e2e/                          # Playwright E2E tests
├── docs/                         # Documentation
│   ├── deployment/               # Deployment guides
│   └── history/                  # Project history
├── nginx/                        # Reverse proxy configuration
├── pnpm-workspace.yaml           # Monorepo configuration
├── .github/workflows/            # CI/CD pipelines
└── docker-compose*.yml           # Container orchestration
```

## 🔧 Development

### Available Scripts

**From Root** (recommended):

```bash
pnpm dev              # Start all services in parallel
pnpm api:dev          # Start only API service
pnpm web:dev          # Start only web service
pnpm build            # Build all services
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage
pnpm lint             # Lint all services
pnpm lint:fix         # Fix linting issues
pnpm e2e              # Run E2E tests
pnpm clean            # Clean all node_modules
```

**Individual Services:**

```bash
# API
pnpm --filter infamous-freight-api dev
pnpm --filter infamous-freight-api test
pnpm --filter infamous-freight-api prisma:migrate

# Web
pnpm --filter infamous-freight-web dev
pnpm --filter infamous-freight-web build
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database Management

- **Run Migrations**: `cd api && npx prisma migrate dev`
- **Studio (GUI)**: `cd api && npm run prisma:studio`
- **Generate Client**: `cd api && npm run prisma:generate`
- **Seed Database**: `cd api && npx prisma db seed`

### AI Coding Assistant

**Codex CLI** is available in the devcontainer:

```bash
codex                 # Start interactive Codex agent
codex --version       # Check version
codex exec --help     # Non-interactive mode
```

**Keyboard Shortcuts** (VS Code):

- `Ctrl+Shift+C` - Start Codex interactive mode
- `Ctrl+Shift+X` - Run Codex exec

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md#codex-cli) for more details.

### Code Quality

```bash
# Lint web application
cd web && npm run lint

# Validate API environment
cd api && npm run validate:env
```

## 🐳 Docker

### Quick Start with Docker

```bash
# Development environment
docker-compose up

# Build and start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Services

```bash
# Start only database
docker-compose up postgres

# Start API + database
docker-compose up api postgres

# Rebuild after code changes
docker-compose up --build
```

### Docker Features

- **Multi-stage builds** for optimized image sizes
- **BuildKit caching** with pnpm store mounts
- **Healthchecks** for service dependency management
- **Named volumes** for cache persistence:
  - `pnpm-store` - Shared pnpm cache
  - `node-modules-*` - Service-specific dependencies
  - `nextjs-cache` - Next.js build cache
- **Environment overrides** via `.env.local`

### Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up
```

### GHCR Images

CI publishes multi-arch images to GitHub Container Registry (GHCR):

- ghcr.io/<owner>/infamous-freight-enterprises-api
- ghcr.io/<owner>/infamous-freight-enterprises-web

Tags:

- `latest` on `main`
- release tags (e.g., `v1.2.3`)
- commit `sha`

Login and pull:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-username> --password-stdin
docker pull ghcr.io/<owner>/infamous-freight-enterprises-api:latest
docker pull ghcr.io/<owner>/infamous-freight-enterprises-web:latest
```

`docker-compose.prod.yml` consumes GHCR images; set `GHCR_OWNER` env to override the default owner.

## 🚢 Deployment

Deployment guides are available for:

- **Fly.io**: See [deploy/fly-env.md](deploy/fly-env.md)
- **Render**: See [deploy/render-env.md](deploy/render-env.md)
- **Vercel** (Frontend): See [deploy/vercel-env.md](deploy/vercel-env.md)

## 🏗️ Architecture

### API Routes

- `/api/health` - Health check endpoint
- `/api/billing` - Billing and payment management
- `/api/voice` - Voice communication endpoints
- `/api/ai/commands` - AI command processing
- `/api/ai/sim` - AI simulation endpoints

### Database Models

- **User** - Application users with roles
- **Driver** - Fleet drivers with status tracking
- **Shipment** - Freight shipments with tracking
- **AiEvent** - AI event logging

## 🔐 Security Features

- JWT authentication
- CORS configuration
- Helmet.js security headers
- Rate limiting
- Input validation
- Secure environment variable handling

## 📦 Technologies

### Backend

- Express.js - HTTP server
- Prisma - ORM & migrations
- PostgreSQL - Database
- JWT - Authentication
- Helmet - Security headers
- CORS - Cross-origin requests
- Rate Limiter Flexible - Rate limiting

### Frontend

- Next.js 14 - React framework
- TypeScript - Type safety
- SWR - Data fetching
- Tailwind CSS - Styling (via global.css)

### APIs & Services

- OpenAI - LLM capabilities
- Anthropic - AI features
- Stripe - Payment processing
- PayPal - Payment processing
- Multer - File uploads

## 📝 Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:

- `NODE_ENV` - Environment (development/production)
- `API_PORT` - API server port
- `WEB_PORT` - Web server port
- `DATABASE_URL` - PostgreSQL connection string
- `API_KEY_*` - Third-party API keys (OpenAI, Stripe, etc.)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

**Database Connection Issues**

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`

**Port Already in Use**

- API default: `4000`
- Web default: `3000`
- Change in `.env` if needed

**Missing Dependencies**

```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For issues or questions, please open a GitHub issue or contact the development team.

## 🔐 Required Secrets

- `GHCR_USERNAME`, `GHCR_TOKEN`: GHCR login for deploy hosts (read:packages).
- `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `[SSH_PORT]`: Production SSH access for compose deploys.
- `SSH_HOST_STAGING`, `SSH_USER_STAGING`, `SSH_KEY_STAGING`, `[SSH_PORT_STAGING]`: Staging SSH access.
- `CODECOV_TOKEN`: For code coverage uploads (if used in CI).
- `FLY_API_TOKEN`: For Fly.io deployment workflow.
- `VERCEL_TOKEN`: For Vercel deployment workflow.
- `TEST_EMAIL`, `TEST_PASSWORD`: For e2e tests gated by secrets.
- `[optional] SLACK_WEBHOOK_URL`: To receive deploy/promotion/rollback notifications in Slack.
- `[optional] TEAMS_WEBHOOK_URL`: To receive deploy/promotion/rollback notifications in Microsoft Teams.

See docs/ENVIRONMENT_PROTECTION_CHECKLIST.md for environment-scoped setup.
# Auto-deploy test
