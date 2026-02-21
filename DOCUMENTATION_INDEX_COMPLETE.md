# 📚 Complete Documentation Index - Infamous Freight Enterprises

**Last Updated:** February 20, 2026  
**Status:** Living Document - Updated with each major release  
**Purpose:** Centralized navigation for all project documentation

---

## 🚀 Getting Started

### New Developers
1. **[README.md](README.md)** - Project overview, quick start, architecture
2. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development setup, workflow, style guide
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command cheat sheet, common tasks
4. **[SETUP.md](SETUP.md)** - Detailed installation instructions
5. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development environment configuration

### Project Management
- **[IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md)** - Feature tracking
- **[100-PERCENT-COMPLETION-SUMMARY.md](100-PERCENT-COMPLETION-SUMMARY.md)** - Overall project status
- **[PHASE-4-COMPLETE-FINAL.md](PHASE-4-COMPLETE-FINAL.md)** - Phase 4 completion report
- **[CHANGELOG.md](CHANGELOG-RECOMMENDED.md)** - Version history and changes

---

## 🏗️ Architecture & Design

### System Architecture
- **[ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md)** - Key architectural decisions
- **[COMPREHENSIVE-RECOMMENDATIONS-2026.md](COMPREHENSIVE-RECOMMENDATIONS-2026.md)** - Architecture recommendations
- **[ADR/](ADR/)** - Architecture Decision Records (see below)

### Data & API Design
- **[API-DOCUMENTATION-RECOMMENDED.md](API-DOCUMENTATION-RECOMMENDED.md)** - Full API reference
- **[DATABASE_MIGRATIONS.sql](DATABASE_MIGRATIONS.sql)** - Database schema changes
- **Prisma Schema:** [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

### Monorepo Structure
```
infamous-freight-enterprises/
├── apps/
│   ├── api/          # Express.js backend (CommonJS)
│   ├── web/          # Next.js frontend (TypeScript/ESM)
│   └── mobile/       # React Native/Expo app
├── packages/
│   └── shared/       # Shared types, constants, utilities
├── e2e/              # Playwright end-to-end tests
└── .github/          # CI/CD workflows
```

---

## 📚 API Documentation

### REST API
- **[API-DOCUMENTATION-RECOMMENDED.md](API-DOCUMENTATION-RECOMMENDED.md)** - Complete API reference
- **/api/health** - Health check endpoint
- **/api/docs** - Swagger/OpenAPI documentation (when server running)

### GraphQL API (Phase 4)
- **Service:** [apps/api/src/services/graphqlSubscriptions.js](apps/api/src/services/graphqlSubscriptions.js)
- **Subscriptions:** Real-time updates via WebSocket
- **Topics:** SHIPMENT_UPDATED, DRIVER_LOCATION_UPDATED, ORDER_STATUS_CHANGED

### Authentication & Authorization
- **[auth.js](apps/api/src/middleware/security.js#L69)** - JWT authentication middleware
- **[requireScope()](apps/api/src/middleware/security.js#L89)** - Scope validation
- **Scopes:** `ai:command`, `voice:ingest`, `voice:command`, `shipments:read`, `shipments:write`

### Rate Limiting
- **General:** 100 requests / 15 minutes
- **Auth:** 5 requests / 15 minutes  
- **AI:** 20 requests / 1 minute
- **Billing:** 30 requests / 15 minutes

---

## 🔧 Operations

### Daily Operations
- **[OPERATIONS-RUNBOOK-RECOMMENDED.md](OPERATIONS-RUNBOOK-RECOMMENDED.md)** - Daily checklist, procedures
- **[AUTO-OPERATIONS-GUIDE-RECOMMENDED.md](AUTO-OPERATIONS-GUIDE-RECOMMENDED.md)** - Automated operations

### Health Checks & Monitoring
- **Health Check Route:** [apps/api/src/routes/health.js](apps/api/src/routes/health.js)
- **Monitoring:** Sentry (errors), Datadog RUM (web performance)
- **Uptime:** Target >99.9%

### Incident Response
- **[INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md](INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md)** - Incident procedures
- **[INCIDENT-RESPONSE-RECOMMENDED.md](INCIDENT-RESPONSE-RECOMMENDED.md)** - Response guide
- **[DISASTER-RECOVERY-PLAN-RECOMMENDED.md](DISASTER-RECOVERY-PLAN-RECOMMENDED.md)** - Recovery procedures

### Backups & Recovery
- **[BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md](BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md)** - Backup strategy
- **Frequency:** Daily at 2 AM UTC
- **Retention:** 30 days
- **RTO:** 1 hour, RPO: 24 hours

---

## 🛡️ Security

### Security Overview
- **[SECURITY-RECOMMENDED.md](SECURITY-RECOMMENDED.md)** - Security best practices
- **[SECURITY-VULNERABILITIES-REMEDIATION-RECOMMENDED.md](SECURITY-VULNERABILITIES-REMEDIATION-RECOMMENDED.md)** - Vulnerability remediation
- **[ERROR-HANDLING-RECOMMENDED.md](ERROR-HANDLING-RECOMMENDED.md)** - Error handling patterns

### Security Procedures
- **[SECRET-EXPOSURE-SCANNING-RECOMMENDED.md](SECRET-EXPOSURE-SCANNING-RECOMMENDED.md)** - Secret scanning
- **[SECRET-ROTATION-RECOMMENDED.md](SECRET-ROTATION-RECOMMENDED.md)** - Secret rotation procedures

### OWASP Compliance
- **Implemented Controls:**
  - ✅ JWT authentication with scopes
  - ✅ Rate limiting per endpoint
  - ✅ Input validation middleware
  - ✅ SQL injection prevention (Prisma ORM)
  - ✅ XSS protection headers
  - ✅ CORS restrictions
  - ✅ Security headers (Helmet)

---

## 📊 Performance & Optimization

### Performance Monitoring
- **[PERFORMANCE-OPTIMIZATION-ROADMAP-RECOMMENDED.md](PERFORMANCE-OPTIMIZATION-ROADMAP-RECOMMENDED.md)** - Optimization strategies
- **[LOAD-TESTING-STRATEGY-RECOMMENDED.md](LOAD-TESTING-STRATEGY-RECOMMENDED.md)** - Load testing guide
- **Load Test Scripts:** [load-test-enhanced.k6.js](load-test-enhanced.k6.js)

### Observability
- **[OBSERVABILITY-RECOMMENDED.md](OBSERVABILITY-RECOMMENDED.md)** - Observability setup
- **Logging:** Winston (API), structured JSON logs
- **Error Tracking:** Sentry integration
- **Metrics:** Response times, error rates, database query performance

### Caching Strategy
- **Cache Layers:** Redis (primary), in-memory (fallback)
- **TTL:** 5 minutes for API responses
- **Invalidation:** Event-driven on data updates

---

## 🧪 Testing

### Test Coverage
- **API:** 85-90% coverage
- **Web:** Needs improvement (~40%)
- **Mobile:** Needs implementation
- **E2E:** Playwright tests in [e2e/](e2e/)

### Test Commands
```bash
# Run all tests
pnpm test

# API tests only
pnpm --filter api test

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Load tests
k6 run load-test-enhanced.k6.js
```

### Testing Guides
- **Unit Testing:** Jest configuration per app
- **Integration Testing:** Supertest for API
- **E2E Testing:** Playwright for critical flows
- **Load Testing:** k6 scripts for performance

---

## 🚢 Deployment

### Deployment Guides
- **[DEPLOYMENT-RECOMMENDED.md](DEPLOYMENT-RECOMMENDED.md)** - Deployment procedures
- **[DEPLOY-QUICK-REFERENCE-RECOMMENDED.md](DEPLOY-QUICK-REFERENCE-RECOMMENDED.md)** - Quick deploy commands
- **[MERGE-AND-DEPLOY-GUIDE-RECOMMENDED.md](MERGE-AND-DEPLOY-GUIDE-RECOMMENDED.md)** - Merge strategy

### Firebase Deployment
- **[FIREBASE-DEPLOYMENT-RECOMMENDED.md](FIREBASE-DEPLOYMENT-RECOMMENDED.md)** - Firebase setup
- **[FIREBASE-IMPLEMENTATION-RECOMMENDED.md](FIREBASE-IMPLEMENTATION-RECOMMENDED.md)** - Implementation guide
- **[FIREBASE-REFERENCE-RECOMMENDED.md](FIREBASE-REFERENCE-RECOMMENDED.md)** - Firebase reference

### Environment Configuration
- **Development:** `docker-compose.yml`
- **Staging:** `docker-compose.staging.yml`, `fly.staging.toml`
- **Production:** `docker-compose.prod.yml`, `fly.toml`, Vercel

### Deployment Scripts
- **[deploy-production.sh](deploy-production.sh)** - Production deployment
- **[deploy-blue-green.sh](deploy-blue-green.sh)** - Blue-green deployment
- **[automated-rollback.js](automated-rollback.js)** - Automated rollback

---

## 🔄 CI/CD

### GitHub Actions Workflows
- **[.github/workflows/](,github/workflows/)** - All CI/CD workflows
- **Main CI:** Build, test, lint on push
- **Security:** Dependency scanning, audit
- **Deployment:** Auto-deploy on merge to main

### Docker & Containers
- **Dockerfiles:**
  - [Dockerfile.api](Dockerfile.api) - API container
  - [Dockerfile.web](Dockerfile.web) - Web container
  - [Dockerfile.unified](Dockerfile.unified) - Multi-stage unified build
- **Docker Compose:**
  - [docker-compose.yml](docker-compose.yml) - Development
  - [docker-compose.prod.yml](docker-compose.prod.yml) - Production
  - [docker-compose.monitoring.yml](docker-compose.monitoring.yml) - Monitoring stack

### Debugging Workflows
- **[DEBUG-GITHUB-ACTIONS-RECOMMENDED.md](DEBUG-GITHUB-ACTIONS-RECOMMENDED.md)** - GitHub Actions troubleshooting

---

## 👨‍💻 Development

### Contributing
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community standards
- **Git Workflow:** Feature branches → PR → Review → Merge

### Code Style & Standards
- **Linting:** ESLint configuration per app
- **Formatting:** Prettier
- **TypeScript:** Strict mode for web/mobile, JSDoc for API
- **Commit Convention:** Conventional Commits (feat, fix, chore, docs)

### Middleware Patterns (API)
1. **Rate limiters** (e.g., `limiters.general`)
2. **authenticate** - JWT validation
3. **requireScope** - Permission check
4. **auditLog** - Request logging
5. **validators** - Input validation
6. **handleValidationErrors** - Error handling
7. **Handler function**
8. **next(err)** - Error delegation

### Error Handling
- **[ERROR-HANDLING-RECOMMENDED.md](ERROR-HANDLING-RECOMMENDED.md)** - Comprehensive error handling guide
- **Pattern:** Always use `next(err)` for error delegation
- **ApiError Class:** Standardized error responses
- **Global Handler:** [errorHandler.js](apps/api/src/middleware/errorHandler.js)

---

## 📱 Mobile App

### React Native/Expo
- **Directory:** [apps/mobile/](apps/mobile/)
- **Platform:** iOS, Android
- **State Management:** React Context + hooks
- **API Client:** Fetch with TypeScript types

### Mobile Features
- Driver management
- Shipment tracking
- Real-time notifications
- Offline support (planned)

---

## 📦 Package Management

### pnpm Workspaces
- **Version:** 8.15.9
- **Workspaces:** `apps/*`, `packages/*`, `e2e`
- **Installation:** `pnpm install` (root level)
- **Build:** `pnpm build` (all apps)

### Shared Package
- **Location:** [packages/shared/](packages/shared/)
- **Build Required:** Yes, before API startup
- **Exports:** Types, constants, utilities
- **Rebuild:** `pnpm --filter @infamous-freight/shared build`

### Dependency Management
```bash
# Add dependency to API
pnpm --filter api add express

# Add dev dependency to Web
pnpm --filter web add -D @types/node

# Update all dependencies
pnpm update --recursive
```

---

## 🔍 Troubleshooting

### Common Issues

#### "Shared types not found"
**Solution:** Rebuild shared package:
```bash
cd packages/shared
pnpm build
cd ../..
pnpm dev
```

#### "Port already in use"
**Solution:** Kill process on port:
```bash
lsof -ti:3001 | xargs kill -9  # API
lsof -ti:3000 | xargs kill -9  # Web
```

#### "Tests failing after shared update"
**Solution:** Rebuild shared + restart devs:
```bash
pnpm --filter @infamous-freight/shared build
pnpm dev
```

#### "Docker build fails"
**Solution:** Clear Docker cache:
```bash
docker system prune -a
docker-compose build --no-cache
```

---

## 📞 Support & Resources

### Internal Resources
- **Team Chat:** Slack #infamous-freight
- **Issue Tracker:** [GitHub Issues](https://github.com/MrMiless44/Infamous-freight/issues)
- **Wiki:** [GitHub Wiki](https://github.com/MrMiless44/Infamous-freight/wiki)

### External Resources
- **Node.js Docs:** https://nodejs.org/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Express.js Docs:** https://expressjs.com

### Onboarding
- **[TEAM-ONBOARDING-GUIDE-RECOMMENDED.md](TEAM-ONBOARDING-GUIDE-RECOMMENDED.md)** - New team member onboarding

---

## 📋 Checklists

### Pre-Deployment Checklist
- [ ] All tests passing (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Type check passes (`pnpm check:types`)
- [ ] Security audit clean (`pnpm audit`)
- [ ] Database migrations ready
- [ ] Environment variables updated
- [ ] Backup verified
- [ ] Rollback plan ready

### Post-Deployment Checklist
- [ ] Health check returns 200 OK
- [ ] Smoke tests pass
- [ ] Error rates normal in Sentry
- [ ] Performance metrics normal in Datadog
- [ ] No critical alerts
- [ ] Team notified of deployment

---

## 🗂️ File Structure Quick Reference

```
Key Files by Purpose:

📄 Configuration:
  - package.json (root + each app)
  - tsconfig.json (web, shared)
  - .env.example (environment template)
  - docker-compose.yml (dev environment)

🔧 API:
  - apps/api/src/server.js (entry point)
  - apps/api/src/routes/ (API endpoints)
  - apps/api/src/middleware/ (auth, validation, logging)
  - apps/api/src/services/ (business logic)
  - apps/api/prisma/schema.prisma (database schema)

🌐 Web:
  - apps/web/pages/ (Next.js pages)
  - apps/web/components/ (React components)
  - apps/web/pages/_app.tsx (app wrapper)
  - apps/web/next.config.mjs (Next.js config)

📱 Mobile:
  - apps/mobile/App.tsx (entry point)
  - apps/mobile/src/screens/ (screens)
  - apps/mobile/src/components/ (components)

📚 Shared:
  - packages/shared/src/types.ts (TypeScript types)
  - packages/shared/src/constants.ts (shared constants)
  - packages/shared/src/utils.ts (utility functions)
  - packages/shared/src/env.ts (environment validation)

🧪 Tests:
  - apps/api/__tests__/ (API tests)
  - e2e/ (end-to-end tests)
  - *.test.{js,ts,tsx} (unit tests)

🚀 CI/CD:
  - .github/workflows/ (GitHub Actions)
  - Dockerfile.* (container configs)
  - fly.toml (Fly.io deployment)
```

---

## 🎯 Quick Links by Role

### For Developers
- [CONTRIBUTING.md](CONTRIBUTING.md) - Start here
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common commands
- [ERROR-HANDLING-RECOMMENDED.md](ERROR-HANDLING-RECOMMENDED.md) - Error patterns
- [API-DOCUMENTATION-RECOMMENDED.md](API-DOCUMENTATION-RECOMMENDED.md) - API reference

### For DevOps
- [DEPLOYMENT-RECOMMENDED.md](DEPLOYMENT-RECOMMENDED.md) - Deployment guide
- [OPERATIONS-RUNBOOK-RECOMMENDED.md](OPERATIONS-RUNBOOK-RECOMMENDED.md) - Daily ops
- [INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md](INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md) - Incident response
- [BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md](BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md) - Backup procedures

### For QA/Testing
- [LOAD-TESTING-STRATEGY-RECOMMENDED.md](LOAD-TESTING-STRATEGY-RECOMMENDED.md) - Load testing
- Test coverage reports: `apps/api/coverage/index.html`
- E2E tests: [e2e/](e2e/)

### For Product/PM
- [100-PERCENT-COMPLETION-SUMMARY.md](100-PERCENT-COMPLETION-SUMMARY.md) - Project status
- [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md) - Feature tracking
- [PHASE-4-COMPLETE-FINAL.md](PHASE-4-COMPLETE-FINAL.md) - Phase 4 details

### For Security
- [SECURITY-VULNERABILITIES-REMEDIATION-RECOMMENDED.md](SECURITY-VULNERABILITIES-REMEDIATION-RECOMMENDED.md) - Vuln remediation
- [SECURITY-RECOMMENDED.md](SECURITY-RECOMMENDED.md) - Security overview
- [SECRET-ROTATION-RECOMMENDED.md](SECRET-ROTATION-RECOMMENDED.md) - Secret management

---

## 📚 Application-Specific Docs

### API Service
- **Entry Point:** [apps/api/src/server.js](apps/api/src/server.js)
- **Routes:**
  - [health.js](apps/api/src/routes/health.js) - Health checks
  - [shipments.js](apps/api/src/routes/shipments.js) - Shipment CRUD
  - [ai.commands.js](apps/api/src/routes/ai.commands.js) - AI endpoints
  - [voice.js](apps/api/src/routes/voice.js) - Voice commands
  - [billing.js](apps/api/src/routes/billing.js) - Payment processing
  - [graphql.js](apps/api/src/routes/graphql.js) - GraphQL endpoint

### Web Application
- **Entry Point:** [apps/web/pages/_app.tsx](apps/web/pages/_app.tsx)
- **Key Pages:**
  - `/` - Homepage
  - `/dashboard` - Main dashboard
  - `/shipments` - Shipment management
  - `/about` - About page
  - `/api/*` - Next.js API routes

### Mobile Application
- **Entry Point:** [apps/mobile/App.tsx](apps/mobile/App.tsx)
- **Navigation:** React Navigation
- **State:** React Context API

---

## 🆕 Recently Added (Phase 4)

### New Services (February 2026)
1. **[graphqlSubscriptions.js](apps/api/src/services/graphqlSubscriptions.js)** - Real-time GraphQL subscriptions
2. **[advancedReporting.js](apps/api/src/services/advancedReporting.js)** - Business intelligence & analytics
3. **[integrationsMarketplace.js](apps/api/src/services/integrationsMarketplace.js)** - Third-party integrations
4. **[aiPredictiveAnalytics.js](apps/api/src/services/aiPredictiveAnalytics.js)** - ML predictions
5. **[whiteLabelConfig.js](apps/api/src/services/whiteLabelConfig.js)** - Multi-tenant branding

### New Features
- GraphQL subscriptions over WebSocket
- 8 pre-configured integrations (QuickBooks, Salesforce, Stripe, FedEx, UPS, Twilio, Google Maps, Slack)
- 9 AI prediction models (demand forecast, price optimization, churn prediction, etc.)
- 10 advanced report types
- 3-tier white-label system

---

## 📅 Maintenance Schedule

### Daily
- Health checks (9 AM, 12 PM, 5 PM)
- Error rate monitoring
- Alert review

### Weekly
- Security audit review (Monday 2 AM)
- Dependency updates (Dependabot PRs)
- Performance metrics analysis

### Monthly
- Billing review (1st of month)
- Capacity planning
- Security review
- Performance optimization

### Quarterly
- Full system audit
- Disaster recovery drill
- Documentation review
- Team training updates

---

## 🔄 Document Update Policy

This index is updated:
- ✅ With each major feature release
- ✅ When new documentation is added
- ✅ Monthly during documentation review
- ✅ When file structure changes significantly

**Next Review:** March 20, 2026

---

## 📖 How to Use This Index

1. **New to the project?** Start with [Getting Started](#-getting-started)
2. **Need to fix a bug?** Check [Troubleshooting](#-troubleshooting)
3. **Deploying?** See [Deployment](#-deployment)
4. **On-call?** Reference [Operations](#-operations)
5. **Writing code?** Review [Development](#-development)

**Can't find what you need?** 
- Search this file: `Ctrl+F` / `Cmd+F`
- Check [GitHub Issues](https://github.com/MrMiless44/Infamous-freight/issues)
- Ask in Slack #infamous-freight

---

**Version:** 2.0.0  
**Status:** Living Document  
**Maintained by:** DevOps & Engineering Team  
**Feedback:** Create an issue or submit a PR
