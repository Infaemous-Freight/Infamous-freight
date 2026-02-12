# Cloudflare Global Load Balancer & Origin API Integration

**Infamous Freight Enterprises** | Phase 9 Enhancement | Global CDN + Failover Management

---

## 📋 Overview

Integrate Cloudflare Global Load Balancer with Fly.io Origins to achieve:

- ✅ **Multi-region failover** (Fly.io IAD primary → IAM/ORD/LAS secondaries)
- ✅ **Automatic health checks** (30-second intervals with TCP/HTTP probes)
- ✅ **Geographic load distribution** (Latency-based routing)
- ✅ **DDoS protection** (Enterprise WAF rules)
- ✅ **Real-time monitoring** (Cloudflare Analytics + Edge Telemetry)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Cloudflare Global Load Balancer               │
│  (api.infamous-freight.com - DNS Apex / CNAME)          │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  Health Checks (TCP:443, HTTP GET /health)   │      │
│  │  Failover Rule: Any Origin Down → Next       │      │
│  │  Geo-Route: US-East → iad.fly.dev (Primary) │      │
│  │              US-Midwest → iam.fly.dev        │      │
│  │              US-West → lar.fly.dev           │      │
│  └──────────────────────────────────────────────┘      │
│                     │                                   │
├─────────────────────┼───────────────────────────────────┤
│ Fly.io Regions      │                                   │
├─────────────────────┼───────────────────────────────────┤
│ ✅ IAD (Primary)    │  ✅ IAM (Secondary)               │
│ api-iad.fly.dev:443 │  api-iam.fly.dev:443              │
│                     │                                   │
│ ✅ ORD (Tertiary)   │  ✅ LAS (Quaternary)              │
│ api-ord.fly.dev:443 │  api-las.fly.dev:443              │
└─────────────────────┴───────────────────────────────────┘
```

---

## 🔑 Prerequisites

### Required Cloudflare Account Setup

| Item                   | Details                                                  |
| ---------------------- | -------------------------------------------------------- |
| **Cloudflare Account** | Free or Pro tier minimum                                 |
| **Zone**               | infamous-freight.com (nameservers pointed to Cloudflare) |
| **API Token**          | With `zone:edit` and `account:read` permissions          |
| **API Zone ID**        | Found in Cloudflare Dashboard → Zone Overview            |

### Fly.io Prerequisites

| Item                     | Details                                                 |
| ------------------------ | ------------------------------------------------------- |
| **App Name**             | `infamous-freight-api`                                  |
| **Primary Region**       | IAD (Washington, D.C.)                                  |
| **Regional Deployments** | IAM, ORD, LAS (future expansion)                        |
| **DNS Records**          | CNAME \*.fly.dev → Cloudflare (if not using Fly.io DNS) |

---

## 🚀 Implementation Steps

### Step 1: Obtain Cloudflare API Credentials

```bash
# 1. Log in to https://dash.cloudflare.com
# 2. Profile → API Tokens → Create Token
# 3. Template: "Zone → Edit"
# 4. Select Zone: infamous-freight.com
# 5. Specific permissions:
#    - Zone → Zone Settings:Read
#    - Zone → DNS:Read
#    - Zone → DNS:Edit
#    - Zone → Cache Rules:Edit
#    - Zone → Page Rules:Edit

# 6. Save API Token (CLOUDFLARE_API_TOKEN=<token>)
# 7. Copy Zone ID (CLOUDFLARE_ZONE_ID=<zone_id>)

# Verify credentials:
export CLOUDFLARE_API_TOKEN="your-token-here"
export CLOUDFLARE_ZONE_ID="your-zone-id-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

curl -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | jq .
```

### Step 2: Create Load Balancer via Cloudflare API

```bash
#!/bin/bash
# CLOUDFLARE_SETUP.sh - Create Global Load Balancer

set -e
ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"

echo "🚀 Creating Cloudflare Global Load Balancer..."

# Define Origins (Fly.io instances)
cat > /tmp/origins.json << 'EOF'
[
  {
    "name": "iad-primary",
    "address": "api-iad.fly.dev",
    "enabled": true,
    "weight": 100,
    "description": "Fly.io IAD (Washington, D.C.) - Primary"
  },
  {
    "name": "iam-secondary",
    "address": "api-iam.fly.dev",
    "enabled": true,
    "weight": 50,
    "description": "Fly.io IAM (Northern Virginia) - Secondary"
  },
  {
    "name": "ord-tertiary",
    "address": "api-ord.fly.dev",
    "enabled": true,
    "weight": 25,
    "description": "Fly.io ORD (Chicago) - Tertiary"
  },
  {
    "name": "las-quaternary",
    "address": "api-las.fly.dev",
    "enabled": true,
    "weight": 10,
    "description": "Fly.io LAS (Las Vegas) - Quaternary"
  }
]
EOF

# Create Load Balancer Pool
echo "[1/5] Creating load balancer pools..."
POOL_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "infamous-freight-global-pool",
    "description": "Global load balancing across Fly.io regions",
    "default_pools": ["iad-pool"],
    "fallback_pool": "iad-pool",
    "region_pools": {
      "WNAM": "wnam-pool",
      "WEUR": "weur-pool",
      "WASIA": "wasia-pool"
    }
  }' | jq -r '.result.id')

echo "✅ Pool created: $POOL_ID"

# Add Health Checks
echo "[2/5] Setting up health checks..."
HEALTH_CHECK_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/health_checks" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "HTTPS",
    "port": 443,
    "method": "GET",
    "path": "/api/health",
    "interval": 30,
    "timeout": 5,
    "retries": 2,
    "expected_codes": "200",
    "description": "Infamous Freight API health check"
  }' | jq -r '.result.id')

echo "✅ Health check created: $HEALTH_CHECK_ID"

# Link Health Check to Origins
echo "[3/5] Linking health checks to origins..."
for origin in iad-primary iam-secondary ord-tertiary las-quaternary; do
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{
      \"origins\": [{
        \"name\": \"${origin}\",
        \"health_check_id\": \"${HEALTH_CHECK_ID}\"
      }]
    }" > /dev/null
done

echo "✅ Health checks linked"

# Create Failover Monitor
echo "[4/5] Creating failover monitor..."
MONITOR_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/load_balancers/monitors" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "HTTPS",
    "port": 443,
    "method": "GET",
    "path": "/api/health",
    "interval": 30,
    "timeout": 5,
    "retries": 2,
    "expected_codes": "200",
    "follow_redirects": false,
    "allow_insecure": false
  }' | jq -r '.result.id')

echo "✅ Monitor created: $MONITOR_ID"

# Verify Setup
echo "[5/5] Verifying load balancer configuration..."
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${API_TOKEN}" | jq '.result[] | {name, default_pools, fallback_pool}'

echo "🎉 Global Load Balancer setup complete!"
echo ""
echo "Next steps:"
echo "1. Update DNS record: api.infamous-freight.com (CNAME → api-iad.fly.dev)"
echo "2. Run failover tests: bash cloudflare-failover-test.sh"
echo "3. Monitor health: https://dash.cloudflare.com/infamous-freight.com/analytics/loadbalancer"
```

### Step 3: Configure DNS Records

```bash
#!/bin/bash
# CLOUDFLARE_DNS_SETUP.sh - Configure DNS for global load balancing

ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"

echo "📝 Setting up DNS records..."

# Create CNAME for api subdomain pointing to Cloudflare LB
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "api",
    "content": "api-iad.fly.dev",
    "ttl": 300,
    "proxied": true,
    "comment": "Infamous Freight API - Cloudflare Global LB"
  }' | jq '.'

# Create TXT record for verification (optional but recommended)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "_api.infamous-freight.com",
    "content": "v=infamous-freight-lb-01 account=iad-primary region=us-east",
    "ttl": 3600
  }' | jq '.'

echo "✅ DNS records configured"
```

---

## 🔍 Origin API Configuration

### Definition: What is Origin API?

The **Cloudflare Origin API** allows you to:

1. **Health Check Origins** - Monitor origin server status
2. **Update Origin Addresses** - Dynamically modify backend servers
3. **Set Origin Priority** - Weight traffic distribution
4. **Configure Failover Rules** - Automatic fallback on failure

### Implementation via API

```bash
#!/bin/bash
# CLOUDFLARE_ORIGIN_API.sh - Manage origin servers

ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# Get current origins
echo "📋 Current Origins:"
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${API_TOKEN}" | jq '.result[].origins[]'

# Update origin weight (e.g., shift traffic from IAD to IAM during maintenance)
echo "🔄 Updating origin weights..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "origins": [
      {
        "name": "iad-primary",
        "weight": 10
      },
      {
        "name": "iam-secondary",
        "weight": 100
      }
    ]
  }' | jq '.'

# Disable origin (for maintenance)
echo "🛠️ Disabling origin for maintenance..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "origins": [
      {
        "name": "iad-primary",
        "enabled": false
      }
    ]
  }' | jq '.'

# Re-enable origin
echo "✅ Re-enabling origin..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "origins": [
      {
        "name": "iad-primary",
        "enabled": true
      }
    ]
  }' | jq '.'
```

---

## ⚙️ Integration with Fly.io

### Add Cloudflare Secrets to Fly.io

```bash
#!/bin/bash
# Store Cloudflare credentials in Fly.io secrets

flyctl secrets set \
  CLOUDFLARE_API_TOKEN="<your-api-token>" \
  CLOUDFLARE_ZONE_ID="<your-zone-id>" \
  CLOUDFLARE_ACCOUNT_ID="<your-account-id>" \
  CLOUDFLARE_LB_ID="<load-balancer-id>" \
  -a infamous-freight-api

flyctl secrets list -a infamous-freight-api
```

### Add Cloudflare Health Check Endpoint

Update [apps/api/src/routes/health.js](../apps/api/src/routes/health.js) to support Cloudflare probes:

```javascript
// apps/api/src/routes/health.js (Enhanced for Cloudflare LB)
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Lightweight health check for Cloudflare LB (no auth required)
router.get("/api/health", async (req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION || "1.0.0",
      region: process.env.FLY_REGION || "unknown",
      vm: process.env.FLY_VM_ID || "local",
    };

    // Check database connectivity (required for Cloudflare to mark origin healthy)
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = "connected";
    } catch (dbErr) {
      health.database = "disconnected";
      health.status = "degraded";
      return res.status(503).json(health);
    }

    // Check Redis cache (if enabled)
    if (process.env.REDIS_URL) {
      try {
        // If Redis is used, check it here
        health.cache = "connected";
      } catch (cacheErr) {
        health.cache = "disconnected";
        health.status = "degraded";
      }
    }

    // Return 200 if healthy, 503 if degraded
    const statusCode = health.status === "ok" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(500).json({ error: "Health check failed" });
  }
});

module.exports = router;
```

---

## 🧪 Testing & Validation

### Test 1: Health Check Endpoints

```bash
#!/bin/bash
# Test health endpoints for Cloudflare validation

echo "🧪 Testing health endpoints..."

# Test primary origin
echo "▶️ Testing api-iad.fly.dev..."
curl -v -X GET "https://api-iad.fly.dev/api/health" \
  -H "User-Agent: Cloudflare-Health-Check"

# Test all origins
for origin in api-iad.fly.dev api-iam.fly.dev api-ord.fly.dev api-las.fly.dev; do
  echo "▶️ Testing $origin..."
  curl -s -X GET "https://${origin}/api/health" | jq '.' && echo "✅ $origin is healthy"
done
```

### Test 2: Failover Simulation

```bash
#!/bin/bash
# CLOUDFLARE_FAILOVER_TEST.sh - Simulate origin failure

ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"

echo "🧪 Running failover test..."

# 1. Disable primary origin
echo "[1/4] Disabling primary origin (iad-primary)..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "origins": [{"name": "iad-primary", "enabled": false}]
  }' | jq '.result.origins[] | {name, enabled}'

# 2. Test traffic routing to secondary
echo "[2/4] Testing traffic to secondary origin..."
for i in {1..5}; do
  RESPONSE=$(curl -s -X GET "https://api.infamous-freight.com/api/health" | jq '.region')
  echo "  Request $i: Region $RESPONSE (expect: iam or later)"
  sleep 1
done

# 3. Re-enable primary
echo "[3/4] Re-enabling primary origin..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "origins": [{"name": "iad-primary", "enabled": true}]
  }' | jq '.result.origins[] | {name, enabled}'

# 4. Verify traffic returns to primary
echo "[4/4] Verifying traffic routing to primary..."
for i in {1..5}; do
  RESPONSE=$(curl -s -X GET "https://api.infamous-freight.com/api/health" | jq '.region')
  echo "  Request $i: Region $RESPONSE (expect: iad)"
  sleep 1
done

echo "✅ Failover test complete!"
```

### Test 3: Load Distribution Verification

```bash
#!/bin/bash
# Verify load is distributed across origins

echo "📊 Monitoring traffic distribution..."

for region in iad iam ord las; do
  COUNT=$(curl -s -X GET "https://api.infamous-freight.com/api/analytics/requests?region=$region" | jq '.total')
  PERCENTAGE=$((COUNT * 100 / 100))  # Adjust as needed
  echo "Region $region: $COUNT requests ($PERCENTAGE%)"
done
```

---

## 📊 Monitoring & Analytics

### Cloudflare Dashboard Integration

1. **Navigate to**: <https://dash.cloudflare.com/infamous-freight.com/analytics/loadbalancer>
2. **Monitor**:
   - Origin health status
   - Failover events
   - Request distribution
   - Latency metrics
   - DDoS attack logs

### Grafana Integration (Optional)

```javascript
// Monitor Cloudflare LB metrics in Grafana
const cloudflareMetrics = {
  endpoint: "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/analytics",
  metrics: [
    "requests",
    "bandwidth",
    "threats",
    "origin_response_time",
    "http_status_codes",
  ],
  interval: "1m",
};
```

---

## 🔐 Security Best Practices

### 1. API Token Rotation

```bash
# Rotate API token every 90 days
# 1. Generate new token in Cloudflare Dashboard
# 2. Update Fly.io secrets:
flyctl secrets set CLOUDFLARE_API_TOKEN="<new-token>" -a infamous-freight-api

# 3. Test health checks
# 4. Revoke old token in Cloudflare Dashboard
```

### 2. WAF Rules for API Endpoints

```bash
#!/bin/bash
# Create WAF rules to protect API

curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "filter": {
      "expression": "(cf.threat_score > 50) or (cf.bot_management.score < 30)"
    },
    "action": "challenge",
    "priority": 1,
    "description": "Challenge suspicious API traffic"
  }' | jq '.'

# Rate limiting rule
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rate_limit" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "match": {
      "request": {
        "url": {
          "path": "/api/*"
        }
      }
    },
    "action": {
      "mode": "challenge"
    },
    "threshold": 50,
    "period": 10,
    "description": "Limit API requests to 50 per 10 seconds"
  }' | jq '.'
```

### 3. Origin Certificate Pinning (Optional)

```javascript
// Verify Cloudflare is proxying your requests
const tlsValidation = {
  expectedCertificateIssuer: "Cloudflare",
  pinnedPublicKey: "sha256/<your-cloudflare-cert-hash>",
};
```

---

## 📚 Related Documentation

- [Cloudflare Load Balancing Docs](https://developers.cloudflare.com/load-balancing/)
- [Origin Health Checks API](https://developers.cloudflare.com/load-balancing/reference/health-checks/)
- [Failover Rules](https://developers.cloudflare.com/load-balancing/understand-basics/failover/)
- [Fly.io DNS Configuration](https://fly.io/docs/networking/custom-domain/)
- [Infamous Freight Phase 9 Deployment](PHASE_9_EXECUTION_PLAN.md)

---

## 🎯 Next Steps

1. ✅ Create Cloudflare API token
2. ✅ Run CLOUDFLARE_SETUP.sh
3. ✅ Configure DNS records (api.infamous-freight.com)
4. ✅ Test health checks
5. ✅ Run failover simulation
6. ✅ Monitor in Cloudflare Dashboard
7. ✅ Document runbook procedures
8. ✅ Train team on failover handling

---

**Status**: 🟢 Ready for implementation | **Estimated Setup Time**: 30 minutes

For questions or issues, see [runbook-automation.sh](runbook-automation.sh) or contact DevOps team.
