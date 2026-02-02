# Deployment Runbook - Infamous Freight Enterprises

**API**: `https://infamous-freight-api.fly.dev`  
**Status**: Production (Fly.io iad region)  
**Last Deployed**: December 16, 2025

---

## Quick Start

### Health Check

```bash
curl https://infamous-freight-api.fly.dev/api/health
```

Expected response:

```json
{
  "uptime": 3600,
  "timestamp": 1702756800000,
  "status": "ok",
  "database": "connected"
}
```

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [x] All tests pass locally: `pnpm test`
- [x] Code coverage meets threshold: `pnpm test:coverage` (API ≥50% in CI, ≥75% locally)
- [x] Linting passes: `pnpm lint`
- [x] TypeScript compiles: `pnpm check:types` (web + shared)
- [x] Shared package built: `pnpm --filter @infamous-freight/shared build`
- [x] Git branch is clean: `git status` (no uncommitted changes)
- [x] Pull request reviewed and approved
- [x] CI pipeline passed on GitHub Actions

---

## Deployment Steps

### 1. Configure Environment Secrets (One-time)

Set required secrets in Fly.io:

```bash
# Install flyctl if needed
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"

# Login to Fly.io
flyctl auth login

# Set required secrets
flyctl secrets set \
  JWT_SECRET="your-32-char-secret-here" \
  DATABASE_URL="postgresql://user:pass@host:5432/db" \
  CORS_ORIGINS="https://web.app.com"

# Optional: Set AI provider secrets
flyctl secrets set AI_PROVIDER="openai"
flyctl secrets set OPENAI_API_KEY="sk-..."

# Optional: Enable Sentry monitoring
flyctl secrets set SENTRY_DSN="https://key@sentry.io/12345"
```

**Verify secrets are set**:

```bash
flyctl secrets list -a infamous-freight-api
```

### 2. Deploy from Repository Root

```bash
cd /path/to/Infamous-freight-enterprises

# Deploy to Fly.io
flyctl deploy --remote-only
```

**What happens during deploy**:

1. Validates `fly.toml` configuration
2. Builds Docker image (multi-stage Alpine + Node 22)
3. Compiles shared package (`@infamous-freight/shared`)
4. Installs dependencies with pnpm
5. Copies API and Prisma schema
6. Pushes image to Fly.io registry
7. Stops old machines
8. Starts new machines with fresh image

**Expected output**:

```
==> Verifying app config
✓ Configuration is valid

==> Building image
[+] Building 60.0s (25/25) FINISHED

==> Releasing machines
  Updating machine 3d8d1d66b46e08 [app]
  ✓ Machine updated successfully

==> Monitoring deployment
  ...
  v1 deployed successfully
```

### 3. Monitor Deployment

**Watch logs in real-time**:

```bash
flyctl logs -a infamous-freight-api
```

**Check machine status**:

```bash
flyctl status -a infamous-freight-api
```

Expected:

```
PROCESS ID              VERSION REGION  STATE   ROLE    CHECKS  LAST UPDATED
app     3d8d1d66b46e08  4       iad     started                 2025-12-16T19:40:08Z
```

**Check app health**:

```bash
curl https://infamous-freight-api.fly.dev/api/health
```

---

## Rollback Procedure

### Option 1: Quick Rollback (Last Deployed Version)

```bash
# Get last two deployments
flyctl releases -a infamous-freight-api -l 5

# Rollback to previous release
flyctl releases rollback -a infamous-freight-api
```

### Option 2: Manual Rollback (Specific Version)

```bash
# List available versions
flyctl releases -a infamous-freight-api

# Redeploy a specific version
flyctl releases resume <VERSION> -a infamous-freight-api
```

### Option 3: Scale Down / Restart

```bash
# Restart all machines
flyctl machines restart 3d8d1d66b46e08 -a infamous-freight-api

# Stop a machine (if needed)
flyctl machines stop 3d8d1d66b46e08 -a infamous-freight-api

# Start a machine
flyctl machines start 3d8d1d66b46e08 -a infamous-freight-api
```

---

## Troubleshooting

### Issue: Deployment Hangs

**Symptom**: `flyctl deploy` times out or freezes

**Solution**:

```bash
# Check if builder is stuck
flyctl status -a infamous-freight-api

# Cancel and retry
Ctrl+C
flyctl deploy --remote-only
```

### Issue: Machines Won't Start

**Symptom**: Machine state is `stopped` or `failing health checks`

**Diagnosis**:

```bash
# Check recent logs
flyctl logs -a infamous-freight-api --no-tail | head -50

# Check machine status
flyctl status -a infamous-freight-api
```

**Common causes**:

- Database connection string invalid → Set `DATABASE_URL` secret
- JWT_SECRET not configured → Set `JWT_SECRET` secret
- Port mismatch → Verify `Dockerfile` exposes 4000 and `fly.toml` has `PORT=4000`

**Fix**:

```bash
# Update secret (example)
flyctl secrets set DATABASE_URL="postgresql://new-url"

# Restart machine
flyctl machines restart 3d8d1d66b46e08 -a infamous-freight-api

# Monitor logs
flyctl logs -a infamous-freight-api
```

### Issue: Database Connection Errors

**Symptom**: `/api/health` returns `"status": "degraded"` and `"database": "disconnected"`

**Cause**: `DATABASE_URL` not set or invalid

**Fix**:

```bash
# Verify secret is set
flyctl secrets list -a infamous-freight-api | grep DATABASE_URL

# If missing, set it
flyctl secrets set DATABASE_URL="postgresql://..."

# Restart
flyctl machines restart 3d8d1d66b46e08 -a infamous-freight-api

# Test
curl https://infamous-freight-api.fly.dev/api/health
```

### Issue: Rate Limiting Errors (429)

**Symptom**: Requests return `429 Too Many Requests`

**Details**:

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- AI endpoints: 20 requests per 1 minute
- Billing endpoints: 30 requests per 15 minutes

**Headers to check**:

```
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702760400  # Unix timestamp
```

**Fix**: Wait until `X-RateLimit-Reset` or implement exponential backoff in client

### Issue: High Memory Usage

**Symptom**: Machine is using >800MB RAM (allocated is 1GB)

**Check process**:

```bash
flyctl ssh console -a infamous-freight-api

# Inside console
ps aux
top
```

**Potential causes**:

- Large request payload → Verify body size limits
- Memory leak in long-running process → Check logs for errors
- Database connection pool exhausted → Check active connections

**Fix**:

```bash
# Increase machine resources (if needed)
flyctl machines update 3d8d1d66b46e08 --memory 2048 -a infamous-freight-api

# Or restart to reset
flyctl machines restart 3d8d1d66b46e08 -a infamous-freight-api
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Uptime**: Should be >99%
2. **Error Rate**: Keep <1% (5xx errors)
3. **Response Time**: P95 <2s (target <500ms)
4. **Database Latency**: <100ms for typical queries

### Set Up Alerts

**Via Sentry** (if configured):

- Alert on 10+ errors in 5 minutes
- Alert on error rate increase >10%

**Via Fly.io**:

```bash
# SSH into machine to monitor
flyctl ssh console -a infamous-freight-api

# Check resource usage
free -h
df -h
ps aux --sort=-%mem
```

### Log Important Events

**Check audit trail**:

```bash
flyctl logs -a infamous-freight-api --no-tail | grep "auditLog\|critical\|error"
```

**Export logs for analysis**:

```bash
flyctl logs -a infamous-freight-api --no-tail > logs-$(date +%Y%m%d).txt
```

---

## Performance Baselines

### Expected Response Times (P95)

| Endpoint                             | Time                      |
| ------------------------------------ | ------------------------- |
| `/api/health`                        | <50ms                     |
| `GET /api/users`                     | <200ms                    |
| `GET /api/users/search` (no results) | <300ms                    |
| `POST /api/users` (create)           | <500ms                    |
| `/api/ai/command`                    | <5s (depends on provider) |

### Expected Resource Usage

| Metric      | Value                                |
| ----------- | ------------------------------------ |
| Memory      | 300-500MB (idle), up to 800MB (load) |
| CPU         | <20% (idle), <80% (load)             |
| Connections | 5-10 (idle), 20-50 (load)            |

---

## Maintenance Windows

### Recommended Schedule

- **Weekly**: Review error logs, check metrics
- **Monthly**: Run database maintenance (VACUUM, ANALYZE)
- **Quarterly**: Security audit, dependency updates

### Minimal-Downtime Updates

1. **Deploy new version** (Fly.io handles graceful shutdown)
2. **Existing requests** have 30s grace period
3. **New requests** route to new machine
4. **Total downtime**: <2 seconds

---

## Emergency Contacts

- **On-Call**: [Team Slack Channel]
- **Database Admin**: [DBA Contact]
- **Fly.io Support**: <support@fly.io>
- **Sentry Alerts**: [Email/Slack Integration]

---

## Post-Deployment Validation

After each deployment, verify:

```bash
# 1. Health check
curl https://infamous-freight-api.fly.dev/api/health
# Expected: {"status": "ok", "database": "connected"}

# 2. User list endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://infamous-freight-api.fly.dev/api/users
# Expected: {"ok": true, "users": [...]}

# 3. Search endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=test"
# Expected: {"success": true, "data": {...}}

# 4. Create user
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test"}' \
  https://infamous-freight-api.fly.dev/api/users
# Expected: 201 Created with user details
```

---

**Last Updated**: December 16, 2025  
**Maintained By**: Infamous Freight DevOps Team
