# Cloudflare Global + Origin API Integration Runbook

**Infamous Freight Enterprises** | Phase 9 Infrastructure Enhancement

---

## 📋 Table of Contents

1. [Quick Start (5 min)](#quick-start)
2. [Detailed Setup (30 min)](#detailed-setup)
3. [Validation & Testing](#validation)
4. [Operational Runbook](#operations)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Prepare Credentials (2 min)

```bash
# Get API Token from Cloudflare Dashboard:
# https://dash.cloudflare.com/profile/api-tokens
# Create token with:
# - Zone: Edit
# - Select zone: infamous-freight.com

export CLOUDFLARE_API_TOKEN="paste-your-token-here"
export CLOUDFLARE_ZONE_ID="paste-your-zone-id-here"  # Found in Zone Overview
export CLOUDFLARE_ACCOUNT_ID="paste-your-account-id"  # Profile → Account ID
```

### 2. Run Setup Script (3 min)

```bash
chmod +x cloudflare-setup.sh
./cloudflare-setup.sh setup

# Expected output:
# ✅ Cloudflare API connection successful
# ✅ Zone: infamous-freight.com
# ✅ Health check created: <id>
# ✅ DNS records created
# ✅ Setup complete!
```

### 3. Verify Configuration (1 min)

```bash
./cloudflare-setup.sh verify

# Should show load balancers, health checks, and DNS records
```

---

## Detailed Setup

### Step 1: Get Cloudflare Credentials

| What           | Where                                            | How                   |
| -------------- | ------------------------------------------------ | --------------------- |
| **API Token**  | <https://dash.cloudflare.com/profile/api-tokens>   | Create → Zone:Edit    |
| **Zone ID**    | <https://dash.cloudflare.com/infamous-freight.com> | Overview → Zone ID    |
| **Account ID** | <https://dash.cloudflare.com/profile>              | Account Settings → ID |

### Step 2: Create Load Balancer Structure

```
cloudflare-setup.sh creates:
├─ Health Checks (TCP:443, GET /api/health)
├─ Origins
│  ├─ iad-primary (api-iad.fly.dev)
│  ├─ iam-secondary (api-iam.fly.dev)
│  ├─ ord-tertiary (api-ord.fly.dev)
│  └─ las-quaternary (api-las.fly.dev)
└─ DNS Records
   ├─ api.infamous-freight.com (CNAME via LB)
   ├─ api-iad.infamous-freight.com (CNAME)
   ├─ api-iam.infamous-freight.com (CNAME)
   ├─ api-ord.infamous-freight.com (CNAME)
   └─ api-las.infamous-freight.com (CNAME)
```

### Step 3: Store Credentials in Fly.io

```bash
# Save Cloudflare credentials for API access
flyctl secrets set \
  CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
  CLOUDFLARE_ZONE_ID="$CLOUDFLARE_ZONE_ID" \
  CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
  -a infamous-freight-api

# Verify
flyctl secrets list -a infamous-freight-api
```

### Step 4: Configure Fly.io Health Endpoint

The health check endpoint (`GET /api/health`) must:

- ✅ Return 200 for healthy
- ✅ Return 503 for degraded
- ✅ Not require authentication
- ✅ Check database connectivity

Current implementation in [api/src/routes/health.js](../api/src/routes/health.js):

```javascript
router.get("/api/health", async (req, res) => {
  try {
    const health = { status: "ok", timestamp: new Date() };

    // Check DB
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json(health);
  } catch (err) {
    return res.status(503).json({ error: "Health check failed" });
  }
});
```

---

## Validation & Testing

### Test 1: Health Check Endpoints (2 min)

```bash
# Test each origin directly
for origin in api-iad.fly.dev api-iam.fly.dev api-ord.fly.dev api-las.fly.dev; do
  echo "Testing $origin..."
  curl -s "https://${origin}/api/health" | jq '.'
done

# Expected: All return { status: "ok", region: "xxx", ... }
```

### Test 2: DNS Resolution (1 min)

```bash
# Verify DNS is pointing to Cloudflare
dig api.infamous-freight.com
dig api-iad.infamous-freight.com

# Expected: Returns Cloudflare NS records
```

### Test 3: Automatic Failover (5 min)

```bash
./cloudflare-failover-test.sh quick

# Simulates:
# 1. Disables iad-primary
# 2. Tests traffic routes to secondary
# 3. Re-enables iad-primary
# 4. Verifies recovery
```

### Test 4: Full Failover Chain (10 min)

```bash
./cloudflare-failover-test.sh full

# Tests disabling each origin in sequence and verifies failover chain
```

### Test 5: Continuous Monitoring

```bash
./cloudflare-failover-test.sh monitor

# Runs continuous health checks and origin status monitoring
# Press Ctrl+C to stop
```

---

## Operations Runbook

### Daily Checks (5 min)

```bash
#!/bin/bash
# Check origin health daily

echo "✅ Checking origin health status..."

curl -s "https://api.infamous-freight.com/api/health" | jq '{
  status: .status,
  region: .region,
  database: .database,
  timestamp: .timestamp
}'

echo "✅ Checking Cloudflare LB status..."
./cloudflare-setup.sh verify | grep -A5 '"origins"'
```

### Add New Region (10 min)

```bash
# When adding a new Fly.io region (e.g., sin-singapore)

# Step 1: Ensure new region instance is running
flyctl scale count 1 -r sin -a infamous-freight-api

# Step 2: Verify health endpoint
curl -s "https://api-sin.fly.dev/api/health"

# Step 3: Add origin via API
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "origins": [{
      "name": "sin-singapore",
      "address": "api-sin.fly.dev",
      "enabled": true,
      "weight": 10
    }]
  }' | jq '.'

# Step 4: Verify via dashboard
# https://dash.cloudflare.com/infamous-freight.com/analytics/loadbalancer
```

### Maintenance Window (15 min)

```bash
# Perform maintenance on one region without downtime

REGION="iad"
ORIGIN_NAME="iad-primary"

# Step 1: Disable origin (traffic shifts to others)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  --data '{"origins": [{"name": "'${ORIGIN_NAME}'", "enabled": false}]}' | jq '.'

echo "Waiting for traffic to shift (30s)..."
sleep 30

# Step 2: Perform maintenance
flyctl restart -r "$REGION" -a infamous-freight-api

# Step 3: Re-enable origin
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  --data '{"origins": [{"name": "'${ORIGIN_NAME}'", "enabled": true}]}' | jq '.'

# Step 4: Verify health
sleep 10
curl -s "https://api-${REGION}.fly.dev/api/health" | jq '.status'
```

### Monitor Load Distribution (5 min)

```bash
#!/bin/bash
# Track which origins are handling traffic

echo "Monitoring traffic distribution (1 minute)..."

declare -A counts
for i in {1..12}; do
  REGION=$(curl -s "https://api.infamous-freight.com/api/health" | jq -r '.region')
  case "$REGION" in
    *iad*) counts[iad]=$((${counts[iad]:-0} + 1)) ;;
    *iam*) counts[iam]=$((${counts[iam]:-0} + 1)) ;;
    *ord*) counts[ord]=$((${counts[ord]:-0} + 1)) ;;
    *las*) counts[las]=$((${counts[las]:-0} + 1)) ;;
  esac
  sleep 5
done

echo "Traffic Distribution:"
for region in iad iam ord las; do
  count=${counts[$region]:-0}
  pct=$((count * 100 / 12))
  printf "  %-5s: %2d/%12 (%3d%%)\n" "$region" "$count" "$pct"
done
```

### Handle Origin Failure (Emergency)

```bash
# If one region fails (e.g., database issue in IAD)

echo "🚨 FAILURE DETECTED: Region IAD"
echo "Checking status..."

# Check what's wrong
curl -s "https://api-iad.fly.dev/api/health"

# If database is down:
echo "Attempting database recovery..."
flyctl ssh console -a infamous-freight-api
# Run: SELECT 1;

# If that fails, failover is automatic (traffic routes to iam/ord/las)
# Monitor and escalate if all regions fail

echo "✅ All traffic routed to secondary regions"
echo "Escalating to on-call for root cause analysis..."
```

---

## Troubleshooting

### Problem: Health Checks Failing

```bash
# Check origin directly
curl -v "https://api-iad.fly.dev/api/health"

# Check for TLS issues
openssl s_client -connect api-iad.fly.dev:443

# Check response format
curl -s "https://api-iad.fly.dev/api/health" | jq '.'

# Common issues:
# 1. Health endpoint returns 5xx → Fix application error
# 2. TLS handshake fails → Check certificate validity
# 3. Connection timeout → Check firewall rules
```

### Problem: DNS Not Resolving

```bash
# Check DNS propagation
dig api.infamous-freight.com +trace
dig api.infamous-freight.com @1.1.1.1

# Check Cloudflare nameservers
dig infamous-freight.com NS

# Verify in Cloudflare Dashboard:
# https://dash.cloudflare.com/infamous-freight.com/dns
```

### Problem: Traffic Not Balancing

```bash
# Check load balancer configuration
./cloudflare-setup.sh verify

# Check origin weights
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.result[].origins[] | {name, weight, enabled}'

# Verify health check results
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/health_checks" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.result[].last_check_status'
```

### Problem: Failover Not Working

```bash
# Test failover manually
./cloudflare-failover-test.sh quick

# Check failover rules
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.result[] | {fallback_pool, description}'

# Verify all origins are healthy
for origin in iad iam ord las; do
  curl -s "https://api-${origin}.fly.dev/api/health" | jq '{region: .region, status: .status}'
done
```

### Problem: API Latency Increases

```bash
# Check which region is handling traffic
curl -s "https://api.infamous-freight.com/api/health" | jq '.region'

# Monitor response times
for i in {1..10}; do
  time curl -s "https://api.infamous-freight.com/api/health" > /dev/null
done

# If slowness persists:
# 1. Check application performance logs
# 2. Check database query performance
# 3. Consider scaling that region

flyctl scale vm shared-cpu-2x -r iad -a infamous-freight-api
```

---

## API Reference

### Get Load Balancer Status

```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.'
```

### Disable Origin for Maintenance

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"origins": [{"name": "iad-primary", "enabled": false}]}'
```

### Change Origin Weight

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"origins": [{"name": "iad-primary", "weight": 50}]}'
```

### Check Health Status

```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/health_checks" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.result[] | {description, last_check_status}'
```

---

## Monitoring Dashboard

**Cloudflare Dashboard**: <https://dash.cloudflare.com/infamous-freight.com/analytics/loadbalancer>

**Monitors**:

- ✅ Origin health status
- ✅ Request distribution
- ✅ Failover events
- ✅ Response times
- ✅ SSL/TLS status

---

## Success Criteria ✅

After setup, you should have:

- [x] All origins returning 200 from `/api/health`
- [x] DNS resolving `api.infamous-freight.com` to Cloudflare LB
- [x] Traffic balancing across all enabled origins
- [x] Automatic failover when origin goes down
- [x] Recovery when origin comes back online
- [x] No manual intervention needed for failover
- [x] Monitoring visible in Cloudflare Dashboard
- [x] On-call team trained on operations

---

## Contact & Support

- **Dashboard**: <https://dash.cloudflare.com>
- **API Docs**: <https://developers.cloudflare.com/api/>
- **Fly.io CLI**: <https://fly.io/docs/reference/flyctl/>
- **Incident Channel**: #infrastructure-incidents
- **On-Call**: Use PagerDuty escalation policy

---

**Last Updated**: 2026-01-22 | **Version**: 1.0 | **Status**: 🟢 Ready for Production
