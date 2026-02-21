# 🌍 Environment Parity Matrix

**Last Updated:** February 21, 2026  
**Purpose:** Document differences between development, staging, and production environments

---

## 📊 Environment Comparison

### Infrastructure

| Component | Development | Staging | Production |
|-----------|-------------|---------|------------|
| **API Host** | localhost:4000 | staging-api.fly.dev | api.infamousfreight.com |
| **Web Host** | localhost:3000 | staging.vercel.app | infamousfreight.com |
| **Database** | Local PostgreSQL | Fly.io Postgres (1GB) | Fly.io Postgres (4GB, HA) |
| **Redis** | Local/Docker | Upstash Redis (Free) | Upstash Redis (Pro) |
| **Region** | Single | US-East (IAD) | Multi (SJC, IAD, LHR) |
| **Replicas** | 1 | 1 | 3 (one per region) |
| **Auto-scaling** | No | No | Yes (2-10 instances) |

---

## 🔒 Environment Variables

### Common Variables (All Environments)

| Variable | Dev | Staging | Production | Notes |
|----------|-----|---------|------------|-------|
| `NODE_ENV` | development | staging | production | |
| `LOG_LEVEL` | debug | info | error | |
| `API_PORT` | 4000 | 3001 | 3001 | |
| `WEB_PORT` | 3000 | 3000 | 3000 | |
| `JWT_EXPIRES_IN` | 24h | 12h | 1h | Shorter in prod |
| `RATE_LIMIT_GENERAL_MAX` | 1000 | 100 | 100 | Looser in dev |
| `RATE_LIMIT_AUTH_MAX` | 50 | 5 | 5 | |
| `RATE_LIMIT_AI_MAX` | 200 | 20 | 20 | |

### Database Configuration

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `DATABASE_URL` | postgres://localhost:5432/infamous | postgres://[staging-host] | postgres://[prod-host] |
| `DB_POOL_MIN` | 2 | 5 | 10 |
| `DB_POOL_MAX` | 10 | 20 | 50 |
| `DB_CONNECTION_TIMEOUT` | 5000 | 3000 | 2000 |

### External Services

| Service | Dev | Staging | Production |
|---------|-----|---------|------------|
| **Stripe** | Test keys | Test keys | Live keys ⚠️ |
| **OpenAI** | N/A (synthetic) | Test key | Production key |
| **Anthropic** | N/A (synthetic) | Test key | Production key |
| **Sentry** | Disabled | Enabled | Enabled |
| **Datadog** | Disabled | Sample 10% | Sample 100% |
| **Slack Webhooks** | Disabled | #staging-alerts | #production-alerts |

### Security & Auth

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `JWT_*` | [dev-placeholder] | [secure-random] | [secure-random] |
| `ENCRYPTION_KEY` | [dev-placeholder] | [secure-32-chars] | [secure-32-chars] |
| `CORS_ORIGINS` | http://localhost:3000 | https://staging.vercel.app | https://infamousfreight.com |
| `SECURE_COOKIES` | false | true | true |
| `HSTS_ENABLED` | false | true | true |

### Feature Flags

| Feature | Dev | Staging | Production |
|---------|-----|---------|------------|
| `FEATURE_GET_TRUCKN` | true | true | false ⚠️ |
| `FEATURE_AI_COMMANDS` | true | true | true |
| `FEATURE_VOICE_COMMANDS` | true | true | true |
| `MARKETPLACE_ENABLED` | true | true | false ⚠️ |
| `GRAPHQL_PLAYGROUND` | true | true | false |
| `BULLBOARD_ENABLED` | true | true | false |

---

## 📦 Data & Seeds

### Database Seeds

| Data Type | Dev | Staging | Production |
|-----------|-----|---------|------------|
| **Test Users** | 50 users | 10 users | 0 (real users) |
| **Test Shipments** | 500 shipments | 50 shipments | 0 (real data) |
| **Test Drivers** | 25 drivers | 5 drivers | 0 (real drivers) |
| **Payment Methods** | Mock/Test | Mock/Test | Real |
| **Geocoding** | Mock data | Real API | Real API |

### Seed Commands

```bash
# Development
cd apps/api
pnpm prisma:seed:dev

# Staging
pnpm prisma:seed:staging

# Production
# ⚠️ NEVER seed production - real data only
```

---

## 🚀 Deployment Configuration

### CI/CD Pipeline

| Stage | Dev | Staging | Production |
|-------|-----|---------|------------|
| **Trigger** | Push to main | Push to main | Manual approval |
| **Tests** | All tests | All tests | All tests + smoke |
| **Build Time** | ~3 min | ~5 min | ~8 min (multi-region) |
| **Deployment** | N/A | Auto (Fly + Vercel) | Manual approval |
| **Rollback** | N/A | Auto on failure | Manual |
| **Health Checks** | Basic | Full | Full + synthetic |

### Docker Configuration

```yaml
# docker-compose.yml (development)
services:
  api:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./apps/api:/app
    ports:
      - "4000:4000"

# fly.toml (staging)
[env]
  NODE_ENV = "staging"
  LOG_LEVEL = "info"

[[services]]
  internal_port = 3001
  protocol = "tcp"

# fly.toml (production)
[env]
  NODE_ENV = "production"
  LOG_LEVEL = "error"

[[services]]
  internal_port = 3001
  protocol = "tcp"
  
[deploy]
  strategy = "rolling"
  max_unavailable = 0.33
```

---

## 🔍 Monitoring & Observability

### Logging

| Aspect | Dev | Staging | Production |
|--------|-----|---------|------------|
| **Level** | debug | info | error |
| **Destination** | Console | Console + File | Sentry + Datadog |
| **Retention** | None | 7 days | 90 days |
| **Sampling** | 100% | 10% | 1% (error: 100%) |

### Metrics

| Metric | Dev | Staging | Production |
|--------|-----|---------|------------|
| **APM** | No | Datadog (sample) | Datadog (full) |
| **Error Tracking** | Console | Sentry | Sentry |
| **Uptime Monitoring** | No | Fly.io checks | Fly.io + Pingdom |
| **Performance** | No | Basic | Full (RUM, APM) |

### Alerts

| Alert | Dev | Staging | Production |
|-------|-----|---------|------------|
| **Error Rate > 5%** | No | Slack | PagerDuty + Slack |
| **Response Time > 1s** | No | Slack | PagerDuty + Slack |
| **CPU > 80%** | No | Email | PagerDuty |
| **Memory > 90%** | No | Email | PagerDuty |
| **Disk > 85%** | No | Email | PagerDuty |

---

## 🧪 Testing Strategy

### Test Execution

| Test Type | Dev | Staging | Production |
|-----------|-----|---------|------------|
| **Unit Tests** | On commit | CI/CD | CI/CD |
| **Integration Tests** | Manual | CI/CD | CI/CD |
| **E2E Tests** | Manual | CI/CD | Smoke tests |
| **Load Tests** | Manual | Weekly | Before deploy |
| **Security Scans** | Manual | CI/CD | CI/CD + quarterly |

---

## 🔐 Security Configuration

### SSL/TLS

| Aspect | Dev | Staging | Production |
|--------|-----|---------|------------|
| **Protocol** | HTTP | HTTPS | HTTPS |
| **Certificate** | N/A | Let's Encrypt | Let's Encrypt |
| **Min TLS Version** | N/A | TLS 1.2 | TLS 1.3 |
| **HSTS** | No | Yes | Yes (preload) |
| **Certificate Rotation** | N/A | Auto | Auto + monitoring |

### Access Control

| Resource | Dev | Staging | Production |
|----------|-----|---------|------------|
| **Database** | Public | IP whitelist | IP whitelist + VPN |
| **Redis** | Public | IP whitelist | IP whitelist + VPN |
| **Admin Panel** | Public | IP whitelist | IP whitelist + 2FA |
| **Logs** | Local | Team access | Admin only |
| **Secrets** | `.env` file | Fly secrets | Fly secrets + rotation |

---

## 📋 Validation Checklist

Use this checklist to verify environment parity:

### Infrastructure Parity
- [ ] All required services running
- [ ] Correct number of replicas
- [ ] Proper region configuration
- [ ] Networking rules configured
- [ ] Load balancing active (production)

### Configuration Parity
- [ ] All required env vars set
- [ ] Correct values for environment
- [ ] Secrets properly rotated
- [ ] Feature flags match expectations
- [ ] CORS origins correctly set

### Data Parity
- [ ] Database schema matches across environments
- [ ] Migrations applied in correct order
- [ ] Seed data appropriate for environment
- [ ] No production data in staging/dev

### Security Parity
- [ ] SSL certificates valid
- [ ] Secrets not in code/logs
- [ ] Access controls configured
- [ ] Security headers enabled
- [ ] Rate limiting active

### Monitoring Parity
- [ ] Logging configured correctly
- [ ] Metrics being collected
- [ ] Alerts configured and routed
- [ ] Error tracking working
- [ ] Uptime monitoring active

---

## 🔄 Automated Parity Checking

### Validation Script

Create `scripts/check-env-parity.sh`:

```bash
#!/bin/bash
# Check environment parity

ENV=${1:-staging}
ERRORS=0

echo "🔍 Checking $ENV environment parity..."

# Check required variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_*"
  "CORS_ORIGINS"
  "NODE_ENV"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    ((ERRORS++))
  else
    echo "✅ Found: $var"
  fi
done

# Check database connection
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ Database connection failed"
  ((ERRORS++))
fi

# Check Redis connection
if redis-cli -u "$REDIS_URL" PING > /dev/null 2>&1; then
  echo "✅ Redis connection successful"
else
  echo "❌ Redis connection failed"
  ((ERRORS++))
fi

# Check API health
if curl -sf http://localhost:$API_PORT/api/health > /dev/null; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed"
  ((ERRORS++))
fi

# Report results
if [ $ERRORS -eq 0 ]; then
  echo "✅ All parity checks passed"
  exit 0
else
  echo "❌ $ERRORS parity check(s) failed"
  exit 1
fi
```

Usage:
```bash
./scripts/check-env-parity.sh staging
./scripts/check-env-parity.sh production
```

---

## 🚨 Common Parity Issues

### Issue 1: Database Schema Drift
**Symptom:** Staging/prod have different columns
**Cause:** Migrations not applied
**Fix:**
```bash
cd apps/api
pnpm prisma:migrate:deploy
```

### Issue 2: Environment Variable Mismatch
**Symptom:** Features work in dev but not staging
**Cause:** Missing env vars
**Fix:** Compare `.env.example` with actual env

### Issue 3: Stale Secrets
**Symptom:** Authentication failures
**Cause:** Secrets not rotated after compromise
**Fix:**
```bash
fly secrets set JWT_*=new-secret-here
```

### Issue 4: CORS Errors
**Symptom:** Browser requests blocked
**Cause:** Wrong CORS_ORIGINS value
**Fix:** Update CORS_ORIGINS to match frontend URL

---

## 📅 Maintenance Schedule

### Weekly
- [ ] Check staging environment health
- [ ] Review error logs
- [ ] Verify automatic certificate renewal

### Monthly
- [ ] Rotate non-critical secrets
- [ ] Review and update environment documentation
- [ ] Check for configuration drift

### Quarterly
- [ ] Rotate all secrets (JWT, API keys, etc.)
- [ ] Security audit of all environments
- [ ] Load test staging environment
- [ ] Review and optimize resource allocation

---

## 📞 Emergency Contacts

### Environment Owners

| Environment | Owner | Backup | Slack |
|-------------|-------|--------|-------|
| **Development** | @dev-team | @tech-lead | #dev-support |
| **Staging** | @devops-lead | @tech-lead | #staging-alerts |
| **Production** | @tech-lead | @cto | #production-alerts |

### Service Providers

| Provider | Contact | Purpose |
|----------|---------|---------|
| **Fly.io** | support@fly.io | Infrastructure |
| **Vercel** | support@vercel.com | Web hosting |
| **Upstash** | support@upstash.com | Redis |
| **Sentry** | support@sentry.io | Error tracking |
| **Datadog** | support@datadoghq.com | Monitoring |

---

## 🎯 Best Practices

### Do's ✅
- ✅ Document all environment differences
- ✅ Use environment variables for configuration
- ✅ Test in staging before production
- ✅ Automate environment validation
- ✅ Rotate secrets regularly
- ✅ Monitor all environments

### Don'ts ❌
- ❌ Don't hardcode environment-specific values
- ❌ Don't use production data in staging/dev
- ❌ Don't skip staging deployments
- ❌ Don't share secrets via chat/email
- ❌ Don't deploy without health checks
- ❌ Don't ignore monitoring alerts

---

**Last Validated:** February 21, 2026  
**Next Validation:** March 21, 2026  
**Status:** ✅ All environments healthy
