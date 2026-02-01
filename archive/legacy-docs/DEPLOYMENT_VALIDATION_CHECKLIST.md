# Deployment Validation Checklist

## Complete System Verification for Infamous Freight Enterprises

Use this checklist to validate that all infrastructure components are working correctly before promoting to production.

---

## Section 1: Docker & Container Validation

### Step 1.1: Verify All Containers Running

```bash
# Check all containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Expected: All containers showing "Up" status
# Container List:
# ✓ api-blue       - Running
# ✓ api-green      - Running
# ✓ postgres       - Running
# ✓ redis          - Running
# ✓ nginx          - Running
# ✓ prometheus     - Running
# ✓ grafana        - Running
```

**Validation Steps**:

- [ ] API Blue container running (port 4000 internal)
- [ ] API Green container running (port 4000 internal)
- [ ] PostgreSQL container running (port 5432)
- [ ] Redis container running (port 6379)
- [ ] Nginx reverse proxy running (ports 80, 443)
- [ ] Prometheus running (port 9090)
- [ ] Grafana running (port 3001)

### Step 1.2: Verify Container Healthchecks

```bash
# Check health status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  ps --no-trunc | grep -E "healthy|unhealthy"

# All should show "healthy"
docker inspect infamous-api-blue | grep -A 5 "Health"
docker inspect infamous-postgres | grep -A 5 "Health"
```

**Validation Steps**:

- [ ] API Blue health check passing
- [ ] API Green health check passing
- [ ] PostgreSQL health check passing
- [ ] Redis health check passing
- [ ] All containers report healthy status

### Step 1.3: Verify Container Resource Limits

```bash
# Check memory/CPU limits
docker inspect infamous-api-blue | grep -A 10 "HostConfig"

# Should show limits set:
# - API: 512MB memory
# - Web: 256MB memory
# - PostgreSQL: 2GB memory
# - Redis: 512MB memory
```

**Validation Steps**:

- [ ] API memory limit: 512MB
- [ ] Web memory limit: 256MB
- [ ] PostgreSQL memory limit: 2GB
- [ ] Redis memory limit: 512MB
- [ ] CPU shares configured
- [ ] Resource limits enforced

---

## Section 2: Network & Port Validation

### Step 2.1: Verify Port Bindings

```bash
# Check open ports
lsof -i -P -n | grep LISTEN

# Expected ports:
# - 80    : Nginx HTTP
# - 443   : Nginx HTTPS (if configured)
# - 3000  : Web frontend
# - 3001  : Grafana
# - 5050  : pgAdmin (dev only)
# - 8081  : Redis Commander (dev only)
# - 5432  : PostgreSQL (internal)
# - 6379  : Redis (internal)
# - 9090  : Prometheus
# - 9100  : Node Exporter
```

**Validation Steps**:

- [ ] Port 80 (Nginx) listening
- [ ] Port 3000 (Web) accessible
- [ ] Port 3001 (Grafana) accessible
- [ ] Port 5432 (Database) accessible
- [ ] Port 6379 (Redis) accessible
- [ ] Port 9090 (Prometheus) accessible

### Step 2.2: Test Network Connectivity

```bash
# Test API Blue connectivity
curl http://localhost:4000/api/health --verbose

# Test API Green connectivity
curl http://api-green:4000/api/health --verbose

# Test PostgreSQL connectivity
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Test Redis connectivity
docker-compose exec redis redis-cli ping
```

**Validation Steps**:

- [ ] API responds to /api/health
- [ ] PostgreSQL accepts connections
- [ ] Redis PING responds with PONG
- [ ] Nginx reverse proxy working
- [ ] DNS resolution working

---

## Section 3: Health Check Endpoints

### Step 3.1: Test Basic Health Endpoint

```bash
# Test /api/health (basic)
curl http://localhost:4000/api/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "uptime": 1234,
#   "timestamp": 1234567890,
#   "services": {
#     "database": "connected",
#     "redis": "connected"
#   }
# }
```

**Validation Steps**:

- [ ] Returns 200 OK
- [ ] Status is "healthy"
- [ ] Contains uptime
- [ ] Contains timestamp
- [ ] Shows database status
- [ ] Shows redis status

### Step 3.2: Test Kubernetes Probes

```bash
# Test liveness probe (/api/health/live)
curl http://localhost:4000/api/health/live -v

# Expected: 200 OK (should be fast, < 100ms)

# Test readiness probe (/api/health/ready)
curl http://localhost:4000/api/health/ready -v

# Expected: 200 OK if all dependencies ready, 503 if not
```

**Validation Steps**:

- [ ] /api/health/live returns 200
- [ ] /api/health/ready returns 200 (or 503 if DB down)
- [ ] Response time < 100ms
- [ ] Endpoints are reachable

### Step 3.3: Test Detailed Health Endpoint

```bash
# Test detailed health (requires auth)
curl http://localhost:4000/api/health/details \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Expected: Detailed metrics including:
# - Database connections
# - Redis memory usage
# - System CPU/memory
# - Response time percentiles
```

**Validation Steps**:

- [ ] Returns comprehensive health data
- [ ] Includes system metrics
- [ ] Includes database stats
- [ ] Includes response time percentiles
- [ ] Authentication working

### Step 3.4: Test Health Dashboard

```bash
# Test HTML dashboard
curl http://localhost:4000/api/health/dashboard \
  -H "Accept: text/html" | head -50

# Expected: HTML page with:
# - System metrics
# - Service status
# - Auto-refresh (30s)
# - Visual indicators (green/red)
```

**Validation Steps**:

- [ ] Dashboard page loads
- [ ] Shows system metrics
- [ ] Shows service status
- [ ] Auto-refreshes every 30 seconds
- [ ] Displays health indicators

---

## Section 4: Database Validation

### Step 4.1: Verify Database Connection

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Expected: Output "1"

# Check database exists
docker-compose exec postgres psql -U postgres -c "\\l" | grep infamous
```

**Validation Steps**:

- [ ] psql connects successfully
- [ ] Database "infamous_freight" exists
- [ ] Default user "postgres" can connect
- [ ] Query executes without errors

### Step 4.2: Verify Database Tables

```bash
# List all tables
docker-compose exec postgres psql -U postgres -d infamous_freight -c "\\dt"

# Expected: Tables for shipments, users, etc. created by Prisma migrations

# Count rows in key tables
docker-compose exec postgres psql -U postgres -d infamous_freight -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

**Validation Steps**:

- [ ] Tables created from migrations
- [ ] No migration errors
- [ ] Can query tables
- [ ] Data integrity maintained

### Step 4.3: Run Database Health Checks

```bash
# Check connection pool
docker-compose exec postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Expected: Should show connections (< 80 is healthy)

# Check for long-running queries
docker-compose exec postgres psql -U postgres -c \
  "SELECT * FROM pg_stat_activity WHERE state != 'idle';"
```

**Validation Steps**:

- [ ] Connection pool healthy (< 80 connections)
- [ ] No long-running queries (> 5 minutes)
- [ ] Database replication lag normal (if applicable)
- [ ] Autovacuum running properly

---

## Section 5: Redis Validation

### Step 5.1: Verify Redis Connection

```bash
# Test Redis connectivity
docker-compose exec redis redis-cli ping

# Expected: "PONG"

# Check Redis info
docker-compose exec redis redis-cli info
```

**Validation Steps**:

- [ ] redis-cli PING returns PONG
- [ ] Can connect with no auth (if no password set)
- [ ] INFO command works
- [ ] Version is compatible

### Step 5.2: Check Redis Memory Usage

```bash
# Get memory statistics
docker-compose exec redis redis-cli info memory

# Expected: memory_used_human shows reasonable usage
# Typical: 50-200MB for development
```

**Validation Steps**:

- [ ] Memory used < 512MB (limit)
- [ ] Memory fragmentation < 1.5x
- [ ] Eviction policy set (if needed)
- [ ] No out of memory errors

### Step 5.3: Test Cache Operations

```bash
# Set a test key
docker-compose exec redis redis-cli SET test_key "test_value"

# Get the test key
docker-compose exec redis redis-cli GET test_key

# Expected: "test_value"

# Delete test key
docker-compose exec redis redis-cli DEL test_key
```

**Validation Steps**:

- [ ] Can SET keys
- [ ] Can GET keys
- [ ] Can DELETE keys
- [ ] TTL works if configured

---

## Section 6: API Validation

### Step 6.1: Test Core API Endpoints

```bash
# Test health endpoint
curl http://localhost:4000/api/health | jq '.status'

# Test shipments endpoint (if available)
curl http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.data | length'

# Test users endpoint
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
```

**Validation Steps**:

- [ ] /api/health responds
- [ ] /api/shipments accessible with auth
- [ ] /api/users endpoints working
- [ ] CORS headers present
- [ ] Rate limiting active

### Step 6.2: Test Authentication

```bash
# Test without token (should fail)
curl http://localhost:4000/api/shipments

# Expected: 401 Unauthorized

# Test with valid token (should succeed)
curl http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 200 OK with data
```

**Validation Steps**:

- [ ] Missing token returns 401
- [ ] Invalid token returns 401
- [ ] Valid token grants access
- [ ] Scope enforcement working

### Step 6.3: Test Rate Limiting

```bash
# Make rapid requests to trigger rate limit
for i in {1..105}; do
  curl -s http://localhost:4000/api/health > /dev/null
done

# Last requests should return 429 Too Many Requests
```

**Validation Steps**:

- [ ] Rate limiting enforces limits
- [ ] Returns 429 when exceeded
- [ ] Includes Retry-After header
- [ ] Resets after window expires

---

## Section 7: Web Application Validation

### Step 7.1: Test Web App Accessibility

```bash
# Test web app on port 3000
curl http://localhost:3000 -I

# Expected: 200 OK with HTML content-type

# Check Next.js API routes
curl http://localhost:3000/api/health -I
```

**Validation Steps**:

- [ ] Web app responds on port 3000
- [ ] Returns HTML (not 404)
- [ ] API routes accessible
- [ ] Asset loading working

### Step 7.2: Test Web App Features

```bash
# Check if pages render
curl http://localhost:3000 | grep -q "<html" && echo "✓ HTML loaded"

# Check if CSS/JS loaded
curl http://localhost:3000 | grep -q "<script\|<link" && echo "✓ Assets loaded"
```

**Validation Steps**:

- [ ] Pages load without errors
- [ ] Assets (CSS, JS) load
- [ ] Navigation working
- [ ] No console errors

---

## Section 8: Monitoring Stack Validation

### Step 8.1: Test Prometheus

```bash
# Access Prometheus UI
curl http://localhost:9090/api/v1/status/config | jq

# Check targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'

# Expected: All targets UP
```

**Validation Steps**:

- [ ] Prometheus accessible on port 9090
- [ ] Configuration loaded
- [ ] All scrape targets UP
- [ ] Metrics being collected

### Step 8.2: Test Grafana

```bash
# Access Grafana
curl http://localhost:3001/api/health | jq

# Expected: Database connected
```

**Validation Steps**:

- [ ] Grafana accessible on port 3001
- [ ] Login works (admin/admin)
- [ ] Dashboards visible
- [ ] Prometheus data source configured

### Step 8.3: Verify Metrics Collection

```bash
# Query Prometheus for API metrics
curl "http://localhost:9090/api/v1/query?query=http_requests_total" | jq '.data.result | length'

# Expected: Should return > 0 metrics

# Check database metrics
curl "http://localhost:9090/api/v1/query?query=pg_up" | jq '.data.result'
```

**Validation Steps**:

- [ ] HTTP metrics being collected
- [ ] Database metrics being collected
- [ ] System metrics being collected
- [ ] No scrape errors in logs

---

## Section 9: Blue-Green Deployment Validation

### Step 9.1: Verify Both Deployments Running

```bash
# Check blue deployment
curl http://api-blue:4000/api/health | jq '.status'

# Check green deployment
curl http://api-green:4000/api/health | jq '.status'

# Both should return "healthy"
```

**Validation Steps**:

- [ ] api-blue container running
- [ ] api-green container running
- [ ] Both responding to health checks
- [ ] Both can connect to database

### Step 9.2: Test Nginx Routing

```bash
# Check current active deployment
curl http://localhost:4000/api/health -v | grep X-Served-By

# Expected: Shows which backend (blue or green)

# Multiple requests should go to same backend
for i in {1..5}; do
  curl -s http://localhost:4000/api/health | jq '.upstream'
done
```

**Validation Steps**:

- [ ] Nginx routes to correct upstream
- [ ] Consistent routing (sticky sessions)
- [ ] Both backends accessible via Nginx
- [ ] Load balancing working

### Step 9.3: Test Blue-Green Switch Script

```bash
# Check current status
./scripts/switch-deployment.sh status

# Expected: Shows current active deployment

# Test health check
./scripts/switch-deployment.sh health-check

# Expected: Both deployments healthy
```

**Validation Steps**:

- [ ] switch-deployment.sh script works
- [ ] Status command shows current deployment
- [ ] Health check identifies healthy instances
- [ ] No errors in script execution

---

## Section 10: Security Validation

### Step 10.1: Verify Security Headers

```bash
# Check Nginx security headers
curl http://localhost:4000 -I | grep -E "Strict-Transport|X-Frame|X-Content"

# Expected headers:
# Strict-Transport-Security
# X-Frame-Options
# X-Content-Type-Options
# Content-Security-Policy
```

**Validation Steps**:

- [ ] HSTS header present
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] CSP header configured

### Step 10.2: Verify Non-Root Containers

```bash
# Check if containers running as non-root
docker inspect infamous-api-blue | grep '"User"'

# Expected: "User": "nodejs:1001" (or similar non-root)

docker inspect infamous-web | grep '"User"'
```

**Validation Steps**:

- [ ] API not running as root
- [ ] Web not running as root
- [ ] All services running as non-root
- [ ] Permission errors logged

### Step 10.3: Verify Secrets Management

```bash
# Check secrets mounted
docker inspect infamous-api-blue | grep -A 10 "Mounts"

# Expected: /run/secrets/ mounted

# Verify secrets file exists
docker-compose exec api-blue ls -la /run/secrets/
```

**Validation Steps**:

- [ ] Secrets directory mounted
- [ ] JWT secret loaded
- [ ] Database password secured
- [ ] No secrets in environment variables

---

## Section 11: Development Tools Validation (Dev Only)

### Step 11.1: Verify pgAdmin

```bash
# Test pgAdmin (dev only)
curl http://localhost:5050 -I

# Expected: 302 redirect to login
```

**Validation Steps**:

- [ ] pgAdmin accessible on port 5050 (dev)
- [ ] Can login with credentials
- [ ] Database visible in pgAdmin
- [ ] Can browse tables

### Step 11.2: Verify Redis Commander

```bash
# Test Redis Commander (dev only)
curl http://localhost:8081 -I

# Expected: 200 OK
```

**Validation Steps**:

- [ ] Redis Commander accessible on 8081 (dev)
- [ ] Can see Redis keys
- [ ] Can inspect values
- [ ] Can execute commands

---

## Section 12: Performance Validation

### Step 12.1: Test API Response Times

```bash
# Test response time
time curl http://localhost:4000/api/health > /dev/null

# Expected: < 100ms
```

**Validation Steps**:

- [ ] /api/health < 100ms
- [ ] /api/shipments < 500ms
- [ ] Database queries < 200ms
- [ ] No slow queries in logs

### Step 12.2: Test Concurrent Requests

```bash
# Send 100 concurrent requests
ab -n 100 -c 10 http://localhost:4000/api/health

# Expected:
# - All requests succeed (100 completed)
# - No failures
# - Average time reasonable
```

**Validation Steps**:

- [ ] Can handle concurrent load
- [ ] No connection errors
- [ ] Response times stable
- [ ] Database connections not exhausted

---

## Final Validation Summary

### Complete Checklist

```bash
# Run this validation checklist
cat << 'EOF'

INFRASTRUCTURE VALIDATION CHECKLIST
===================================

[ ] Section 1: Docker & Containers (6 items)
[ ] Section 2: Network & Ports (6 items)
[ ] Section 3: Health Checks (4 items)
[ ] Section 4: Database (3 items)
[ ] Section 5: Redis (3 items)
[ ] Section 6: API (3 items)
[ ] Section 7: Web App (2 items)
[ ] Section 8: Monitoring (3 items)
[ ] Section 9: Blue-Green (3 items)
[ ] Section 10: Security (3 items)
[ ] Section 11: Dev Tools (2 items)
[ ] Section 12: Performance (2 items)

Total Items: 45
Required: 45/45 passing

Status: READY FOR PRODUCTION ✅
EOF
```

### Sign-Off

When all 45 validation items pass, deployment is verified:

```
Validated By: ________________
Date: ________________
Time: ________________
Notes: ________________
```

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Complete
