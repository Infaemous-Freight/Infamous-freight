---
description: GitHub Copilot - Full Project Configuration
---

# Infæmous Freight Enterprises - GitHub Copilot Configuration

## 🚀 Agent Skills (100% Enabled)

All domain-specific skills are now fully enabled and available via slash commands in chat.

### Available Skills

| Skill | Use Case | Slash Command |
|-------|----------|---------------|
| **API Backend** | Express routes, middleware, CRUD operations | `/api-backend` |
| **Web Frontend** | Next.js pages, components, SSR, analytics | `/web-frontend` |
| **Shared Package** | Types, constants, utilities, builds | `/shared-package` |
| **E2E Testing** | Playwright tests, test automation | `/e2e-testing` |
| **Database/Prisma** | Schema design, migrations, queries | `/database-prisma` |
| **Security/Auth** | JWT, scopes, rate limits, CORS | `/security-auth` |
| **DevOps/Docker** | Containers, orchestration, deployment | `/devops-docker` |
| **Performance** | Bundling, caching, metrics optimization | `/performance-optimization` |
| **Mobile** | React Native, Expo, iOS/Android | `/mobile-development` |

## 🏗️ Architecture Context

**Monorepo Structure** (pnpm workspaces 8.15.9):
- `apps/api/` - Express.js (CommonJS) → port 3001/4000
- `apps/web/` - Next.js 14 (TypeScript/ESM) → port 3000
- `apps/mobile/` - React Native/Expo (TypeScript)
- `packages/shared/` - Domain types, constants, utilities
- `e2e/` - Playwright end-to-end tests

**Data Flow**:
```
Web/Mobile --REST + JWT--> API <--Prisma--> PostgreSQL
                            ↓
                  @infamous-freight/shared
```

## 🔑 Key Rules (Always Follow)

### Shared Package (CRITICAL)
✅ Import everything from `@infamous-freight/shared`
❌ Never redefine types/constants
🔄 After editing shared: `pnpm --filter @infamous-freight/shared build` then restart

### API Development
- **Language**: CommonJS (`require()`)
- **Route Pattern**: `limiters → authenticate → requireScope → auditLog → validators → handleValidationErrors → handler → next(err)`
- **Rate Limits**: general 100/15m, auth 5/15m, ai 20/1m, billing 30/15m
- **Error Handling**: Always use `next(err)` to delegate to global errorHandler

### Web Development
- **Language**: ESM TypeScript (`import`)
- **Analytics**: Vercel Analytics (auto-enabled) + Datadog RUM (production)
- **API Calls**: Use `process.env.API_BASE_URL`
- **Performance**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Database
- **Schema**: `apps/api/prisma/schema.prisma`
- **Workflow**: Edit schema → `pnpm prisma:migrate:dev --name <desc>` → build shared → restart
- **Queries**: No N+1 queries; use `include()` for relations

## 📋 Common Commands

```bash
# Development
pnpm dev                          # Start all services
pnpm api:dev                      # API only (Docker)
pnpm web:dev                      # Web only

# Building
pnpm build                        # Build all
pnpm --filter @infamous-freight/shared build  # Build shared package

# Testing
pnpm test                         # All tests
pnpm --filter api test            # API tests only (coverage ~75-84%)
pnpm e2e                          # E2E tests

# Code Quality
pnpm lint                         # Lint all
pnpm format                       # Format all
pnpm check:types                  # Type check all

# Database
cd apps/api
pnpm prisma:migrate:dev --name <name>
pnpm prisma:studio               # View database UI
pnpm prisma:generate             # Regenerate types

# Deployment
docker-compose up -d              # Local with Docker
vercel deploy                     # Deploy Web (Vercel)
fly deploy -c fly.api.toml        # Deploy API (Fly.io)
```

## 🧪 Testing Requirements

- **API**: Coverage thresholds ~75–84% (enforced in CI)
- **E2E**: Playwright on Chromium, Firefox, WebKit
- **Web**: Lighthouse scores > 90 for Performance, Accessibility, Best Practices, SEO

## 🔐 Security Checklist

- ✅ All protected routes use `authenticate` middleware
- ✅ Sensitive operations require `requireScope()`
- ✅ Rate limits applied per endpoint
- ✅ CORS origins configured via `CORS_ORIGINS` env
- ✅ Input validation + `handleValidationErrors`
- ✅ JWT secret in `.env` (not hardcoded)
- ✅ Errors logged to Sentry
- ✅ Audit logging on sensitive operations

## 📊 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| First Load JS | < 150KB | Lighthouse |
| Total Bundle | < 500KB | Bundle Analyzer |
| LCP | < 2.5s | Web Vitals |
| FID | < 100ms | Datadog RUM |
| CLS | < 0.1 | Web Vitals |
| API Response (p95) | < 1s | APM |

## 🚀 Deployment Platforms

- **Web**: Vercel (auto-deploy from `main`)
- **API**: Fly.io (multi-region) or Docker Compose
- **Database**: PostgreSQL 15 (managed or containerized)
- **Backup**: Firebase Hosting (optional)

## 📚 Documentation

- [README.md](../../README.md) - Project overview
- [QUICK_REFERENCE.md](../../QUICK_REFERENCE.md) - Command cheat sheet
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development guidelines
- [Copilot Instructions](./copilot-instructions.md) - Detailed architecture

## 💡 Next Steps

1. **Type a slash command** (`/`) in chat to see all skills
2. **Pick a skill** that matches your task
3. **Follow the pattern** documented in the skill
4. **Run the examples** with your specific needs
5. **Check test coverage** and performance metrics

---

**Questions?**
- Check the copilot-instructions.md for deep-dive architecture
- Look at examples in `apps/api/src/routes/ai.commands.js` (best practices)
- Review tests in `apps/api/tests/` for patterns
- Run `pnpm --help` for workspace commands
