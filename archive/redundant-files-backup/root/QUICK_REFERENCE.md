# Quick Reference Guide - Updated Systems

## 🔧 Developers: Quick Start Commands

### First Time Setup

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm build:shared

# Setup database
cd api && pnpm prisma:migrate:dev --name init
pnpm prisma:seed

# Run tests
pnpm test

# Start development
pnpm dev
```

### API Route Development (Middleware Order)

**Always use this chain for new protected routes:**

```javascript
router.post(
  "/api/feature",
  limiters.general, // 1. Rate limiting
  authenticate, // 2. JWT auth
  requireScope("feature:write"), // 3. Scope check
  auditLog, // 4. Audit logging
  validateString("field"), // 5. Input validation
  handleValidationErrors, // 6. Error handling
  async (req, res, next) => {
    // 7. Handler
    try {
      // your logic
      next(err); // 8. Error passing
    } catch (err) {
      next(err);
    }
  },
);
```

### Database Operations

```bash
# View data in UI
cd api && pnpm prisma:studio

# Create a new migration
cd api && pnpm prisma:migrate:dev --name <description>

# Reset database (development only)
cd api && npx prisma migrate reset --force

# Seed test data
cd api && pnpm prisma:seed
```

### Testing

```bash
# Run all tests with coverage
pnpm test

# Run tests in watch mode
cd api && pnpm test:watch

# Check coverage report
open api/coverage/index.html

# Run specific test file
cd api && pnpm test -- security.test.js
```

### Web Bundling

```bash
# Build with analysis
cd web && ANALYZE=true pnpm build

# Or from root
pnpm --filter web build:analyze
```

## 📋 File Reference

### New Test Files

- `api/src/routes/__tests__/security.test.js` - Auth & rate limit tests
- `api/src/routes/__tests__/validation.test.js` - Input validation tests

### Updated Core Files

- `api/src/routes/ai.commands.js` - Middleware order fix
- `api/src/routes/billing.js` - Middleware order fix
- `api/src/routes/voice.js` - Middleware order + validation
- `.github/workflows/ci.yml` - Matrix testing across packages
- `api/prisma/schema.prisma` - Enhanced with indexes & constraints
- `web/next.config.mjs` - Improved code splitting
- `web/components/RevenueMonitorDashboard.tsx` - Dynamic imports
- `web/package.json` - Added build:analyze script

### New Documentation

- `PRISMA_SETUP.md` - Database migration guide
- `100_PERCENT_IMPLEMENTATION_COMPLETE.md` - Full completion report

## 🛡️ Security Checklist

When adding new API endpoints:

- [ ] Use appropriate rate limiter (general/auth/ai/billing/voice)
- [ ] Add authentication if user-specific
- [ ] Add requireScope() for permission control
- [ ] Include auditLog middleware
- [ ] Add input validation
- [ ] Handle errors with next(err)
- [ ] Add tests for auth & scope
- [ ] Document required scopes in comments

## 📊 Performance Targets Met

| Metric        | Target | Status |
| ------------- | ------ | ------ |
| First Load JS | <150KB | ✅     |
| Total Bundle  | <500KB | ✅     |
| API Response  | <500ms | ✅     |
| Coverage      | >80%   | ✅     |

## 🔍 Troubleshooting

### Tests Failing?

```bash
cd api && AUTH_SECRET=test-secret pnpm test
```

### Database Error?

```bash
# Reset and reseed
cd api
npx prisma migrate reset --force
pnpm prisma:seed
```

### Middleware issues?

Check `.instructions.md` in api routes - all routes should follow the standard
chain.

### Bundle too large?

```bash
cd web && ANALYZE=true pnpm build
# Look at .next/static and check which packages are too large
# Consider lazy-loading with dynamic()
```

## 📚 Important URLs

- **Prisma Studio**: http://localhost:5555
- **API Health**: http://localhost:4000/api/health
- **API Health (detailed)**: http://localhost:4000/api/health/detailed
- **Swagger Docs**: http://localhost:4000/api/docs

## 🚀 CI/CD Pipeline

The updated `ci.yml` now:

1. Lints all packages (shared/api/web/e2e)
2. Type-checks all packages
3. Tests api with coverage reports
4. Validates Prisma schema
5. Builds all packages to completion

Runs on every push to main and PR.

## 💡 Pro Tips

1. Always rebuild shared after schema/type changes:

   ```bash
   pnpm build:shared
   ```

2. Use Prisma Studio for data verification:

   ```bash
   cd api && pnpm prisma:studio
   ```

3. Check rate limites in security.js comments for limits

4. Test full auth chain locally:

   ```bash
   curl -H "Authorization: Bearer <your_jwt>" http://localhost:4000/api/protected
   ```

5. Use descriptive migration names:

   ```bash
   # Good
   pnpm prisma:migrate:dev --name add_shipment_status_index

   # Not helpful
   pnpm prisma:migrate:dev --name fix
   ```
