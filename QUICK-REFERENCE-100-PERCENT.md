# 🚀 Infamous Freight Enterprises - Quick Reference Guide

**Last Updated:** February 18, 2026  
**Version:** 2.2.0  
**Repository:** [MrMiless44/Infamous-freight](https://github.com/MrMiless44/Infamous-freight)

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Commands](#development-commands)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

---

## 🏁 Quick Start

### Prerequisites
```bash
# Required
- Node.js 18+ or 20+
- pnpm 8.15.9+
- PostgreSQL 14+
- Redis 7+
```

### Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

# 2. Install dependencies
pnpm install

# 3. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

# 4. Configure environment variables
# Edit .env files with your credentials

# 5. Setup database
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed

# 6. Build shared package
cd ../..
pnpm --filter @infamous-freight/shared build

# 7. Start development servers
pnpm dev
```

---

## 💻 Development Commands

### Root Commands
```bash
# Install all dependencies
pnpm install

# Start all services
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check
pnpm check:types

# Clean all build artifacts
pnpm clean
```

### API Commands
```bash
cd apps/api

# Start API server
pnpm dev               # Development mode with hot reload
pnpm start             # Production mode

# Database management
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate:dev # Create and apply migration
pnpm prisma:studio     # Open Prisma Studio GUI
pnpm prisma:seed       # Seed database with test data

# Testing
pnpm test              # Run all tests
pnpm test:coverage     # Run tests with coverage report
pnpm test:watch        # Run tests in watch mode

# Code quality
pnpm lint              # Run ESLint
pnpm lint --fix        # Fix linting issues
```

### Web Commands
```bash
cd apps/web

# Start Next.js dev server
pnpm dev               # Development mode (port 3000)
pnpm build             # Build for production
pnpm start             # Start production server

# Analyze bundle
ANALYZE=true pnpm build

# Export static site
pnpm export
```

### Mobile Commands
```bash
cd apps/mobile

# Start Expo dev server
pnpm start             # Start Expo CLI
pnpm android           # Run on Android
pnpm ios               # Run on iOS
pnpm web               # Run in web browser

# Build
pnpm build:android     # Build Android APK
pnpm build:ios         # Build iOS IPA
```

### Shared Package
```bash
cd packages/shared

# Build shared package
pnpm build             # TypeScript compilation
pnpm build:watch       # Watch mode for development
```

---

## 🔐 Environment Setup

### Required Environment Variables

#### Root `.env`
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/infamous_freight
REDIS_URL=redis://localhost:6379
AUTH_SECRET=your-secret-here
NODE_ENV=development
API_PORT=4000
WEB_PORT=3000
```

#### API `apps/api/.env`
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/infamous_freight

# Authentication
AUTH_SECRET=your-secret-here
JWT_EXPIRES_IN=7d

# AI Provider
AI_PROVIDER=synthetic  # or 'openai' or 'anthropic'
OPENAI_API_KEY=       # If using OpenAI
ANTHROPIC_API_KEY=    # If using Anthropic

# Feature Flags
ENABLE_AI_COMMANDS=true
ENABLE_AI_EXPERIMENTS=true
ENABLE_AI_ASSISTANT=true
ENABLE_AI_AUTOMATION=true
ENABLE_VOICE_PROCESSING=true

# Payment Processing
STRIPE_API_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Web `apps/web/.env`
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=true
NEXT_PUBLIC_ENABLE_AI_EXPERIMENTS=true
NEXT_PUBLIC_ENABLE_A_B_TESTING=true
```

See [.env.example](.env.example) for complete configuration.

---

## 🌐 API Endpoints

### Health & Status
```bash
GET  /health                    # Simple health check
GET  /api/health                # Detailed health with dependencies
GET  /api/status                # Operational status
```

### Authentication
```bash
POST /v1/auth/login             # JWT login
POST /v1/auth/register          # User registration
POST /v1/auth/refresh           # Refresh JWT token
POST /v1/auth/logout            # Logout user
```

### AI Features
```bash
POST /api/ai/command            # Execute AI command (scope: ai:command)
POST /api/ai/profit-predict     # Predict profit (scope: ai:predict)
GET  /api/ai/history            # Get AI history (scope: ai:history)
```

### Shipments
```bash
GET    /api/shipments           # List shipments
POST   /api/shipments           # Create shipment
GET    /api/shipments/:id       # Get shipment details
PATCH  /api/shipments/:id       # Update shipment
DELETE /api/shipments/:id       # Delete shipment
```

### Billing
```bash
POST /api/billing/checkout      # Create checkout session
POST /api/billing/portal        # Customer portal
POST /api/stripe/webhook        # Stripe webhook
```

### Firebase Notifications
```bash
POST /api/firebase/notifications/register-token  # Register device
POST /api/firebase/notifications/send           # Send notification
POST /api/firebase/notifications/send-topic     # Send to topic
GET  /api/firebase/notifications/unread         # Get unread
```

### Marketplace
```bash
GET  /api/marketplace/loads     # List available loads
POST /api/marketplace/offers    # Create offer
GET  /api/marketplace/earnings  # Driver earnings
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

---

## 🧪 Testing

### Run Tests
```bash
# All tests
pnpm test

# API tests only
pnpm --filter api test

# Web tests only
pnpm --filter web test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# Specific test file
pnpm test -- routes/ai.commands.test.js
```

### E2E Tests
```bash
# Install Playwright
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm playwright test --ui
```

### Load Testing
```bash
# Using k6
k6 run scripts/load-test-k6.js

# Custom load test
k6 run --vus 10 --duration 30s scripts/load-test-k6.js
```

---

## 🚀 Deployment

### Build for Production
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter api build
pnpm --filter web build
pnpm --filter @infamous-freight/shared build
```

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Railway Deployment
```bash
# Deploy API
railway up --service api

# Deploy Web
railway up --service web

# View logs
railway logs
```

### Vercel Deployment (Web)
```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Firebase Deployment
```bash
# Deploy hosting
firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Pre-Deployment Checklist
```bash
# 1. Run verification scripts
bash scripts/verify-ai-enabled.sh
bash scripts/verify-deployment-ready.sh
bash scripts/validate-deployment.sh

# 2. Run all tests
pnpm test

# 3. Type check
pnpm check:types

# 4. Lint
pnpm lint

# 5. Build
pnpm build

# 6. Check environment variables
# Ensure all production secrets are set
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -ti:4000 | xargs kill -9  # API
lsof -ti:3000 | xargs kill -9  # Web

# Or use different ports
API_PORT=4001 pnpm api:dev
WEB_PORT=3001 pnpm web:dev
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
cd apps/api
pnpm prisma:migrate:reset

# Regenerate Prisma client
pnpm prisma:generate
```

#### Shared Package Not Found
```bash
# Rebuild shared package
pnpm --filter @infamous-freight/shared build

# Reinstall dependencies
pnpm install
```

#### pnpm Not Found
```bash
# Install pnpm globally
npm install -g pnpm@8.15.9

# Or use corepack
corepack enable
corepack prepare pnpm@8.15.9 --activate
```

#### Docker Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Reset volumes
docker-compose down -v
```

#### Rate Limit Errors
```bash
# Check current rate limits in .env
RATE_LIMIT_AI_MAX=100
RATE_LIMIT_GENERAL_MAX=1000

# Or disable temporarily
ENABLE_RATE_LIMITING=false
```

---

## 🏗️ Architecture Overview

### Monorepo Structure
```
infamous-freight-enterprises/
├── apps/
│   ├── api/          # Express.js backend (CommonJS)
│   ├── web/          # Next.js 14 frontend (TypeScript/ESM)
│   └── mobile/       # React Native/Expo app
├── packages/
│   └── shared/       # Shared types and utilities
├── e2e/              # Playwright E2E tests
├── scripts/          # Automation scripts
└── docs/             # Documentation
```

### Technology Stack

**Backend (API):**
- Express.js 4.x
- Prisma ORM
- PostgreSQL 14+
- Redis 7+
- JWT Authentication
- Firebase Admin SDK

**Frontend (Web):**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase Client

**Mobile:**
- React Native
- Expo SDK 50+
- TypeScript
- Firebase SDK

**Infrastructure:**
- Docker & Docker Compose
- Railway (Hosting)
- Vercel (Web hosting)
- Firebase (Push notifications)
- GitHub Actions (CI/CD)

### Data Flow
```
Web/Mobile → API (REST + JWT) → PostgreSQL (Prisma)
                ↓
            Redis Cache
                ↓
         Firebase (Push)
```

### Key Directories

**API:**
- `apps/api/src/routes/` - API endpoints
- `apps/api/src/middleware/` - Express middleware
- `apps/api/src/services/` - Business logic
- `apps/api/prisma/` - Database schema & migrations

**Web:**
- `apps/web/pages/` - Next.js pages
- `apps/web/components/` - React components
- `apps/web/lib/` - Utilities & configurations

**Shared:**
- `packages/shared/src/types.ts` - TypeScript types
- `packages/shared/src/constants.ts` - Shared constants
- `packages/shared/src/utils.ts` - Utility functions

---

## 📚 Additional Resources

### Documentation
- [README.md](README.md) - Project overview
- [QUICK-REFERENCE-RECOMMENDED.md](QUICK-REFERENCE-RECOMMENDED.md) - Commands & common tasks
- [SCRIPTS-EXECUTION-RECOMMENDED.md](SCRIPTS-EXECUTION-RECOMMENDED.md) - System verification
- [API-DOCUMENTATION-RECOMMENDED.md](API-DOCUMENTATION-RECOMMENDED.md) - Complete API reference
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [DEPLOYMENT-RECOMMENDED.md](DEPLOYMENT-RECOMMENDED.md) - Deployment guide

### Scripts
- `bash scripts/verify-ai-enabled.sh` - Verify AI features
- `bash scripts/run-all-scripts-100.sh` - Run all verification
- `bash scripts/verify-firebase.sh` - Verify Firebase setup
- `bash scripts/health-monitor.sh` - Monitor API health

### Support Channels
- **Issues:** [GitHub Issues](https://github.com/MrMiless44/Infamous-freight/issues)
- **Discussions:** [GitHub Discussions](https://github.com/MrMiless44/Infamous-freight/discussions)
- **Email:** support@infamousfreight.com

---

## 🎯 Common Workflows

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes in appropriate app/package
3. Add tests for new functionality
4. Update documentation
5. Run verification: `bash scripts/run-all-scripts-100.sh`
6. Commit: `git commit -m "feat: add my feature"`
7. Push and create PR

### Updating Database Schema
1. Edit `apps/api/prisma/schema.prisma`
2. Create migration: `pnpm prisma:migrate:dev --name my_change`
3. Generate client: `pnpm prisma:generate`
4. Update types in `packages/shared` if needed
5. Restart API server

### Deploying to Production
1. Run all verification scripts
2. Ensure all tests pass
3. Build all packages
4. Update environment variables
5. Deploy API first, then Web
6. Monitor logs and status endpoints
7. Rollback if issues detected

---

**Need Help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or reach out on GitHub Discussions.

**Version:** 2.2.0 | **Last Updated:** February 18, 2026
