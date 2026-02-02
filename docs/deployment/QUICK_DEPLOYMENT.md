# 🚀 Quick Start Deployment Guide

**Status**: Ready for Docker Compose or Container Deployment

---

## ⚡ Fastest Path to Running (Docker Compose)

> Docker Compose files now live under `configs/docker/`. Use the base file plus the `docker-compose.dev.yml` override for local development.

```bash
COMPOSE="docker compose -f configs/docker/docker-compose.yml -f configs/docker/docker-compose.dev.yml"

# 1. Start the entire stack with monitoring
$COMPOSE up -d

# 2. Check API is running with monitoring
$COMPOSE logs api | grep -E "(listening|Datadog|monitoring|compression)"

# 3. Apply database indexes (in new terminal)
$COMPOSE exec api bash scripts/db-indexes.sql

# 4. Health check
curl http://localhost:3001/api/health

# 5. View logs
$COMPOSE logs -f api
```

**Expected Output**:

```
api_1  | ✓ Compression middleware initialized
api_1  | ✓ Security headers initialized
api_1  | ✓ Datadog APM enabled (DD_TRACE_ENABLED=true)
api_1  | listening on 0.0.0.0:4000 (or 3001 in Docker)
```

---

## 🔍 Environment Check

### Verify Monitoring is Ready

```bash
# Check Datadog APM is configured
grep "DD_TRACE_ENABLED" .env .env.local 2>/dev/null || echo "Not in .env - using runtime"

# Check database will be available
docker-compose up postgres -d  # Start just database first
docker-compose logs postgres   # Wait for "database system is ready to accept connections"
```

### Database URL (for indexes)

```bash
# Extract from docker-compose.yml
DATABASE_URL="postgresql://infamous:infamouspass@localhost:5432/infamous_freight"

# Export for psql command
export DATABASE_URL="postgresql://infamous:infamouspass@postgres:5432/infamous_freight"
```

---

## 📊 Performance Features Now Active

### ✅ API Compression

- Gzip compression on all responses
- 1KB threshold (don't compress small responses)
- Compression level 6 (balance performance/ratio)
- Expected: 60-70% payload reduction

### ✅ Web Vitals Monitoring

- LCP (Largest Contentful Paint) tracking
- FID (First Input Delay) monitoring
- CLS (Cumulative Layout Shift) detection
- TTFB and FCP tracking
- Auto-reports to Vercel Analytics & Datadog

### ✅ Production Monitoring

- Datadog APM: Automatic request tracing
- Sentry: Error tracking (when DSN set)
- Performance thresholds: Pre-configured
- Rate limiting: Still enforced

### ✅ Database Optimization

- 9 production-ready indexes ready to deploy
- Query optimization utilities included
- N+1 prevention helper functions
- Performance analysis tools

---

## 🐳 Docker Compose Commands

### Start Services

```bash
# Start everything (postgres + api + web)
docker-compose up -d

# Start just API and database
docker-compose up -d api postgres

# Start with logs visible
docker-compose up api  # Ctrl+C to stop
```

### View Status

```bash
# Check all services
docker-compose ps

# Watch logs real-time
docker-compose logs -f

# Follow API logs only
docker-compose logs -f api

# Last 50 lines of API
docker-compose logs --tail=50 api
```

### Database Operations

```bash
# Apply indexes
docker-compose exec api psql $DATABASE_URL < scripts/db-indexes.sql

# Run migrations
docker-compose exec api cd api && pnpm prisma:migrate:prod

# Access database shell
docker-compose exec postgres psql -U infamous -d infamous_freight
```

### Monitoring

```bash
# Check health endpoints
curl http://localhost:3001/api/health

# Check compression is working
curl -i http://localhost:3001/api/health | grep "Content-Encoding"
# Should see: Content-Encoding: gzip

# Test API route with monitoring
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/shipments
```

---

## 📈 Performance Verification

### After Deployment, Verify

```bash
# 1. Compression middleware active
curl -v http://localhost:3001/api/health 2>&1 | grep -i "encoding"
# Expected: Content-Encoding: gzip

# 2. Caching middleware active (GET requests)
curl -v http://localhost:3001/api/shipments 2>&1 | grep -i "cache"
# Expected: Cache-Control headers present

# 3. Database is connected
curl http://localhost:3001/api/health | jq '.data'
# Expected: { "status": "ok", "database": "connected" }

# 4. Monitoring configuration
docker-compose logs api | grep -i "datadog\|sentry\|monitoring"
# Expected: Configuration messages showing APM enabled
```

---

## 🔧 Environment Variables (Auto-Set in Docker)

```env
# Datadog APM (automatic in our setup)
DD_TRACE_ENABLED=true
DD_SERVICE=infamous-freight-api
DD_ENV=production
DD_RUNTIME_METRICS_ENABLED=true

# Database (automatic in docker-compose.yml)
DATABASE_URL=postgresql://infamous:infamouspass@postgres:5432/infamous_freight

# Performance
PERFORMANCE_MONITORING_ENABLED=true
SLOW_QUERY_THRESHOLD=1000
SLOW_API_THRESHOLD=500

# Optional (set in .env.local or secrets)
SENTRY_DSN=https://key@sentry.io/projectid
NEXT_PUBLIC_DD_APP_ID=your-app-id
NEXT_PUBLIC_DD_CLIENT_TOKEN=your-client-token
```

---

## 🚨 Troubleshooting

### API Won't Start

```bash
# Check container logs
docker-compose logs api

# Common issues:
# 1. OpenSSL missing: Use Docker (solves it)
# 2. Port already in use: docker-compose down; docker-compose up
# 3. Database not ready: docker-compose restart postgres
```

### Compression Not Working

```bash
# Check middleware is loaded
grep "compression" /workspaces/Infamous-freight-enterprises/api/src/server.js

# Verify package installed
docker-compose exec api npm ls compression

# Test directly
curl -H "Accept-Encoding: gzip" -i http://localhost:3001/api/health
```

### Database Indexes Not Applied

```bash
# Check script exists
docker-compose exec api ls -la scripts/db-indexes.sql

# Run manually with output
docker-compose exec api psql $DATABASE_URL -f scripts/db-indexes.sql

# Or run line by line
docker-compose exec api psql $DATABASE_URL < scripts/db-indexes.sql
```

### Monitoring Not Reporting

```bash
# Check Datadog APM is enabled
docker-compose exec api env | grep DD_TRACE

# Check API is receiving requests
docker-compose logs api | grep "request"

# Verify Datadog agent is running (if self-hosted)
# Or check Datadog dashboard: app.datadoghq.com
```

---

## 📋 Complete Deployment Checklist

- [x] Run `docker-compose up -d`
- [x] Verify `docker-compose ps` shows all services running
- [x] Check `curl http://localhost:3001/api/health` returns 200
- [x] Test compression: `curl -v http://localhost:3001/api/health | grep gzip`
- [x] Apply database indexes: `docker-compose exec api psql $DATABASE_URL < scripts/db-indexes.sql`
- [x] Check Datadog dashboard for APM traces
- [x] Monitor Web Vitals in Vercel Analytics
- [x] Set up alerts in monitoring dashboards
- [x] Run tests: `docker-compose exec api pnpm test`
- [x] Deploy to production when ready

---

## 🎯 Next Steps After Docker Start

1. **Verify Compression**
   - Check response headers include `Content-Encoding: gzip`
   - Monitor payload sizes (should be 60-70% smaller)

2. **Check Database**
   - Apply indexes: `docker-compose exec api psql $DATABASE_URL < scripts/db-indexes.sql`
   - Verify indexes: `docker-compose exec postgres psql -U infamous -d infamous_freight -c "\d shipments_status_idx"`

3. **Monitor Performance**
   - Datadog: Check APM dashboard for traces
   - Vercel: Monitor Web Vitals dashboard
   - Sentry: Check error tracking (if DSN set)

4. **Production Deploy**
   - Web: Push to Vercel (automatic from main branch)
   - API: Push to Fly.io or use Docker image

---

**Ready to deploy? Run:**

```bash
docker-compose up -d && docker-compose logs -f api
```

🚀 All infrastructure ready - deployment in progress!
