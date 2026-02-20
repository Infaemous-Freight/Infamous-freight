<div align="center">

# ♊️ Infamous Freight Enterprises

### AI-Powered Freight & Logistics Automation Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/f6837275-9828-47d7-86ce-da52f48b6a84/deploy-status)](https://app.netlify.com/projects/infamousfreight/deploys)
[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/MrMiless44/Infamous-freight/actions/workflows/e2e-tests.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/e2e-tests.yml)
[![Deploy All](https://github.com/MrMiless44/Infamous-freight/actions/workflows/deploy-all.yml/badge.svg?branch=main)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/deploy-all.yml)
[![codecov](https://codecov.io/gh/MrMiless44/Infamous-freight/branch/main/graph/badge.svg)](https://codecov.io/gh/MrMiless44/Infamous-freight)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**Infamous Freight Enterprises** is a comprehensive, enterprise-grade freight and logistics automation platform powered by AI. Built as a modern monorepo with TypeScript, it provides end-to-end shipment management, real-time tracking, AI-powered command processing, and multi-tenant support.

### 🎯 Key Highlights

- 🤖 **AI-Powered Commands** - Natural language processing for operational commands
- 📦 **Real-Time Tracking** - Live shipment tracking with analytics dashboards
- 🔒 **Enterprise Security** - JWT authentication, scope-based authorization, OWASP compliance
- 🌐 **Multi-Tenant** - Organization-based isolation with encryption at rest
- 📱 **Cross-Platform** - Web (Next.js), Mobile (React Native/Expo), API (Express.js)
- 🚀 **Cloud-Native** - Docker, Kubernetes-ready, multi-region deployment
- 📊 **Observability** - Comprehensive logging, monitoring, and error tracking

---

## ✨ Features

### Core Features
- ✅ **Shipment Management** - Create, track, update, and manage shipments
- ✅ **Driver Management** - Driver assignments, performance tracking, and routing
- ✅ **Analytics & Reporting** - Real-time dashboards with performance metrics
- ✅ **AI Command Processing** - Natural language commands (OpenAI/Anthropic/Synthetic)
- ✅ **Voice Commands** - Audio-to-text command processing
- ✅ **Webhook System** - Event-driven integrations with HMAC signing
- ✅ **Multi-Tenant Architecture** - Organization-based data isolation
- ✅ **API Versioning** - Backward-compatible API evolution (v1, v2)

### Security & Compliance
- ✅ **JWT Authentication** - Secure token-based authentication with RS256
- ✅ **Scope-Based Authorization** - Fine-grained access control
- ✅ **Rate Limiting** - Per-endpoint rate limits with Redis backing
- ✅ **Audit Logging** - Comprehensive security event tracking
- ✅ **Data Encryption** - Encryption at rest with key rotation
- ✅ **OWASP Compliance** - Security best practices implementation
- ✅ **Secret Management** - Secure credential storage and rotation

### Deployment & Operations
- ✅ **Docker & Docker Compose** - Containerized services
- ✅ **CI/CD Pipelines** - GitHub Actions workflows for automated deployment
- ✅ **Multi-Region Support** - Deployment to Fly.io (SJC, IAD, LHR)
- ✅ **Database Migrations** - Prisma-based schema management
- ✅ **Health Checks** - Liveness and readiness probes
- ✅ **Automated Rollback** - One-command rollback to previous versions
- ✅ **Load Testing** - k6-based performance testing

---

## 🏗️ Architecture

### Monorepo Structure

```
infamous-freight-enterprises/
├── apps/
│   ├── api/              # Express.js API (CommonJS, PostgreSQL, Prisma)
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints (health, shipments, ai, voice, etc.)
│   │   │   ├── middleware/  # Auth, validation, rate limiting, error handling
│   │   │   ├── services/ # Business logic (AI, webhooks, analytics)
│   │   │   └── config/   # Configuration and environment loading
│   │   ├── prisma/       # Database schema and migrations
│   │   └── __tests__/    # Unit and integration tests
│   ├── web/              # Next.js 14 web app (TypeScript, ESM)
│   │   ├── pages/        # Next.js pages and API routes
│   │   ├── components/   # React components
│   │   └── styles/       # CSS and styling
│   └── mobile/           # React Native/Expo mobile app
│       ├── src/
│       └── app.json      # Expo configuration
├── packages/
│   └── shared/           # Shared TypeScript library
│       ├── src/
│       │   ├── types.ts      # Domain types and interfaces
│       │   ├── constants.ts  # Constants and enums
│       │   ├── utils.ts      # Utility functions
│       │   └── env.ts        # Environment validation
│       └── dist/         # Compiled output
├── e2e/                  # Playwright end-to-end tests
├── docs/                 # Additional documentation
├── scripts/              # Automation scripts
└── .github/
    └── workflows/        # CI/CD pipelines
```

### Technology Stack

**Backend (API)**
- **Runtime:** Node.js 20+ (CommonJS)
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 16 with Prisma ORM
- **Cache:** Redis 7.x
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Testing:** Jest, Supertest

**Frontend (Web)**
- **Framework:** Next.js 14 (TypeScript, ESM)
- **UI Framework:** React 18
- **Styling:** CSS Modules / Tailwind CSS
- **State Management:** React Context / Zustand
- **Analytics:** Vercel Analytics, Datadog RUM
- **Testing:** Jest, React Testing Library

**Mobile**
- **Framework:** React Native with Expo
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Storage:** AsyncStorage
- **Navigation:** React Navigation

**DevOps & Infrastructure**
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Fly.io (API), Vercel (Web), Expo (Mobile)
- **Monitoring:** Sentry, Datadog, Winston logging
- **Load Testing:** k6

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.11.1
- **pnpm** 9.15.0 (managed by Corepack)
- **Docker** and Docker Compose (optional, for containerized development)
- **PostgreSQL** 16+ (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MrMiless44/Infamous-freight.git
   cd Infamous-freight
   ```

2. **Install dependencies**
   ```bash
   corepack enable
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build shared package** (required before starting API)
   ```bash
   pnpm build:shared
   ```

5. **Set up database**
   ```bash
   cd apps/api
   pnpm prisma:generate
   pnpm prisma:migrate:dev
   cd ../..
   ```

6. **Start development servers**
   ```bash
   # Start all services (API + Web)
   pnpm dev

   # Or start individually
   pnpm dev:api   # API on http://localhost:4000
   pnpm dev:web   # Web on http://localhost:3000
   ```

### Using Docker (Alternative)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Verify Installation

- **API Health Check:** http://localhost:4000/api/health
- **Web Application:** http://localhost:3000
- **API Documentation:** http://localhost:4000/api/docs (if Swagger enabled)

---

## 📚 Documentation

### Essential Guides
- 📖 [**Complete Documentation Index**](DOCUMENTATION_INDEX.md) - Central hub for all docs
- 🚀 [**Quick Reference**](QUICK-REFERENCE-RECOMMENDED.md) - Common commands and operations
- 🤝 [**Contributing Guide**](CONTRIBUTING.md) - Development workflow and standards
- 📡 [**API Documentation**](API-DOCUMENTATION-RECOMMENDED.md) - Complete API reference
- 🔒 [**Security Guide**](SECURITY-RECOMMENDED.md) - Security best practices
- 🚢 [**Deployment Guide**](DEPLOYMENT-RECOMMENDED.md) - Production deployment instructions

### Development
- [Architecture Decisions](ARCHITECTURE_DECISIONS.md)
- [Database Setup (Prisma)](PRISMA-SETUP-RECOMMENDED.md)
- [Error Handling Standards](ERROR-HANDLING-RECOMMENDED.md)
- [Middleware Integration](MIDDLEWARE_INTEGRATION_GUIDE.md)
- [Performance Optimization](PERFORMANCE-OPTIMIZATION-ROADMAP-RECOMMENDED.md)

### Operations
- [Operations Runbook](OPERATIONS-RUNBOOK-RECOMMENDED.md)
- [Incident Response](INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md)
- [Backup & Recovery](BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md)
- [Disaster Recovery](DISASTER-RECOVERY-PLAN-RECOMMENDED.md)
- [Load Testing Strategy](LOAD-TESTING-STRATEGY-RECOMMENDED.md)

### Team Resources
- [Team Onboarding](TEAM-ONBOARDING-GUIDE-RECOMMENDED.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG-RECOMMENDED.md)

---

## 🛠️ Development Workflow

### Common Commands

```bash
# Development
pnpm dev                    # Start all services in development mode
pnpm dev:api                # Start API server only
pnpm dev:web                # Start web server only

# Building
pnpm build                  # Build all packages
pnpm build:shared           # Build shared package (required before API)
pnpm build:api              # Build API
pnpm build:web              # Build web app
pnpm build:mobile           # Build mobile app

# Quality Assurance
pnpm lint                   # Run ESLint on all packages
pnpm lint:fix               # Fix linting issues automatically
pnpm format                 # Format code with Prettier
pnpm format:check           # Check code formatting
pnpm typecheck              # TypeScript type checking

# Testing
pnpm test                   # Run all tests
pnpm test:coverage          # Run tests with coverage report
pnpm --filter api test      # Run API tests only
pnpm --filter web test      # Run web tests only

# Database (Prisma)
cd apps/api
pnpm prisma:migrate:dev     # Create and apply migration
pnpm prisma:migrate:reset   # Reset database (CAUTION: deletes data)
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:studio          # Open Prisma Studio (GUI)
pnpm prisma:seed            # Seed database with sample data
```

### Deployment

```bash
# Deploy to production
pnpm deploy:all             # Deploy API (Fly.io) + Web (Vercel)
pnpm deploy:vercel          # Deploy web to Vercel
pnpm deploy:fly             # Deploy API to Fly.io

# Check deployment status
pnpm status                 # Check status of all services
pnpm status:vercel          # Check Vercel deployment
pnpm status:fly             # Check Fly.io deployment

# View logs
pnpm logs:vercel            # View Vercel logs
pnpm logs:fly               # View Fly.io logs
```

### Git Workflow

1. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and commit with conventional commits
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Commit types: feat, fix, docs, style, refactor, test, chore
   ```

3. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **CI/CD Pipeline** runs automatically:
   - Linting and formatting checks
   - Type checking
   - Unit and integration tests
   - E2E tests
   - Docker image builds
   - Deployment to staging (if applicable)

---

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Node Environment
NODE_ENV=development

# Application Ports
API_PORT=4000
WEB_PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/infamous_freight

# Authentication
JWT_SECRET=your-secret-key-here-minimum-32-characters

# AI Configuration
AI_PROVIDER=synthetic  # openai | anthropic | synthetic
AI_OPENAI_KEY=sk-...   # For OpenAI
AI_ANTHROPIC_KEY=sk-ant-...  # For Anthropic

# Redis (optional, for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# Error Tracking
SENTRY_DSN=https://...@sentry.io/...

# Email (optional)
SENDGRID_API_KEY=SG...
AWS_SES_ACCESS_KEY=...
AWS_SES_SECRET_KEY=...

# Payment Processing (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

See [.env.example](.env.example) for complete list with descriptions.

---

## 🧪 Testing

### Test Coverage

Current coverage thresholds:
- **API**: Lines 75%, Functions 80%, Branches 70%, Statements 75%
- **Web**: Lines 70%, Functions 75%, Branches 65%, Statements 70%

### Running Tests

```bash
# All tests
pnpm test

# With coverage
pnpm test:coverage

# API tests only
pnpm --filter api test

# API integration tests
pnpm --filter api test:integration

# Web tests
pnpm --filter web test

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test -- --watch
```

### Load Testing

```bash
# Basic load test
k6 run load-test.k6.js

# Enhanced load test with scenarios
k6 run load-test-enhanced.k6.js
```

---

## 📦 Production Deployment

### Deployment Targets

- **API**: Fly.io (multi-region: San Jose, Ashburn, London)
- **Web**: Vercel (edge network, automatic SSL)
- **Database**: PostgreSQL on Fly.io / Supabase
- **Cache**: Redis on Fly.io / Upstash
- **Storage**: AWS S3 / Cloudflare R2

### Deployment Process

1. **Merge to `main` branch** triggers automatic deployment via GitHub Actions
2. **Run tests and build** on CI/CD pipeline
3. **Deploy to Fly.io** (API) with health checks
4. **Deploy to Vercel** (Web) with automatic preview URLs
5. **Run post-deployment checks** and smoke tests

### Manual Deployment

```bash
# Deploy API to Fly.io
flyctl deploy --config apps/api/fly.toml

# Deploy Web to Vercel
cd apps/web && vercel deploy --prod

# Deploy both
pnpm deploy:all
```

### Rollback

```bash
# Automated rollback script
./scripts/rollback.sh production [version]

# Manual Fly.io rollback
flyctl releases rollback --app infamous-freight-api

# Manual Vercel rollback
vercel rollback [deployment-url]
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. **Fork the repository** and clone your fork
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Run tests and linting**: `pnpm test && pnpm lint`
6. **Commit with conventional commits**: `git commit -m "feat: add amazing feature"`
7. **Push to your fork**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** to the `main` branch

### Coding Standards

- ✅ TypeScript for all new code (Web, Shared packages)
- ✅ ESLint + Prettier for code formatting
- ✅ Conventional commits for commit messages
- ✅ Test coverage for new features (>75%)
- ✅ Documentation for public APIs
- ✅ Security best practices (no secrets in code)

---

## 📊 Project Status

### Current Version
- **API**: v2.0.0
- **Web**: v2.0.0
- **Mobile**: v1.5.0

### Roadmap

#### ✅ Phase 1 - Core Platform (Complete)
- [x] Shipment management system
- [x] Driver management
- [x] Basic analytics dashboard
- [x] JWT authentication
- [x] PostgreSQL database with Prisma
- [x] Docker containerization

#### ✅ Phase 2 - Advanced Features (Complete)
- [x] AI command processing
- [x] Voice command support
- [x] Webhook system with HMAC signing
- [x] API versioning (v1, v2)
- [x] Multi-tenant architecture
- [x] Enhanced analytics

#### 🔄 Phase 3 - Scale & Optimize (In Progress)
- [x] Multi-region deployment
- [x] Redis caching layer
- [x] Rate limiting improvements
- [x] Performance monitoring (Datadog, Sentry)
- [ ] GraphQL API layer
- [ ] Real-time WebSocket updates

#### 📋 Phase 4 - Enterprise Features (Planned)
- [ ] Advanced reporting and BI
- [ ] Custom integrations marketplace
- [ ] White-label capabilities
- [ ] Advanced AI features (predictive analytics)
- [ ] Mobile app parity with web features

---

## 📞 Support & Community

### Getting Help

- 📖 Check the [Documentation Index](DOCUMENTATION_INDEX.md)
- 🐛 Report bugs via [GitHub Issues](https://github.com/MrMiless44/Infamous-freight/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/MrMiless44/Infamous-freight/discussions)
- 📧 Email support: support@infamousfreight.com

### Community

- Follow us on [Twitter](https://twitter.com/infamousfreight)
- Join our [Discord](https://discord.gg/infamousfreight)
- Read our [Blog](https://blog.infamousfreight.com)

---

## 📄 License

This project is proprietary and confidential. See [LICENSE](LICENSE) for details.

Copyright © 2025 Infæmous Freight Enterprises. All Rights Reserved.

---

## 👥 Team

- **Author**: Santorio Djuan Miles
- **Contributors**: See [AUTHORS](AUTHORS)
- **Maintainers**: See [OWNERS](OWNERS)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Express.js](https://expressjs.com/), and [Prisma](https://www.prisma.io/)
- Deployed on [Fly.io](https://fly.io/) and [Vercel](https://vercel.com/)
- Monitored with [Sentry](https://sentry.io/) and [Datadog](https://www.datadoghq.com/)
- AI powered by [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/)

---

<div align="center">

**⭐ Star us on GitHub — it motivates us a lot!**

Made with ♊️ by the Infamous Freight Enterprises team

[Website](https://infamousfreight.com) • [Documentation](DOCUMENTATION_INDEX.md) • [GitHub](https://github.com/MrMiless44/Infamous-freight)

</div>
