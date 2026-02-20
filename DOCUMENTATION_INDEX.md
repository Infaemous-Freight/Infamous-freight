# 📚 Documentation Index

> **Centralized hub for all Infamous Freight Enterprises documentation**
>
> Last Updated: February 19, 2026

---

## 🚀 Getting Started

### Quick Start
- [README.md](README.md) - Project overview and setup instructions
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet and common tasks
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines and contribution workflow
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community standards and conduct
- [.env.example](.env.example) - Environment variable configuration template

### Setup & Installation
- **Prerequisites**: Node.js 20+, pnpm 8.15.9, Docker, PostgreSQL 16
- **Installation**: `pnpm install --frozen-lockfile`
- **Development**: `pnpm dev` (starts all services)
- **Testing**: `pnpm test` (runs all test suites)

---

## 🏗️ Architecture & Design

### System Architecture
- [Architecture Overview](README.md#architecture) - High-level system design
- [Monorepo Structure](README.md#monorepo-structure) - Workspace organization
- [Technology Stack](README.md#tech-stack) - Technologies and frameworks

### Database & Data Models
- [Prisma Schema](apps/api/prisma/schema.prisma) - Database schema and relations
- [DATABASE_MIGRATIONS.sql](DATABASE_MIGRATIONS.sql) - Migration scripts
- [Data Flow Diagrams](README.md#data-flow) - How data moves through the system

### Shared Package
- [packages/shared/src/types.ts](packages/shared/src/types.ts) - Shared TypeScript types
- [packages/shared/src/constants.ts](packages/shared/src/constants.ts) - Constants and enums
- [packages/shared/src/utils.ts](packages/shared/src/utils.ts) - Utility functions
- [packages/shared/src/env.ts](packages/shared/src/env.ts) - Environment validation

---

## 📡 API Documentation

### Core API
- [API Documentation](API-DOCUMENTATION-RECOMMENDED.md) - Complete API reference
- **Base URL**: `http://localhost:4000/api` (dev), `https://api.infamousfreight.com` (prod)
- **Swagger UI**: `http://localhost:4000/api/docs` - Interactive API explorer
- **Authentication**: JWT tokens with scope-based authorization

### API Endpoints

#### Health & System
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health metrics

#### Authentication (v1)
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `GET /v1/auth/me` - Get current user profile

#### Shipments (v1)
- `GET /api/shipments` - List shipments (paginated)
- `POST /api/shipments` - Create shipment
- `GET /api/shipments/:id` - Get shipment by ID
- `PATCH /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment
- `POST /api/shipments/:id/tracking` - Add tracking event

#### Shipments (v2) - Breaking Changes
- [apps/api/src/routes/v2/shipments.js](apps/api/src/routes/v2/shipments.js)
- **Changes**: Pagination (limit 50), status codes (204 for updates), error codes
- `GET /api/v2/shipments` - List with enhanced pagination
- `PATCH /api/v2/shipments/:id` - Update (returns 204 No Content)

#### Analytics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/drivers` - Driver performance
- `GET /api/analytics/satisfaction` - Customer satisfaction scores

#### AI Commands
- `POST /api/ai/commands` - Process natural language commands
- `POST /api/ai/voice` - Voice command processing

#### Webhooks
- `POST /api/webhooks` - Receive webhook events
- [Webhook Signing](apps/api/src/services/webhookSigning.js) - HMAC-SHA256 verification

### API Versioning
- **Current**: v1 (stable), v2 (breaking changes)
- **Strategy**: URL-based versioning (`/api/v2/...`)
- **Deprecation**: 6-month notice period for breaking changes

---

## 🖥️ Web Application

### Next.js Web App
- **Location**: `apps/web/`
- **Framework**: Next.js 14 with TypeScript
- **Port**: 3000 (dev), `https://web.infamousfreight.com` (prod)
- **Deployment**: Vercel

### Key Pages
- `/` - Landing page
- `/dashboard` - User dashboard
- `/shipments` - Shipment management
- `/tracking/:id` - Real-time shipment tracking

### Components
- `apps/web/components/` - Reusable React components
- `apps/web/components/legacy/` - Legacy components (non-strict TypeScript)

### TypeScript Configuration
- [apps/web/tsconfig.json](apps/web/tsconfig.json) - Strict mode enabled
- [apps/web/tsconfig.legacy.json](apps/web/tsconfig.legacy.json) - Legacy component config

---

## 📱 Mobile Application

### React Native / Expo
- **Location**: `apps/mobile/`
- **Framework**: Expo with React Native
- **Platform**: iOS and Android
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Key Features
- Real-time shipment tracking
- QR code scanning
- Offline-first architecture
- Push notifications
- Biometric authentication

---

## 🔒 Security

### Authentication & Authorization
- **Method**: JWT tokens with RS256 signing
- **Scopes**: `shipments:read`, `shipments:write`, `analytics:read`, `ai:command`, etc.
- **Middleware**: [apps/api/src/middleware/security.js](apps/api/src/middleware/security.js)

### Rate Limiting
- **General**: 100 requests / 15 minutes
- **Auth**: 5 requests / 15 minutes
- **AI**: 20 requests / 1 minute
- **Billing**: 30 requests / 15 minutes

### Security Features
- OWASP compliance checklist: [.security/owasp-compliance.md](.security/owasp-compliance.md)
- Security scanning: [.github/workflows/security.yml](.github/workflows/security.yml)
- Webhook signing: HMAC-SHA256 with 5-minute window
- Helmet.js security headers
- CORS configuration
- SQL injection prevention (Prisma)

### Secrets Management
- **Development**: `.env` file (NOT committed)
- **Production**: GitHub Secrets, Fly.io Secrets, Vercel Environment Variables

---

## 🧪 Testing

### Test Strategy
- **Unit Tests**: Jest (API), Vitest (Web)
- **Integration Tests**: Supertest with test database
- **E2E Tests**: Playwright
- **Load Tests**: k6 ([load-test.k6.js](load-test.k6.js))

### Running Tests

```bash
# All tests
pnpm test

# API tests only
pnpm --filter api test

# API integration tests
pnpm --filter api test:integration

# Web tests only
pnpm --filter web test

# E2E tests
pnpm test:e2e

# Coverage reports
pnpm test --coverage
```

### Test Files
- **API Unit**: `apps/api/__tests__/unit/`
- **API Integration**: [apps/api/__tests__/integration/api-integration.test.js](apps/api/__tests__/integration/api-integration.test.js)
- **Web**: `apps/web/tests/`
- **E2E**: `e2e/`

### Coverage Thresholds
- **API**: Lines 75%, Functions 80%, Branches 70%, Statements 75%
- **Web**: Lines 70%, Functions 75%, Branches 65%, Statements 70%

---

## 🚢 Deployment & Operations

### Deployment Pipeline
- **Workflow**: [.github/workflows/deploy-unified.yml](.github/workflows/deploy-unified.yml)
- **Staging**: Auto-deploy on `develop` branch
- **Production**: Auto-deploy on `main` branch

### Deployment Process
1. **Test** - Run all tests, linting, type checking
2. **Build** - Build Docker images (API, Web, Worker)
3. **Deploy Staging** - Deploy to staging environment
4. **Deploy Production** - Deploy to production after approval
5. **Post-Deployment** - Health checks and monitoring

### Rollback Strategy
- **Script**: [scripts/rollback.sh](scripts/rollback.sh)
- **Usage**: `./scripts/rollback.sh production [version]`
- **Process**: Automated rollback to previous version with health checks

### Infrastructure
- **API**: Fly.io (multi-region: SJC, IAD, LHR)
- **Web**: Vercel (edge network)
- **Database**: PostgreSQL 16 on Fly.io
- **Cache**: Redis on Fly.io
- **Storage**: AWS S3 / Cloudflare R2
- **CDN**: Cloudflare

### Monitoring & Observability
- **Error Tracking**: Sentry
- **Logs**: Winston + Fly.io logs
- **Metrics**: Prometheus + Grafana
- **APM**: Datadog
- **Uptime**: UptimeRobot

### Operations Runbooks
- [OPERATIONS-RUNBOOK-RECOMMENDED.md](OPERATIONS-RUNBOOK-RECOMMENDED.md)
- [INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md](INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md)
- [BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md](BACKUP-AND-RECOVERY-PROCEDURES-RECOMMENDED.md)
- [DISASTER-RECOVERY-PLAN-RECOMMENDED.md](DISASTER-RECOVERY-PLAN-RECOMMENDED.md)

---

## 🛠️ Development Workflow

### Code Quality

#### Linting & Formatting
```bash
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm check:types   # TypeScript type checking
```

#### Error Handling Rules
- **Config**: [.eslintrc-error-handling.js](.eslintrc-error-handling.js)
- **Plugin**: [plugins/eslint-plugin-infamous-freight-error-handling/](plugins/eslint-plugin-infamous-freight-error-handling/)
- **Rules**: Enforce try/catch with next(err), no direct error responses

#### Git Hooks
- **Pre-commit**: Lint staged files
- **Commit message**: Conventional commits via commitlint

### Docker

#### Unified Dockerfile
- **File**: [Dockerfile.unified](Dockerfile.unified)
- **Targets**: `deps`, `builder`, `api`, `web`, `worker`, `development`

```bash
# Build API
docker build --target api -t infamous-freight-api .

# Build Web
docker build --target web -t infamous-freight-web .

# Build Worker
docker build --target worker -t infamous-freight-worker .

# Development
docker build --target development -t infamous-freight-dev .
```

#### Docker Compose
- **Development**: [docker-compose.yml](docker-compose.yml)
- **Production**: [docker-compose.prod.yml](docker-compose.prod.yml)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Middleware Stack
1. Correlation ID generation
2. Performance monitoring
3. Body logging
4. Metrics collection
5. Smart caching
6. Cache invalidation
7. Compression
8. HTTP request logging
9. Rate limiting
10. API versioning
11. JWT authentication
12. Audit logging
13. Idempotency
14. Batch loaders
15. Routes
16. Error handling

---

## 📊 Performance Optimization

### Performance Guides
- [PERFORMANCE-OPTIMIZATION-ROADMAP-RECOMMENDED.md](PERFORMANCE-OPTIMIZATION-ROADMAP-RECOMMENDED.md)
- [LOAD-TESTING-STRATEGY-RECOMMENDED.md](LOAD-TESTING-STRATEGY-RECOMMENDED.md)

### Caching Strategy
- **Middleware**: [apps/api/src/middleware/smartCacheMiddleware.js](apps/api/src/middleware/smartCacheMiddleware.js)
- **TTL**: 5 minutes default, custom per-route
- **Invalidation**: Event-based (shipment.updated → clear cache)
- **Headers**: `X-Cache-Status` (HIT/MISS)

### Database Optimization
- **Query Monitoring**: [apps/api/src/services/queryMonitor.js](apps/api/src/services/queryMonitor.js)
- **Slow Query Threshold**: 1000ms
- **Batch Loading**: DataLoader for N+1 prevention

### Bundle Optimization
- **Next.js**: Code splitting, dynamic imports
- **Bundle Analysis**: `ANALYZE=true pnpm build` (Web)
- **Targets**: First Load JS < 150KB, Total < 500KB

---

## 🔧 Configuration

### Environment Variables
- [.env.example](.env.example) - Template with all variables
- **Validation**: [packages/shared/src/env.ts](packages/shared/src/env.ts)
- **Loading**: [apps/api/src/config/loadenv.js](apps/api/src/config/loadenv.js)

### Key Variables
- `NODE_ENV`: `development`, `staging`, `production`, `test`
- `API_PORT`: API server port (default: 4000)
- `WEB_PORT`: Web server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `SENTRY_DSN`: Error tracking DSN
- `AI_PROVIDER`: `openai`, `anthropic`, `synthetic`

---

## 🤖 AI Features

### AI Commands
- **Endpoint**: `POST /api/ai/commands`
- **Provider**: OpenAI GPT-4 / Anthropic Claude / Synthetic (fallback)
- **Service**: [apps/api/src/services/aiSyntheticClient.js](apps/api/src/services/aiSyntheticClient.js)

### Voice Commands
- **Endpoint**: `POST /api/voice`
- **Max File Size**: 10MB (configurable via `VOICE_MAX_FILE_SIZE_MB`)
- **Formats**: MP3, WAV, M4A, OGG

---

## 📦 Dependencies

### Package Management
- **Manager**: pnpm 8.15.9
- **Workspaces**: apps/api, apps/web, apps/mobile, packages/shared, e2e
- **Lock File**: pnpm-lock.yaml (committed)

### Updating Dependencies
```bash
# Check outdated
pnpm outdated

# Update all (patch/minor)
pnpm update

# Update specific package
pnpm update <package-name>

# Update Prisma
cd apps/api && pnpm prisma:generate
```

---

## 📝 Changelog & Releases

### Version History
- [CHANGELOG-RECOMMENDED.md](CHANGELOG-RECOMMENDED.md) - Release notes and version history
- [COMPLETION-CERTIFICATE-RECOMMENDED.md](COMPLETION-CERTIFICATE-RECOMMENDED.md) - Project milestones

### Release Process
1. Update CHANGELOG.md
2. Create Git tag: `git tag v1.0.0`
3. Push: `git push --tags`
4. GitHub Actions creates release
5. Deploy to production

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (Web)
lsof -ti:3000 | xargs kill -9
```

#### Prisma Issues
```bash
# Regenerate client
cd apps/api && pnpm prisma:generate

# Reset database (CAUTION: deletes data)
cd apps/api && pnpm prisma:migrate:reset

# Run migrations
cd apps/api && pnpm prisma:migrate:dev
```

#### Shared Package Not Found
```bash
# Rebuild shared package
pnpm --filter @infamous-freight/shared build

# Restart services
pnpm dev
```

#### Docker Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug pnpm dev

# API debug
DEBUG=* pnpm api:dev

# Web debug
DEBUG=* pnpm web:dev
```

---

## 📞 Support & Community

### Getting Help
- **GitHub Issues**: Report bugs and feature requests
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: support@infamousfreight.com

### Contributing
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Submit pull requests to `develop` branch

### Team
- See [AUTHORS](AUTHORS) for contributor list
- See [OWNERS](OWNERS) for project maintainers

---

## 📚 Additional Resources

### External Documentation
- [Express.js Guide](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Fly.io Documentation](https://fly.io/docs/)
- [Vercel Documentation](https://vercel.com/docs)

### Recommendations & Future Work
- [COMPREHENSIVE-RECOMMENDATIONS-2026.md](COMPREHENSIVE-RECOMMENDATIONS-2026.md)
- [PRIORITY-3-EXECUTION-GUIDE-RECOMMENDED.md](PRIORITY-3-EXECUTION-GUIDE-RECOMMENDED.md)

---

## 📄 License

This project is licensed under the terms specified in [LICENSE](LICENSE).

Copyright information can be found in [COPYRIGHT](COPYRIGHT).

---

**Last Updated:** February 19, 2026  
**Version:** 2.0.0  
**Maintained by:** Infamous Freight Enterprises Team
