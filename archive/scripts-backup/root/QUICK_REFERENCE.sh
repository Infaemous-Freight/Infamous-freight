#!/bin/bash
# INFAMOUS FREIGHT - QUICK START REFERENCE
# Copy this card and pin to your monitor for easy reference

cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════════╗
║                  INFAMOUS FREIGHT - QUICK REFERENCE                     ║
║                    100% PRODUCTION EXCELLENCE                           ║
╚══════════════════════════════════════════════════════════════════════════╝

🚀 GETTING STARTED
═══════════════════════════════════════════════════════════════════════════

Fresh Setup:
  git clone https://github.com/MrMiless44/Infamous-freight.git
  cd Infamous-freight-enterprises
  pnpm install
  cp .env.example .env.local
  pnpm dev

Setup Pre-Commit Hooks (REQUIRED):
  bash setup-husky.sh

Read First:
  # In this order:
  1. CONTRIBUTING.md (15 min) - Dev setup & workflow
  2. PRODUCTION_EXCELLENCE_INDEX.md (15 min) - Docs overview
  3. PRODUCTION_READINESS_REPORT.md (30 min) - Architecture

═══════════════════════════════════════════════════════════════════════════

📋 DAILY COMMANDS
═══════════════════════════════════════════════════════════════════════════

Development:
  pnpm dev              # Start all services (API, Web, Mobile)
  pnpm api:dev          # Start API only
  pnpm web:dev          # Start Web only

Testing:
  pnpm test             # Run all tests
  pnpm test:api         # API tests only
  pnpm test:web         # Web tests only
  pnpm test:coverage    # Generate coverage report
  pnpm test:contract    # Contract tests with Pact

Quality:
  pnpm lint             # Check linting
  pnpm format           # Auto-format code
  pnpm check:types      # TypeScript check
  pnpm lint --fix       # Fix all fixable issues

Build & Deploy:
  pnpm build            # Build all apps
  pnpm start            # Start production build
  bash deploy-phase-iv-complete.sh  # Verify Phase IV

═══════════════════════════════════════════════════════════════════════════

🔐 AUTHENTICATION & SCOPES
═══════════════════════════════════════════════════════════════════════════

Getting JWT Token (Development):
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'

Common Scopes (use in requireScope middleware):
  SCOPE_CATEGORIES.SHIPMENT.READ     → Read shipments
  SCOPE_CATEGORIES.SHIPMENT.CREATE   → Create shipments
  SCOPE_CATEGORIES.BILLING.CHARGE    → Charge customers
  SCOPE_CATEGORIES.ADMIN.READ        → Admin read
  SCOPE_CATEGORIES.ADMIN.WRITE       → Admin write

Scope Validation:
  import { validateScope, hasScope } from '@infamous-freight/shared';
  
  if (!hasScope(user.scopes, 'shipment:read')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

═══════════════════════════════════════════════════════════════════════════

🐛 DEBUGGING PRODUCTION ISSUES
═══════════════════════════════════════════════════════════════════════════

Find Issues:
  Look for "Correlation ID" in error message
  Search Datadog: @trace_id:{{correlationId}}
  Search Sentry: Filter by correlation ID in breadcrumbs

Common Scenarios (see INCIDENT_RESPONSE.md for full guide):
  • API slow → OBSERVABILITY.md "Debugging Slow Queries"
  • 5xx errors → Search error message in Sentry
  • Memory leak → Check Datadog metrics for memory trend
  • Pool exhausted → Increase DATABASE_POOL_SIZE env var
  • Rate limited → Check @rate_limit metrics in Datadog

Real-Time Logs:
  API logs:
    kubectl logs -f deployment/api -n infamous
  
  Search logs:
    Datadog: @correlationId:{{id}}
    Sentry: Search error message

═══════════════════════════════════════════════════════════════════════════

✅ CODE REVIEW CHECKLIST
═══════════════════════════════════════════════════════════════════════════

Before Committing:
  □ No console.log() (use logger instead)
  □ No direct imports from @infamous-freight/shared/src
  □ Error handling with next(err) in routes
  □ API responses use ApiResponse wrapper
  □ Sensitive data redacted in logs
  □ Type checking passes: pnpm check:types
  □ Linting passes: pnpm lint
  □ Tests pass: pnpm test

In Pull Request:
  □ Tests added for new code
  □ Coverage maintained ≥ 90%
  □ Related documentation updated
  □ No breaking API changes
  □ At least 2 approvals

Deployment:
  □ All tests passing
  □ Lighthouse score > 90
  □ No new security issues
  □ Database migration tested
  □ Rollback procedure documented

═══════════════════════════════════════════════════════════════════════════

📞 WHEN PRODUCTION IS DOWN
═══════════════════════════════════════════════════════════════════════════

1. Stay calm. We have procedures.

2. Declare incident in Slack #incidents:
   "🚨 INCIDENT DECLARED - P2 - API returning 5xx
    Details: Shipments endpoint failing
    On-call investigating now @on-call"

3. Start war room call
   Link: https://meet.infamous-freight.com/incidents

4. Use INCIDENT_RESPONSE.md to investigate:
   • Check /api/health
   • View pod logs
   • Check Datadog dashboard
   • Search Sentry for errors

5. For common issues, see INCIDENT_RESPONSE.md:
   • API service down (5 min fix)
   • Memory leak (15 min fix)
   • Database pool exhausted (5 min fix)
   • Duplicate operations (check idempotency)
   • Slow queries (add index or cache)

6. Post status every 15 min to #incidents thread
   "Still investigating. Found 5xx in shipments service.
    Checking database connectivity. ETA fix: 20min"

═══════════════════════════════════════════════════════════════════════════

📊 PERFORMANCE TARGETS
═══════════════════════════════════════════════════════════════════════════

Web App (Lighthouse):
  ✅ First Contentful Paint: < 2.5s
  ✅ Largest Contentful Paint: < 2.5s
  ✅ Cumulative Layout Shift: < 0.1
  ✅ Performance Score: ≥ 90
  ✅ Accessibility Score: ≥ 95

API:
  ✅ P95 Response Time: < 500ms
  ✅ P99 Response Time: < 1s
  ✅ Database Query P99: < 200ms
  ✅ Error Rate: < 1%
  ✅ Uptime: ≥ 99.9%

If targets missed:
  1. Check OBSERVABILITY.md for your metric
  2. Identify bottleneck (database, cache, code)
  3. Optimize and deploy
  4. Monitor for 24 hours

═══════════════════════════════════════════════════════════════════════════

🔑 IMPORTANT ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════════════════

Development (.env.local):
  NODE_ENV=development
  API_PORT=4000
  DB_URL=postgresql://user:pass@localhost:5432/infamous_dev
  REDIS_URL=redis://localhost:6379
  JWT_SECRET=local-dev-secret
  DATADOG_ENABLED=false

Production (set in CI/CD secrets):
  NODE_ENV=production
  API_PORT=4000
  DB_URL=postgresql://...infraaustructure...
  REDIS_URL=redis://infrastructure...
  JWT_SECRET=<rotate-quarterly>
  SENTRY_DSN=https://...
  DATADOG_ENABLED=true
  DD_SERVICE=infamous-api
  DD_TRACE_ENABLED=true

Never commit:
  .env (use .env.example)
  Private keys
  API keys
  Database passwords
  JWT secrets

═══════════════════════════════════════════════════════════════════════════

📚 READING ORDER FOR DIFFERENT ROLES
═══════════════════════════════════════════════════════════════════════════

Backend Developer:
  1. CONTRIBUTING.md - Setup
  2. ERROR_HANDLING.md - Patterns
  3. INCIDENT_RESPONSE.md - Common issues
  4. PRODUCTION_READINESS_REPORT.md - Architecture

Frontend Developer:
  1. CONTRIBUTING.md - Setup
  2. DATADOG_RUM_INTEGRATION.md - Monitoring
  3. PRODUCTION_READINESS_REPORT.md - App architecture
  4. ERROR_HANDLING.md - Error patterns

DevOps / SRE:
  1. DEPLOYMENT.md - Deployment procedures
  2. OBSERVABILITY.md - Monitoring & debugging
  3. INCIDENT_RESPONSE.md - Incident procedures
  4. SECRET_ROTATION.md - Secret management

On-Call Engineer:
  1. INCIDENT_RESPONSE.md - Procedures
  2. OBSERVABILITY.md - Debugging commands
  3. DEPLOYMENT.md - Rollback procedures
  4. Bookmark Datadog dashboard

New Team Member:
  1. PRODUCTION_EXCELLENCE_INDEX.md - Overview (30 min)
  2. CONTRIBUTING.md - Setup (1 hour)
  3. README.md - Architecture
  4. Start pair programming with team

═══════════════════════════════════════════════════════════════════════════

🎯 TOP 5 CRITICAL REMINDERS
═══════════════════════════════════════════════════════════════════════════

1️⃣  NEVER import from @infamous-freight/shared/src
    ALWAYS import from @infamous-freight/shared (barrel export)
    ❌ from '@infamous-freight/shared/src/types'
    ✅ from '@infamous-freight/shared'

2️⃣  ALWAYS handle errors with next(err) in Express routes
    ❌ return res.status(500).json({ error })
    ✅ next(new ApiError('message', 500))

3️⃣  ALWAYS use logger instead of console.log()
    ❌ console.log('Debug info', data)
    ✅ logger.info('Debug info', { correlationId: req.correlationId, data })

4️⃣  ALWAYS run pnpm test before committing
    Pre-commit hooks will catch issues, but better to know first
    pnpm test  # Run locally first

5️⃣  NEVER commit secrets
    .env files are gitignored
    Use .env.example for template
    Pre-commit hooks will block credential commits

═══════════════════════════════════════════════════════════════════════════

❓ STILL HAVE QUESTIONS?
═══════════════════════════════════════════════════════════════════════════

Check in order:
  1. PRODUCTION_EXCELLENCE_INDEX.md (navigation hub)
  2. Slack #backend, #frontend, #devops
  3. GitHub Issues / Documentation
  4. Ask in team meeting

Contact on-call:
  🚨 Production issue? Page @on-call immediately
  Type in Slack: @on-call or use PagerDuty

═══════════════════════════════════════════════════════════════════════════

Version 1.0 | Last Updated: February 14, 2026 | Status: ✅ Production Ready

╔══════════════════════════════════════════════════════════════════════════╗
║  Welcome to Infamous Freight! You're part of a world-class team now.    ║
║              Let's ship some amazing features together! 🚀             ║
╚══════════════════════════════════════════════════════════════════════════╝

EOF
