# Phase 7: Quick Deployment Guide

## 🚀 Rapid Deployment (10 Minutes)

### Prerequisites Checklist
- [x] PostgreSQL database running
- [x] Node.js 18+ installed
- [x] pnpm installed
- [ ] Environment variables configured

---

## Step 1: Environment Variables (2 min)

Add to your `.env` file:

```env
# ============================================
# Phase 7: GDPR Compliance
# ============================================
GDPR_DATA_RETENTION_DAYS=365
GDPR_BREACH_NOTIFICATION_EMAIL=privacy@infamousfreight.com

# ============================================
# Phase 7: SOC2 Compliance
# ============================================
SOC2_INCIDENT_WEBHOOK_URL=https://incidents.company.com/webhook
SOC2_MONITORING_INTERVAL_MS=300000  # 5 minutes

# ============================================
# Phase 7: Two-Factor Authentication
# ============================================
TOTP_ISSUER="Infamous Freight Enterprises"
TOTP_WINDOW=2  # Allow ±60 seconds clock skew
```

---

## Step 2: Install Dependencies (1 min)

```bash
cd apps/api
pnpm install speakeasy qrcode
```

**What this installs:**
- `speakeasy` - TOTP (Time-based One-Time Password) library
- `qrcode` - QR code generation for authenticator apps

---

## Step 3: Database Migrations (3 min)

Run the Phase 7 migrations:

```bash
cd apps/api

# Apply GDPR schema updates
pnpm prisma migrate dev --name phase7_tier2_gdpr

# Apply SOC2 schema updates
pnpm prisma migrate dev --name phase7_tier3_soc2

# Apply 2FA schema updates
pnpm prisma migrate dev --name phase7_tier4_2fa

# Generate Prisma client
pnpm prisma generate
```

**What this does:**
- Updates `UserConsent` table (GDPR fields)
- Updates `DataProcessingLog` table (legal basis tracking)
- Updates `SecurityEvent` table (SOC2 controls)
- Updates `AnomalyDetection` table (incident management)
- Updates `TwoFactorAuth` table (2FA fields)

**Verification:**
```bash
# Check if migrations applied successfully
pnpm prisma migrate status
```

Expected output: `Database schema is up to date!`

---

## Step 4: Build Shared Package (1 min)

```bash
pnpm --filter @infamous-freight/shared build
```

**Why:** Phase 7 uses shared types (`ApiResponse`, `HTTP_STATUS`)

---

## Step 5: Start Services (1 min)

```bash
# Terminal 1: Start API
cd apps/api
pnpm dev

# Terminal 2: Start Web
cd apps/web
pnpm dev
```

**Expected startup logs:**
```
✓ GDPR Compliance Service initialized successfully
✓ SOC2 Compliance Service initialized successfully
✓ Two-Factor Authentication Service initialized successfully
```

---

## Step 6: Verify Deployment (2 min)

### Test GDPR Endpoints

```bash
# Get compliance status (requires auth)
curl -X GET http://localhost:4000/api/gdpr/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

Expected Response:
{
  "success": true,
  "data": {
    "consents": 0,
    "dataExportAvailable": true,
    "erasureAvailable": true,
    "gdprCompliant": true
  }
}
```

### Test SOC2 Endpoints

```bash
# Get SOC2 status (requires admin)
curl -X GET http://localhost:4000/api/soc2/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

Expected Response:
{
  "success": true,
  "data": {
    "soc2Compliant": true,
    "controlsImplemented": 7,
    "controlsPassing": 7
  }
}
```

### Test 2FA Endpoints

```bash
# Check 2FA status (requires auth)
curl -X GET http://localhost:4000/api/2fa/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

Expected Response:
{
  "success": true,
  "data": {
    "enabled": false,
    "configured": false
  }
}
```

---

## Step 7: Web UI Verification (Optional)

1. **Cookie Consent Banner**
   - Visit: `http://localhost:3000`
   - Should see cookie consent banner at bottom
   - Test: Accept All / Reject All / Customize

2. **Privacy Dashboard**
   - Visit: `http://localhost:3000/privacy`
   - Should see GDPR dashboard
   - Test: Export data, manage consents

3. **Two-Factor Authentication Setup**
   - Visit: `http://localhost:3000/settings/security`
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - Verify with 6-digit code

---

## Troubleshooting

### Issue: "Module not found: speakeasy"

**Solution:**
```bash
cd apps/api
rm -rf node_modules
pnpm install
```

### Issue: "relation 'user_consents' does not exist"

**Solution:**
```bash
cd apps/api
pnpm prisma migrate reset  # WARNING: Deletes all data
pnpm prisma migrate dev
```

### Issue: "GDPR Compliance Service initialization failed"

**Cause:** Missing Prisma models

**Solution:**
```bash
pnpm prisma generate
pnpm dev
```

### Issue: "Invalid JWT token"

**Solution:**
Get a valid token:
```bash
# Login to get token
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## Quick Rollback (If Needed)

```bash
# Stop services
pkill -f "pnpm dev"

# Rollback migrations
cd apps/api
pnpm prisma migrate reset

# Restore previous code
git checkout main
git pull

# Restart
pnpm dev
```

---

## Health Check

After deployment, verify all services are running:

```bash
# API Health
curl http://localhost:4000/api/health

Expected: {"status":"ok","uptime":123}

# Database Connection
curl http://localhost:4000/api/health-detailed

Expected: {"status":"ok","database":"connected"}
```

---

## Production Deployment Notes

### 1. Update Environment Variables

```env
# Production values
GDPR_BREACH_NOTIFICATION_EMAIL=privacy@infamousfreight.com
SOC2_INCIDENT_WEBHOOK_URL=https://incidents.company.com/webhook
TOTP_ISSUER="Infamous Freight Enterprises"

# Enable audit logging
NODE_ENV=production
LOG_LEVEL=info
```

### 2. SSL/TLS Required

Ensure HTTPS is enabled for:
- Cookie consent (secure cookies)
- 2FA QR codes (sensitive data)
- GDPR exports (personal data)

### 3. Database Backups

Before migration:
```bash
pg_dump $DATABASE_URL > backup_pre_phase7.sql
```

### 4. Monitoring

Set up alerts for:
- Security incidents (SOC2)
- Failed 2FA attempts (>5 per user)
- GDPR data breaches
- Anomaly detections

---

## Next Steps

- [ ] Enable 2FA for admin accounts
- [ ] Test GDPR data export end-to-end
- [ ] Review SOC2 compliance report
- [ ] Train support team on privacy dashboard
- [ ] Update privacy policy with Phase 7 disclosures

---

## Support

**Issues:** Create GitHub issue with tag `phase-7`  
**Security:** Email security@infamousfreight.com  
**Privacy:** Email privacy@infamousfreight.com  

---

✅ **Phase 7 Deployment Complete!**

Your platform now has:
- ✅ GDPR Compliance (EU-ready)
- ✅ SOC2 Controls (Enterprise-ready)  
- ✅ Two-Factor Authentication (Security hardened)
- ✅ 24 Global Regions (Scale-ready)
