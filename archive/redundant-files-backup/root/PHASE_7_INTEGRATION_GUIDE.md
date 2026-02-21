# Phase 7 Integration Quick Start

## Quick Start Commands

```bash
# 1. Build Terraform infrastructure
cd terraform
terraform init
terraform apply

# 2. Deploy Kubernetes
kubectl apply -f k8s/

# 3. Build shared package
pnpm --filter @infamous-freight/shared build

# 4. Start services
pnpm dev

# 5. Run load tests
k6 run k6/load-test.js
```

## Environment Setup

### .env.local (Development)

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/infamousfreight"

# Redis
REDIS_URL="redis://localhost:6379"

# Encryption
MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Stripe
STRIPE_API_SECRET=sk_test_xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# JWT
AUTH_SECRET=your-secret-key

# API
API_PORT=4000
API_BASE_URL="http://localhost:4000/api"

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"

# Features
ENABLE_GRAPHQL=true
ENABLE_WEBHOOKS=true
ENABLE_AB_TESTING=true
```

### .env.production (Deployment)

```bash
# Database (RDS endpoint from Terraform)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@$(terraform output -raw db_endpoint)/infamousfreight"

# Redis (ElastiCache from Terraform)
REDIS_URL="redis://$(terraform output -raw redis_endpoint):6379"

# Encryption (from AWS Secrets Manager)
MASTER_KEY=$(aws secretsmanager get-secret-value --secret-id infamous-freight/encryption-key --region us-east-1)

# All other endpoints pointing to production domains
```

## Phase 7 Services Integration

### 1. Enable GraphQL Endpoint

```javascript
// apps/api/index.js
const { graphqlMiddleware } = require("./services/graphql");

app.post("/graphql", authenticate, graphqlMiddleware);
```

### 2. Enable Webhook Service

```javascript
// apps/api/index.js
const webhookRoutes = require("./routes/webhooks");

app.use("/api/webhooks", webhookRoutes);
```

### 3. Enable Analytics

```javascript
// apps/api/index.js
const analyticsRoutes = require("./routes/analytics");

app.use("/api/analytics", analyticsRoutes);
```

### 4. Initialize Circuit Breaker

```javascript
// apps/api/index.js
const { manager } = require('./services/circuitBreaker');

// Wrap external API calls
const stripeBreaker = manager.get('stripe');
const result = await stripeBreaker.execute(() => stripe.charges.retrieve(...));
```

### 5. Enable Encryption at Rest

```javascript
// apps/api/services/db.js
const { DatabaseEncryptionProxy } = require("./services/encryption");
const encryption = new EncryptionService(process.env.MASTER_KEY);
const proxy = new DatabaseEncryptionProxy(encryption, EncryptedFields);

// Transparent encryption on:
// - User.email, User.phone
// - Payment.cardLastFour
// - Driver.ssn, Driver.license
// - Shipment.contacts
```

### 6. Enable A/B Testing

```javascript
// apps/api/routes/shipments.js
const { ABTestingService } = require("../services/abTesting");
const abTesting = new ABTestingService(prisma);

router.get("/shipments", async (req, res) => {
  const assignment = abTesting.assignUserToBucket(
    req.user.sub,
    "new-ui-test",
    50,
  );

  if (assignment.bucket === "treatment") {
    // Show new UI version
  } else {
    // Show control version
  }
});
```

## Monitoring & Operations

### Health Check

```bash
curl http://localhost:4000/api/health
# Expected response:
# {
#   "status": "ok",
#   "uptime": 3600,
#   "database": "connected",
#   "redis": "connected"
# }
```

### Webhook Statistics

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/webhooks/stats

# Response: { total, failed, recovered, successRate }
```

### Performance Baseline

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/analytics/performance-baseline

# Compare against actual metrics
```

### Load Testing

```bash
k6 run k6/load-test.js \
  --env API_URL=http://localhost:4000/api \
  --env JWT_TOKEN=your-test-token \
  -o csv=results.csv
```

## Common Tasks

### Export User Data (GDPR Article 15)

```javascript
const { GDPRDataExportService } = require('./services/gdprExport');
const gdpr = new GDPRDataExportService(prisma);

const export = await gdpr.requestDataExport(userId);
// Returns: JSON, CSV, PDF in email
```

### Delete User Data (GDPR Article 17)

```javascript
const result = await gdpr.requestDataDeletion(userId);
// Marks for deletion, 30-day grace period before actual removal
```

### Retry Failed Webhooks

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}' \
  http://localhost:4000/api/webhooks/retry-dead-letters
```

### Calculate Shipping Cost

```bash
POST /api/pricing/calculate
{
  "weight": 50,
  "distance": 500,
  "urgency": "express",
  "origin": "New York",
  "destination": "Los Angeles"
}

Response: {
  "baseCost": 125.50,
  "weightSurcharge": 7.50,
  "distanceCost": 75.00,
  "surgeMultiplier": 1.5,
  "totalCost": 221.50
}
```

### Optimize Routes

```bash
POST /api/routes/optimize
{
  "shipments": [...],
  "drivers": [...]
}

Response: {
  "routes": {
    "driver1": {
      "route": [...],
      "totalDistance": 245.5,
      "estimatedTime": 180
    }
  },
  "metrics": {
    "totalDistance": 1200,
    "totalTime": 900,
    "efficiency": 87.5
  }
}
```

## Troubleshooting

### GraphQL not responding

```bash
# Check if middleware is mounted
grep "graphqlMiddleware" apps/api/index.js

# Test endpoint
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ user(id: \"123\") { id email } }"}'
```

### Circuit Breaker open

```bash
# Check status
curl http://localhost:4000/api/health

# Look in logs
docker logs api-container | grep "circuit"

# Manually reset
# Call: manager.get('stripe').reset()
```

### Encryption failing

```bash
# Verify master key set
echo $MASTER_KEY

# Check encrypted fields config
grep "EncryptedFields" apps/api/services/encryption.js

# Test encryption
node -e "const { EncryptionService } = require('./apps/api/src/services/encryption'); const e = new EncryptionService(process.env.MASTER_KEY); console.log(e.encrypt('test'));"
```

## Performance Tuning

### Database

```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM shipments WHERE status = 'active';

-- Add missing indexes
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_driver_id ON shipments(driver_id);
```

### Redis

```bash
# Monitor commands
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory

# Flush if needed
redis-cli FLUSHALL
```

### Kubernetes

```bash
# Scale manually
kubectl scale deployment api-deployment --replicas=5

# Check HPA status
kubectl get hpa

# View pod logs
kubectl logs -f deployment/api-deployment
```

## Security Checklist

- [ ] HTTPS enabled (cert-manager)
- [ ] CORS configured for production domains
- [ ] Rate limits active (verify with many requests)
- [ ] Encryption keys in AWS Secrets Manager
- [ ] JWT token validation working
- [ ] Webhook signatures verified
- [ ] Audit logging enabled
- [ ] Database backup encryption confirmed
- [ ] Sensitive fields encrypted at rest
- [ ] GDPR policies enforced

## Cost Monitoring

```bash
# AWS EKS costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --filter file://filter.json

# Terraform cost estimate
terraform plan -out=plan | tfcost
```

## Deployment Pipeline

1. **Develop** - Feature branch on main repo
2. **Test** - Run `pnpm test && k6 run k6/load-test.js`
3. **Build** - `pnpm build`
4. **Container** - `docker build -t api:v1.0.0 apps/api/`
5. **Push** - `docker push registry/api:v1.0.0`
6. **Deploy** -
   `kubectl set image deployment/api-deployment api=registry/api:v1.0.0`
7. **Verify** - `kubectl rollout status deployment/api-deployment`

## Emergency Procedures

### Database Down

```bash
# Failover to read replica
# RDS automatically handles multi-AZ failover

# Manual: Point to standby
aws rds promote-read-replica --db-instance-identifier standby
```

### Redis Lost

```bash
# Restart service
docker restart redis

# Repopulate from database
node scripts/repopulate-cache.js
```

### API Pod Crash Loop

```bash
# Check logs
kubectl logs -f deployment/api-deployment

# Delete pod to restart
kubectl delete pod -l app=api

# Or rollback deployment
kubectl rollout undo deployment/api-deployment
```

---

## Support

For Phase 7 feature documentation:

- GraphQL: See `apps/api/src/services/graphql.js`
- Kubernetes: See `k8s/README.md`
- Encryption: See `ENCRYPTION.md`
- GDPR: See `GDPR_COMPLIANCE.md`
- Performance: See `PERFORMANCE_GUIDE.md`

---

_Phase 7 - 100% Complete_ ✅
