# 🚀 Staging Deployment - Live Execution
## Real-time Deployment Walkthrough

**Status**: STARTING DEPLOYMENT  
**Date**: February 22, 2026  
**Time**: NOW  

---

## 📋 Pre-Execution Checklist (2 mins)

Before we start, verify these are in place:

```bash
# 1. Check Node & pnpm versions
node --version          # Should be 18.x+
pnpm --version         # Should be 8.15.9

# 2. Check Docker (if using Docker option)
docker --version       # Check if available
docker-compose --version

# 3. Verify git is clean
git status             # Should show clean working tree
```

---

## 🎯 DEPLOYMENT EXECUTION OPTIONS

### ⭐ OPTION A: Docker Compose (Recommended - Most Realistic)

**Time**: ~2 minutes to start, ~30 seconds to become healthy

```bash
# Step 1: Navigate to workspace
cd /workspaces/Infamous-freight-enterprises

# Step 2: Start all services
docker-compose up -d

# Output should show:
# Creating infamous-freight-enterprises_postgres_1 ... done
# Creating infamous-freight-enterprises_redis_1 ... done
# Creating infamous-freight-enterprises_api_1 ... done
# Creating infamous-freight-enterprises_web_1 ... done

# Step 3: Wait for services to be healthy
echo "⏳ Waiting for services to become healthy..."
sleep 30

# Step 4: Verify all services are running
docker-compose ps

# Expected output:
# NAME                    COMMAND                  SERVICE      STATUS
# .../postgres            "docker-entrypoint..."   postgres     Up (healthy)
# .../redis               "redis-server"           redis        Up
# .../api                 "node src/server.js"     api          Up
# .../web                 "npm start"              web          Up
```

✅ **If all services show UP**: Continue to validation tests

---

### 💻 OPTION B: Local Development (Faster - For Quick Testing)

**Time**: ~1 minute to start

**Terminal 1: Start API**
```bash
cd /workspaces/Infamous-freight-enterprises/apps/api
pnpm dev

# Watch for:
# ✓ Server running on port 4000
# ✓ Database connected
```

**Terminal 2: Start Web (new terminal)**
```bash
cd /workspaces/Infamous-freight-enterprises/apps/web
pnpm dev

# Watch for:
# ✓ ready - started server on 0.0.0.0:3000
```

**Terminal 3: Monitor Logs (new terminal)**
```bash
cd /workspaces/Infamous-freight-enterprises/apps/api
tail -f logs/combined.log
```

✅ **If both services start**: Continue to validation tests

---

## ✅ IMMEDIATE VALIDATION (5 mins)

### Test 1: Health Checks

**Check API Health**
```bash
curl -s http://localhost:4000/api/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": 1708622400000,
  "uptime": 45.2
}
```

✅ **Success**: Status is "ok" and database is "connected"  
❌ **Issue**: If database shows "disconnected", check PostgreSQL is running

---

**Check Web Service**
```bash
curl -I http://localhost:3000
```

Expected response:
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

✅ **Success**: HTTP 200 response  
❌ **Issue**: If 500 error, check Terminal 2 for startup errors

---

### Test 2: Quick API Test

**List Shipments (Tests query optimizer)**
```bash
# Note: Replace JWT_TOKEN with actual token or test token
curl -s 'http://localhost:4000/api/shipments?limit=10' \
  -H "Authorization: Bearer test-token" | jq '.data | length'
```

✅ **Success**: Returns number 0 or higher  
❌ **No data**: That's OK, just means no shipments yet

---

### Test 3: Shipment Validator Test

**Create a shipment**
```bash
SHIPMENT=$(curl -s -X POST http://localhost:4000/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"origin":"NYC","destination":"LA"}')

SHIPMENT_ID=$(echo $SHIPMENT | jq -r '.data.id' 2>/dev/null)
echo "Created shipment: $SHIPMENT_ID"
```

**Test valid state transition (PENDING → ASSIGNED)**
```bash
curl -X PATCH http://localhost:4000/api/shipments/$SHIPMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"status":"ASSIGNED"}' | jq '.data.status'
```

Expected: `"ASSIGNED"`

✅ **Success**: Status changed to ASSIGNED  
❌ **Error**: Check for validation message

---

## 📊 PERFORMANCE MEASUREMENT (10 mins)

### Latency Test

**Measure response time for list endpoint**
```bash
# Run 5 times and track latency
for i in {1..5}; do
  echo "Test $i:"
  time curl -s 'http://localhost:4000/api/shipments?limit=50' \
    -H "Authorization: Bearer test-token" \
    -o /dev/null
done
```

**Target**: < 500ms per request  
**Expected**: ~300-350ms (60% improvement from 800ms baseline)

✅ **Success**: All under 500ms  
⚠️ **Warning**: If above 800ms, performance issue exists

---

### Query Efficiency Test

**Check database query count**
```bash
# Count queries in logs (if available)
if [ -f "apps/api/logs/combined.log" ]; then
  echo "Recent query count:"
  tail -50 apps/api/logs/combined.log | grep -i "query\|select" | wc -l
fi
```

**Target**: 1 query per list request  
**Expected**: Should see minimal query log entries

✅ **Success**: Very few query logs (N+1 eliminated)  
⚠️ **Warning**: If many queries, optimizer may not be active

---

### Correlation ID & Logging Test

**Verify request logging**
```bash
# Make a request and check logs
curl -s 'http://localhost:4000/api/shipments' \
  -H "Authorization: Bearer test-token" > /dev/null

# Check for correlation IDs in logs
if [ -f "apps/api/logs/combined.log" ]; then
  echo "Correlation IDs in logs:"
  grep "correlationId" apps/api/logs/combined.log | tail -3 | jq '.correlationId' 2>/dev/null
fi
```

✅ **Success**: Correlation IDs present in logs  
⚠️ **Info**: Logging may take a moment to write

---

## 📈 RESULTS CAPTURE

### Create Results Document

**Copy this template and fill in your actual measurements:**

```bash
cat > STAGING-DEPLOYMENT-RESULTS.md << 'EOF'
# Staging Deployment Results
**Date**: February 22, 2026  
**Executor**: [YOUR NAME]  
**Duration**: [DEPLOYMENT TIME]

## ✅ Services Status
- [ ] API Health: ✅ OK / ❌ FAILED
- [ ] Web Health: ✅ OK / ❌ FAILED
- [ ] Database Connected: ✅ YES / ❌ NO
- [ ] All services running: ✅ YES / ❌ NO

## ✅ Feature Tests
- [ ] Shipment List: ✅ Working / ❌ Failed
- [ ] Shipment Create: ✅ Working / ❌ Failed
- [ ] Validator (valid transition): ✅ Working / ❌ Failed
- [ ] Validator (invalid transition blocked): ✅ Working / ❌ Failed
- [ ] Request Logging: ✅ Enabled / ❌ Not found

## 📊 Performance Metrics (Actual Measurements)
- API Latency (p50): [X]ms (target: <400ms)
- API Latency (average of 5): [X]ms (target: <500ms)
- Database Queries per Request: [X] (target: 1)
- Correlation IDs detected: [X] (target: present in all requests)

## 🔍 Observations
[Notes about deployment, any issues, performance, stability]

## ✅ Sign-Off
- [ ] All health checks passing
- [ ] All feature tests working
- [ ] Performance targets met
- [ ] Ready for production deployment

**Approved By**: [YOUR NAME]  
**Date**: [DATE]
**Time**: [TIME]
EOF
cat STAGING-DEPLOYMENT-RESULTS.md
```

---

## 🎯 SUCCESS CRITERIA

| Check            | Target                  | Status |
| ---------------- | ----------------------- | ------ |
| Services Running | All UP                  | ✅ / ❌  |
| API Health       | ok + db connected       | ✅ / ❌  |
| Web Health       | HTTP 200                | ✅ / ❌  |
| List Endpoint    | Responds                | ✅ / ❌  |
| Latency          | <500ms                  | ✅ / ❌  |
| Queries          | 1 per request           | ✅ / ❌  |
| Logger           | Correlation IDs present | ✅ / ❌  |
| Validator        | Prevents invalid state  | ✅ / ❌  |

---

## 🔧 TROUBLESHOOTING

### Services Won't Start

**Docker Compose Issue**
```bash
# Check logs
docker-compose logs api
docker-compose logs web
docker-compose logs postgres

# Clean restart
docker-compose down
docker system prune
docker-compose up -d
```

**Local Development Issue**
```bash
# Kill existing processes
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9
lsof -i :4000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Reinstall dependencies
pnpm install

# Try again
cd apps/api && pnpm dev
```

---

### API Won't Connect to Database

```bash
# Check PostgreSQL status
docker-compose ps postgres

# Check environment variables
echo $DATABASE_URL

# Verify .env file
cat .env | grep DATABASE
```

---

### Latency Too High (>500ms)

```bash
# Check if query optimizer is active
grep -i "optimizer\|eager" apps/api/logs/combined.log

# Monitor query count
watch -n 1 'tail -1 apps/api/logs/combined.log | jq ".duration"'
```

---

## ✨ NEXT STEPS

### If All Tests Pass ✅

1. **Document Results**
   ```bash
   # Copy results to STAGING-DEPLOYMENT-RESULTS.md
   # Commit results
   git add STAGING-DEPLOYMENT-RESULTS.md
   git commit -m "docs: Staging deployment results - all tests passing"
   git push origin main
   ```

2. **Monitor For 24-48 Hours**
   - Keep services running
   - Watch error rates
   - Collect performance baseline
   - Monitor resources (CPU, memory, disk)

3. **Schedule Production**
   - If all metrics stable, proceed to production
   - See PHASE-5-DEPLOYMENT-GUIDE.md for production procedures

### If Issues Found ⚠️

1. **Investigate**
   - Review logs: `docker-compose logs -f api`
   - Check errors: `tail -f apps/api/logs/combined.log`
   - Review .env configuration

2. **Fix**
   - Update configuration if needed
   - Restart services: `docker-compose restart`
   - Re-run validation

3. **Re-test**
   - Run full test suite again
   - Document fix
   - Proceed when all pass

---

## 📞 SUPPORT

**Can't start services?**  
→ Check QUICK_REFERENCE.md for troubleshooting

**Performance issues?**  
→ See PHASE-5-DEPLOYMENT-GUIDE.md for performance tuning

**Need more help?**  
→ Check STAGING-DEPLOYMENT-CHECKLIST.md for detailed procedures

---

**Staging Deployment Execution Guide Ready**  
**Let's validate Phase 5! 🚀**
