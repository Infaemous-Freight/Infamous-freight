# PHASE 1: QUICK START DEPLOYMENT COMMANDS

**Infamous Freight Enterprises v1.0.0**  
**Status**: ✅ APPROVED & READY TO DEPLOY

---

## 🚀 QUICK DEPLOYMENT (Copy-Paste Ready)

### Option 1: Full Docker Deployment (Recommended)

```bash
# Navigate to workspace
cd /workspaces/Infamous-freight-enterprises

# Verify environment file exists
cat .env.production | grep NODE_ENV

# Display Docker Compose services to be started
docker-compose -f docker-compose.production.yml config 2>&1 | grep -A 2 "services:"

# Start all services in background
docker-compose -f docker-compose.production.yml up -d

# Monitor startup (watch for all services to be "Up")
docker-compose -f docker-compose.production.yml ps

# View API startup logs
docker-compose -f docker-compose.production.yml logs -f api --tail=20

# View Web startup logs (in another terminal)
docker-compose -f docker-compose.production.yml logs -f web --tail=20

# Once all services show "Up", verify health
sleep 10
curl http://localhost:3001/api/health | jq .

# Expected response:
# {
#   "status": "ok",
#   "uptime": XX.XX,
#   "timestamp": 1735560000000,
#   "database": "connected"
# }
```

---

## ✅ HEALTH CHECK COMMANDS

```bash
# 1. API Health (critical - must return 200)
echo "🔍 Checking API Health..."
curl -s http://localhost:3001/api/health | jq . && echo "✅ API Healthy" || echo "❌ API Failed"

# 2. Web Application (must load)
echo "🔍 Checking Web App..."
curl -s -I http://localhost:3000 | grep "HTTP" && echo "✅ Web Running" || echo "❌ Web Failed"

# 3. Grafana Dashboard (monitoring)
echo "🔍 Checking Grafana..."
curl -s -I http://localhost:3002 | grep "HTTP" && echo "✅ Grafana Running" || echo "❌ Grafana Failed"

# 4. All services status
echo "🔍 Checking all services..."
docker-compose -f docker-compose.production.yml ps

# 5. Database connection
echo "🔍 Checking database..."
docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U infamous && echo "✅ Database Connected" || echo "❌ Database Failed"

# 6. Redis connection
echo "🔍 Checking Redis..."
docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping && echo "✅ Redis Connected" || echo "❌ Redis Failed"
```

---

## 🧪 SMOKE TESTS

```bash
# 1. Test API endpoints (requires valid JWT - see below)
echo "🧪 Testing API endpoints..."

# Get health endpoint (no auth required)
curl -s http://localhost:3001/api/health | jq '.status'

# Test with a sample request (replace JWT_TOKEN with actual token if needed)
# curl -X GET http://localhost:3001/api/shipments \
#   -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# 2. Web application load test
echo "🧪 Testing web app load..."
curl -s http://localhost:3000 | grep -i "<!DOCTYPE" && echo "✅ Web page loaded" || echo "❌ Web page failed"

# 3. Monitoring dashboard
echo "🧪 Testing Grafana dashboard..."
curl -s http://localhost:3002 | grep -i "grafana" && echo "✅ Grafana accessible" || echo "❌ Grafana failed"
```

---

## 📊 MONITORING COMMANDS (24-Hour Watch)

```bash
# Monitor error logs in real-time
echo "👀 Monitoring API errors..."
docker-compose -f docker-compose.production.yml logs -f api | grep -i "error\|exception\|fatal"

# Monitor response times
echo "⏱️  Monitoring response times..."
docker-compose -f docker-compose.production.yml logs -f api | grep "response"

# Monitor resource usage
echo "💾 Monitoring system resources..."
docker stats --no-stream

# View all logs (last 50 lines)
echo "📋 Viewing service logs..."
docker-compose -f docker-compose.production.yml logs --tail=50

# Monitor database connections
echo "🗄️  Monitoring database connections..."
docker-compose -f docker-compose.production.yml exec -T postgres psql -U infamous -d infamous_freight -c "SELECT count(*) FROM pg_stat_activity;"

# Check Prometheus metrics collection
echo "📈 Checking Prometheus metrics..."
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'

# Check for service errors in last 5 minutes
echo "⚠️  Checking for recent errors..."
docker-compose -f docker-compose.production.yml logs --since 5m | grep -i "error\|exception" | wc -l
```

---

## 🔧 TROUBLESHOOTING COMMANDS

```bash
# API won't start
echo "🔧 Troubleshooting API..."
docker-compose -f docker-compose.production.yml logs api --tail=100
# Check: DATABASE_URL, JWT_SECRET in .env.production

# Web won't load
echo "🔧 Troubleshooting Web..."
docker-compose -f docker-compose.production.yml logs web --tail=100
# Check: NEXT_PUBLIC_API_URL pointing to http://localhost:3001/api

# Database connection failed
echo "🔧 Troubleshooting Database..."
docker-compose -f docker-compose.production.yml logs postgres --tail=50
# Check: POSTGRES credentials in .env.production

# High error rate
echo "🔧 Checking for errors..."
docker-compose -f docker-compose.production.yml logs api | grep -i "error\|exception" | tail -20

# Services not starting
echo "🔧 Service status..."
docker ps -a | grep -E "infamous|postgres|redis"
# Fix: docker-compose -f docker-compose.production.yml restart

# View detailed service logs
docker-compose -f docker-compose.production.yml logs --follow api
```

---

## 🛑 STOP & ROLLBACK COMMANDS

```bash
# Stop all services (keeps data)
echo "Stopping services..."
docker-compose -f docker-compose.production.yml down

# Stop and remove volumes (full cleanup)
echo "Full cleanup..."
docker-compose -f docker-compose.production.yml down -v

# Restart all services
echo "Restarting services..."
docker-compose -f docker-compose.production.yml restart

# Restart single service (e.g., API)
echo "Restarting API..."
docker-compose -f docker-compose.production.yml restart api

# Full rollback (stop, restore database, restart)
echo "Full rollback procedure..."
docker-compose -f docker-compose.production.yml down
# Restore database from backup (manual step required)
docker-compose -f docker-compose.production.yml up -d
```

---

## 📈 PERFORMANCE MONITORING

```bash
# Check response time percentiles
echo "📊 Checking response time metrics..."
curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,http_request_duration_seconds)' | jq '.data.result[0].value[1]'

# Check error rate
echo "📊 Checking error rate..."
curl -s http://localhost:9090/api/v1/query?query='rate(http_requests_total{job="api"}[5m])' | jq '.data.result | length'

# Check database connections
echo "📊 Checking database pool..."
curl -s http://localhost:9090/api/v1/query?query='db_pool_size' | jq '.data.result[0].value[1]'

# Check cache hit rate
echo "📊 Checking cache performance..."
curl -s http://localhost:9090/api/v1/query?query='redis_hits_total' | jq '.data.result[0].value[1]'

# View Grafana dashboards
echo "📊 Open Grafana: http://localhost:3002"
echo "   Username: admin"
echo "   Password: (from GRAFANA_ADMIN_PASSWORD in .env.production)"
```

---

## 🎯 SUCCESS VERIFICATION (Run in Order)

```bash
#!/bin/bash
# Save as: verify-deployment.sh
# Run: bash verify-deployment.sh

echo "╔════════════════════════════════════════════╗"
echo "║  Phase 1 Deployment Verification         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Test 1: Services running
echo "✓ Test 1: Services running"
SERVICES=$(docker-compose -f docker-compose.production.yml ps | grep -c "Up")
echo "  Services running: $SERVICES/7"
if [ "$SERVICES" -eq 7 ]; then echo "  ✅ PASS"; else echo "  ❌ FAIL"; fi
echo ""

# Test 2: API health
echo "✓ Test 2: API health check"
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
echo "  API response: HTTP $API_HEALTH"
if [ "$API_HEALTH" -eq 200 ]; then echo "  ✅ PASS"; else echo "  ❌ FAIL"; fi
echo ""

# Test 3: Web app
echo "✓ Test 3: Web application"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "  Web response: HTTP $WEB_STATUS"
if [ "$WEB_STATUS" -eq 200 ]; then echo "  ✅ PASS"; else echo "  ❌ FAIL"; fi
echo ""

# Test 4: Database
echo "✓ Test 4: Database connection"
DB_CHECK=$(docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U infamous 2>&1)
if echo "$DB_CHECK" | grep -q "accepting"; then echo "  ✅ PASS"; else echo "  ❌ FAIL"; fi
echo ""

# Test 5: Redis
echo "✓ Test 5: Redis cache"
REDIS_CHECK=$(docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping 2>&1)
if [ "$REDIS_CHECK" = "PONG" ]; then echo "  ✅ PASS"; else echo "  ❌ FAIL"; fi
echo ""

# Test 6: Monitoring
echo "✓ Test 6: Monitoring stack"
PROM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090)
GRAFANA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
echo "  Prometheus: HTTP $PROM_STATUS"
echo "  Grafana: HTTP $GRAFANA_STATUS"
if [ "$PROM_STATUS" -eq 200 ] && [ "$GRAFANA_STATUS" -eq 200 ]; then echo "  ✅ PASS"; else echo "  ❌ FAIL"; fi
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║  Verification Complete                    ║"
echo "╚════════════════════════════════════════════╝"
```

---

## 📞 EMERGENCY CONTACTS

**If deployment fails:**

1. **Check logs**: `docker-compose logs [service-name]`
2. **Verify environment**: `cat .env.production | head -20`
3. **Check Docker**: `docker ps -a`
4. **Restart service**: `docker-compose restart [service-name]`
5. **Full rollback**: See STOP & ROLLBACK section above

---

## ⏱️ TIMELINE

- **Start services**: 5 min
- **Health checks**: 10 min
- **Smoke tests**: 10 min
- **Initial monitoring**: 5 min
- **24-hour monitoring**: Ongoing
- **Transition to Phase 2**: After 24h stable

---

**Total Active Time**: 30 minutes  
**Total with Monitoring**: 30 min + 24 hours

Once Phase 1 is stable for 24 hours, proceed to Phase 2 optimization.
