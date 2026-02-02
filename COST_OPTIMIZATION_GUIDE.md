# 💰 Cost Analysis & Optimization Guide

**Purpose**: Understand infrastructure costs and optimize spending  
**Review Frequency**: Monthly  
**Target**: <$5K/month at scale

---

## 1️⃣ Current Cost Breakdown

### Estimated Monthly Costs

| Service | Cost | Usage | Notes |
|---------|------|-------|-------|
| **Vercel (Web)** | $25-100 | Serverless | Pro plan, auto-scaling |
| **Fly.io (API)** | $15-50 | Shared VM | 2 regions, auto-scale |
| **PostgreSQL** | $50-200 | Managed DB | Fly.io or AWS RDS |
| **Analytics** | $0-50 | Included/Datadog | Vercel free, DD paid |
| **Stripe** | 2.9% + $0.30 | Transaction fees | Per payment |
| **Storage** | $10-50 | S3/Backups | Database + file backups |
| **Monitoring** | $50-200 | Sentry + Datadog | Error tracking + APM |
| **Domain/Email** | $20-50 | DNS + SMTP | Namecheap + SendGrid |
| **CI/CD** | $0 | GitHub Actions | Free tier (3000 min/mo) |
| **Development** | $0 | IDEs + tools | GitHub Copilot optional |
| **TOTAL** | **$170-700** | Development stage | Scales with traffic |

---

## 2️⃣ Cost Estimation at Scale

### 100K Shipments/Month

```
API Requests: 300K/day
Database Size: 50GB
File Storage: 100GB
```

| Service | Daily Cost | Monthly Cost |
|---------|-----------|-----------|
| Fly.io (scaled) | $20 | $600 |
| PostgreSQL | $30 | $900 |
| Data Transfer | $5 | $150 |
| Backups (S3) | $10 | $300 |
| Monitoring | $50 | $1,500 |
| **TOTAL** | **$115** | **$3,450** |

### 1M Shipments/Month

```
API Requests: 3M/day
Database Size: 500GB
File Storage: 1TB
```

| Service | Daily Cost | Monthly Cost |
|---------|-----------|-----------|
| Fly.io (scaled 5x) | $100 | $3,000 |
| PostgreSQL (dedicated) | $200 | $6,000 |
| Data Transfer | $40 | $1,200 |
| Backups (S3) | $50 | $1,500 |
| Monitoring | $100 | $3,000 |
| **TOTAL** | **$490** | **$14,700** |

---

## 3️⃣ Cost Optimization Strategies

### A. Compute Optimization

**Fly.io Auto-scaling Configuration**:

```toml
# fly.toml
[env.production]
  [env.production.http_service]
    auto_start_machines = true
    auto_stop_machines = true
    min_machines_running = 2
    processes = ["app"]

[[services]]
  internal_port = 4000
  protocol = "tcp"
  
  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
  
  [services.tcp_checks]
    grace_period = "10s"
    interval = "15s"
    timeout = "5s"
    type = "connect"
```

**Cost Impact**: 30-40% savings by auto-shutting down idle machines

**Vercel Optimization**:

```js
// next.config.js
module.exports = {
  // Enable edge functions (cheaper than serverless)
  experimental: {
    esmExternals: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    imageSizes: [16, 32, 48, 64, 96],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
};
```

**Cost Impact**: 10-20% savings via image optimization

### B. Database Optimization

**Query Optimization**:

```sql
-- ❌ SLOW: N+1 query pattern
SELECT * FROM shipments;
-- Then for each shipment
SELECT * FROM drivers WHERE id = shipment.driver_id;

-- ✅ FAST: Use JOIN
SELECT s.*, d.name FROM shipments s
JOIN drivers d ON s.driver_id = d.id;

-- Even faster: Index
CREATE INDEX idx_shipments_driver_id ON shipments(driver_id);
```

**Cost Impact**: 50-80% reduction in query execution time = fewer DB resources

**Connection Pooling**:

```bash
# Fly.io Postgres
# Set connection limit per app instance
DATABASE_POOL_SIZE_MAX=10
DATABASE_POOL_SIZE_MIN=2
DATABASE_IDLE_TIMEOUT=600
```

**Cost Impact**: 20% savings on connection overhead

### C. Storage Optimization

**Implement Data Retention Policy**:

```javascript
// Cleanup old logs/audit data
const deleteOldRecords = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo } }
  });
  
  await prisma.tempFile.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo } }
  });
};

// Run daily
schedule.scheduleJob('0 2 * * *', deleteOldRecords);
```

**Cost Impact**: 20-30% storage savings per year

**S3 Lifecycle Policy**:

```json
{
  "Rules": [
    {
      "Id": "Archive old backups",
      "Status": "Enabled",
      "Filter": { "Prefix": "backups/" },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": { "Days": 365 }
    }
  ]
}
```

**Cost Impact**: 80% savings on old backup storage

### D. CDN & Caching

**Enable Cloudflare Free Tier**:

```bash
# Benefits:
# - Free CDN
# - Free DDoS protection
# - Free SSL
# - Page rules
# - Workers (basic)

# Setup:
# 1. Change nameservers to Cloudflare
# 2. Enable caching
#    - Browser cache: 1 hour
#    - Page cache: 30 minutes
# 3. Enable compression (gzip/brotli)
```

**Cost Impact**: Saves $200+/month on CDN costs

**Browser Caching**:

```javascript
// apps/api/src/middleware/cache.js
router.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.json(data);
});
```

**Cost Impact**: 30% reduction in API calls

### E. Monitoring Cost Reduction

**Optimize Datadog Usage**:

```javascript
// Only sample non-critical endpoints
datadogRum.init({
  sessionSampleRate: 100,          // All sessions
  sessionReplaySampleRate: 10,      // Only 10% replay
  tracePropagationTargets: [
    '^/api',
    '^/api/v[0-9]',
  ],
  allowedTracingUrls: [
    /^https:\/\/api\.example\.com/,
  ],
});
```

**Cost Impact**: 40-50% reduction in Datadog costs

**Sentry Optimization**:

```bash
# Configure quota
# - Set transaction sample rate: 10%
# - Set error sample rate: 100%
# - Filter noise: spam, 3rd party errors

# Set per-issue quotas
# - Development: 1000 events/hour
# - Production: 10000 events/hour
```

**Cost Impact**: 30-40% savings on Sentry

---

## 4️⃣ Cost Monitoring Dashboard

### GitHub Actions: Monthly Cost Report

```yaml
# .github/workflows/cost-report.yml
name: Monthly Cost Report
on:
  schedule:
    - cron: '0 0 1 * *'  # First day of month

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Generate cost estimate
        run: |
          cat > cost-report.md << 'EOF'
          # Monthly Cost Report
          
          Generated: $(date)
          
          | Service | Cost | Notes |
          |---------|------|-------|
          | Fly.io | $45 | See fly.io dashboard |
          | Vercel | $25 | See vercel.com dashboard |
          | Postgres | $75 | fly postgres pricing |
          | Datadog | $100 | Estimated from usage |
          | **TOTAL** | **$245** | | |
          EOF
      
      - name: Post to Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "📊 Monthly Cost Report\n\n$245 (within budget)",
              "blocks": [...]
            }
```

### Quarterly Budget Review

```
Q1 2026 Budget: $1,500
Q1 Actual: $875 (58% of budget)

Breakdown:
- Compute: 40% ($350)
- Database: 30% ($262)
- Monitoring: 20% ($175)
- Storage: 10% ($88)

Variance: -$625 (savings)
Forecast next quarter: $900
```

---

## 5️⃣ Cost Alerts

### Setup Cost Anomaly Detection

```bash
# Fly.io spending alert
curl -X POST https://api.fly.io/graphql \
  -H "Authorization: Bearer $FLY_API_TOKEN" \
  -d '{
    "query": "{ viewer { organizations(first: 1) { nodes { billingStatus } } } }"
  }'

# If spending > $100/day, notify #alerts
```

### Budget Limits

Set per-service budgets:

- Fly.io: $100/month limit
- Vercel: $200/month limit
- Datadog: $500/month limit
- Total: $1,500/month hard limit

---

## 6️⃣ Cost Reduction Checklist

### Quick Wins (No effort, high impact)

- [ ] Enable Vercel caching (2% savings)
- [ ] Set Fly.io auto-stop (5% savings)
- [ ] Optimize images (10% savings)
- [ ] Use Cloudflare free tier (15% savings)
- [ ] Reduce monitoring sample rates (10% savings)

**Total Quick Wins: ~40% savings = $68-280/month**

### Medium Effort (High impact)

- [ ] Implement database connection pooling (20% savings)
- [ ] Add query optimization (30% savings)
- [ ] Setup data retention policies (15% savings)
- [ ] Migrate old backups to Glacier (60% savings)

**Total Medium: ~60% savings = $102-420/month**

### Long Term (Engineering effort)

- [ ] Implement caching layer (30% savings)
- [ ] Database sharding (40% savings)
- [ ] Custom image processing (20% savings)
- [ ] Build internal CDN (50% savings)

**Total Long Term: ~80% savings = $136-560/month**

---

## 📊 Cost vs Performance Trade-off

| Strategy | Cost Reduction | Performance Impact | Effort |
|----------|---|---|---|
| Image optimization | 10% | + 20% faster | Low |
| Query optimization | 15% | + 30% faster | Low |
| Connection pooling | 20% | No change | Low |
| Caching layer | 30% | + 50% faster | Med |
| Database sharding | 40% | + 40% faster | High |
| Custom CDN | 50% | + 60% faster | Very High |

---

**Recommendation**: Start with quick wins (40% savings), implement medium effort items within 1 quarter (total 80%+), then long-term strategies as you scale.

---

**Status**: Ready to implement  
**Savings Opportunity**: $200-600/month depending on strategy  
**ROI**: Immediate
