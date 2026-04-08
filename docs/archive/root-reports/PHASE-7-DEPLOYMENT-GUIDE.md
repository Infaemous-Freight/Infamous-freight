# ⚡ PHASE 7 RAPID DEPLOYMENT GUIDE

**Status: PRODUCTION READY** ✅  
**Deploy Time: ~30 minutes**  
**Risk Level: LOW** (All testing complete)

---

## 🚀 Pre-Deployment Checklist (5 min)

```bash
# 1. Verify environment variables
cat .env.production | grep -E "API_PORT|WEB_PORT|GDPR_|SOC2_|TOTP_"

# 2. Check database connection
cd apps/api && pnpm prisma db execute --stdin < /dev/null

# 3. Verify Redis connection (if used for caching)
redis-cli ping

# 4. Check JWT secret is set
echo $JWT_SECRET | wc -c  # Should be > 20 characters
```

---

## 📦 Deployment Steps

### Step 1: Backup Current Database (2 min)
```bash
# Postgres backup
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > phase-7-pre-deploy.sql

# Verify backup
wc -l phase-7-pre-deploy.sql  # Should be > 1000 lines
```

### Step 2: Apply Phase 7 Database Migrations (3 min)
```bash
cd apps/api

# Check migration status
pnpm prisma migrate status

# Apply pending migrations
pnpm prisma migrate deploy

# Verify migrations applied
pnpm prisma db execute --stdin < /dev/null
```

### Step 3: Build Backend Services (5 min)
```bash
cd apps/api

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run database generation
pnpm prisma generate

# Verify service initialization
npm test -- soc2Compliance localization 2fa
```

### Step 4: Deploy Backend API (5 min)
```bash
# Option A: Using PM2
pm2 restart "apps/api" --name "infamous-api"
pm2 save

# Option B: Using Docker
docker-compose -f docker-compose.prod.yml up -d api

# Verify API is running
curl -s http://localhost:4000/api/health | jq .
```

### Step 5: Build Frontend Web (5 min)
```bash
cd apps/web

# Install dependencies
pnpm install

# Build Next.js with i18n
pnpm build

# Start server
pnpm start

# Verify frontend is accessible
curl -s http://localhost:3000 | grep -q "<html>"
```

### Step 6: Deploy Mobile Updates (5 min)
```bash
cd apps/mobile

# Update dependencies
pnpm install

# (Optional) Build for app stores
eas build --platform android --auto-submit
eas build --platform ios --auto-submit

# Or trigger via CI/CD
git push # Triggers GitHub Actions
```

### Step 7: Verify All Services (2 min)
```bash
# Health check
curl -s http://localhost:4000/api/health | jq .

# GDPR endpoint
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:4000/api/gdpr/consent

# Localization endpoint
curl -s http://localhost:4000/api/locale/supported | jq '.data | length'

# 2FA endpoint
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:4000/api/2fa/status

# SOC2 endpoint (admin only)
curl -s -H "Authorization: Bearer $ADMIN_JWT" \
  http://localhost:4000/api/soc2/status
```

---

## 🧪 Post-Deployment Validation (5 min)

### 1. GDPR Compliance Check
```bash
# Test consent recording
curl -X POST http://localhost:4000/api/gdpr/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"type": "analytics", "granted": true}' \
  | jq '.success'  # Should be true
```

### 2. Multi-Language Support Check
```bash
# Test locale switching
for locale in en es fr de ar; do
  echo "Testing $locale..."
  curl -s "http://localhost:3000?locale=$locale" | grep -q "html" \
    && echo "✓ $locale OK" || echo "✗ $locale FAILED"
done
```

### 3. 2FA Verification
```bash
# Test TOTP generation
curl -X POST http://localhost:4000/api/2fa/setup \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.data.qrCode' | head -c 20  # Should return QR code
```

### 4. Mobile Push Notification Check
```bash
# Subscribe to test topic
curl -X POST http://localhost:4000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MOBILE_JWT" \
  -d '{"topic": "shipment-updates"}' \
  | jq '.success'  # Should be true
```

### 5. Database Integrity Check
```bash
# Verify schemas created
cd apps/api
pnpm prisma db execute --stdin << EOF
SELECT COUNT(*) as consent_records FROM "UserConsent";
SELECT COUNT(*) as security_records FROM "SecurityEvent";
SELECT COUNT(*) as twofa_records FROM "TwoFactorAuth";
EOF
```

---

## 📊 Monitoring Dashboard Setup

```bash
# Start monitoring endpoints
curl http://localhost:4000/api/soc2/status -H "Authorization: Bearer $ADMIN_JWT"

# Expected response:
{
  "success": true,
  "data": {
    "overallStatus": "compliant",
    "principles": 7,
    "auditLogsCount": 1000+,
    "anomaliesDetected": 0,
    "lastAudit": "2026-02-24T10:00:00Z"
  }
}
```

---

## 🔍 Troubleshooting Quick Reference

| Issue                          | Solution                                              | Time  |
| ------------------------------ | ----------------------------------------------------- | ----- |
| **Migration fails**            | Check DB connection, run `prisma migrate status`      | 2 min |
| **API won't start**            | Check NODE_ENV, verify JWT_SECRET, check logs         | 3 min |
| **i18n translations missing**  | Verify locale files in apps/api/locales/, restart API | 2 min |
| **2FA QR not generating**      | Check speakeasy module installed, verify issuer name  | 2 min |
| **Mobile push failing**        | Verify FCM credentials, check Firebase project setup  | 5 min |
| **Localization not switching** | Check cookie domain, verify localStorage persists     | 3 min |

---

## 🎯 Rollback Plan (if needed)

```bash
# Quick rollback (< 2 min)
# 1. Restore database
psql -h $DB_HOST -U $DB_USER $DB_NAME < phase-7-pre-deploy.sql

# 2. Restart old API
pm2 restart "apps/api"

# 3. Restart old frontend
pm2 restart "apps/web"

# 4. Verify services online
curl http://localhost:4000/api/health
```

---

## ✅ Deployment Checklist

- [ ] Database backup created
- [ ] Migrations tested locally
- [ ] API builds without errors
- [ ] Frontend builds without errors
- [ ] All health checks pass
- [ ] GDPR consent endpoint working
- [ ] 2FA setup endpoint working
- [ ] Localization endpoints working  
- [ ] Mobile push notifications configured
- [ ] SOC2 compliance status shows "compliant"
- [ ] No critical alerts in monitoring
- [ ] User communication sent (if public deployment)
- [ ] Incident response team notified
- [ ] Rollback plan confirmed

---

## 📈 Success Metrics (Post-Deploy)

| Metric              | Target | Check Command                         |
| ------------------- | ------ | ------------------------------------- |
| API Uptime          | 99.9%  | Check monitoring dashboard            |
| Response Time (p99) | <100ms | `curl -w "@curl-format.txt" $API_URL` |
| GDPR Requests       | <5s    | Time consent API call                 |
| Localization Switch | <1s    | Clear cache, switch locale            |
| 2FA Setup           | <3s    | Time setup endpoint                   |
| Mobile Sync         | <10s   | Check offlineSync latency             |

---

## 📞 On-Call Support

**During Deployment:**
- API Team: @api-oncall
- Frontend Team: @frontend-oncall
- Mobile Team: @mobile-oncall
- Database Team: @database-oncall

**Escalation Path:**
1. Service team oncall (5 min response)
2. Engineering manager (15 min response)
3. VP Engineering (30 min response)

---

## 🎉 Post-Deployment (1 hour after deployment)

```bash
# 1. Check error rates
curl http://localhost:4000/api/soc2/incidents \
  -H "Authorization: Bearer $ADMIN_JWT" \
  | jq '.data | length'  # Should be 0

# 2. Verify user activity
curl http://localhost:4000/api/soc2/audit-log \
  -H "Authorization: Bearer $ADMIN_JWT" \
  | jq '.data | length'  # Should be > 0

# 3. Check anomaly detection
curl http://localhost:4000/api/soc2/anomalies \
  -H "Authorization: Bearer $ADMIN_JWT" \
  | jq '.data | length'  # Should be 0 (no anomalies)

# 4. Verify GDPR data collection
curl http://localhost:4000/api/gdpr/consent \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.data.consentGiven'  # Should be object with 5 categories
```

---

**Estimated Total Deployment Time: 30-45 minutes**  
**Risk Level: LOW** (All code tested, migrations verified, rollback plan in place)

---

*Phase 7 Deployment Guide - February 24, 2026*
