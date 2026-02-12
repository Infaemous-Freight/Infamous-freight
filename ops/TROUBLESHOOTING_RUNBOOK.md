# Troubleshooting Runbook

## Common Errors & Solutions

### Database Connection Issues

**Problem: "ECONNREFUSED 127.0.0.1:5432"**

```bash
# Solution 1: Start database
docker-compose up -d postgres

# Solution 2: Check if running
docker ps | grep postgres

# Solution 3: Verify connection string
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:5432/db
```

**Problem: "too many connections"**

```bash
# Check current connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';
"

# Increase max connections (requires restart)
# Edit postgresql.conf: max_connections = 200
```

### API Runtime Errors

**Problem: "Cannot find module '@infamous-freight/shared'"**

```bash
# Solution: Build shared package first
pnpm --filter @infamous-freight/shared build

# Then restart API
pnpm api:dev
```

**Problem: "JWT_SECRET not set"**

```bash
# Solution: Set environment variable
export JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET

# Or in .env file
echo "JWT_SECRET=your-secret-here" >> .env
```

**Problem: "Port 4000 already in use"**

```bash
# Find process using port 4000
lsof -ti:4000

# Kill process
kill -9 <PID>

# Or use different port
API_PORT=5000 pnpm api:dev
```

### Web Build Issues

**Problem: "next build fails"**

```bash
# Solution 1: Clear cache
cd apps/web
rm -rf .next node_modules
pnpm install
pnpm build

# Solution 2: Check for type errors
pnpm typecheck

# Solution 3: Check bundle size
pnpm build:analyze
```

**Problem: "ReferenceError: window is not defined"**

```bash
# Cause: Server-side code using browser APIs
# Solution: Use dynamic imports with ssr: false

import dynamic from 'next/dynamic';
const Component = dynamic(() => import('./component'), {
  ssr: false,
});
```

### Authentication Issues

**Problem: "Invalid bearer token"**

```bash
# Solution 1: Verify token format
# Should be: Bearer <token>

# Solution 2: Check JWT signature
# If JWT_SECRET changed, all tokens become invalid

# Solution 3: Generate new token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Problem: "Insufficient scope"**

```bash
# Solution: Verify user has required scope
# Edit JWT token generation to include scopes

const token = jwt.sign({
  sub: user.id,
  email: user.email,
  scopes: ['shipments:read', 'shipments:write', 'billing:read'],
}, JWT_SECRET);
```

### Rate Limiting Issues

**Problem: "Too many requests" error**

```bash
# Solution 1: Wait for window to reset (check error message)
# Default windows: auth 15min, ai 1min, billing 15min

# Solution 2: Increase limits temporarily
export RATE_LIMIT_GENERAL_MAX=500

# Solution 3: Whitelist IP (development)
# In security.js, add:
if (req.ip === '127.0.0.1') return next();
```

### Performance Issues

**Problem: "Shipment list query is slow"**

```bash
# Verify indexes exist
psql $DATABASE_URL -c "
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'shipments';
"

# Add missing index
psql $DATABASE_URL -c "
  CREATE INDEX idx_shipments_status
  ON shipments(status);
"

# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM shipments
WHERE status = 'pending'
ORDER BY createdAt DESC
LIMIT 100;
```

**Problem: "Web bundle too large"**

```bash
# Analyze bundle
cd apps/web && pnpm build:analyze

# Solutions:
# 1. Dynamic imports for heavy components
# 2. Remove unused dependencies
# 3. Tree-shake unused code

# Check what's included
npm ls recharts
npm ls stripe
```

### Testing Issues

**Problem: "Tests failing locally but passing in CI"**

```bash
# Solution: Ensure consistent environment
# 1. Use same Node version
node --version # Should match CI config

# 2. Clear Jest cache
jest --clearCache

# 3. Run with same flags as CI
NODE_ENV=test jest --coverage
```

**Problem: "Tests timeout"**

```bash
# Increase timeout in jest.config.js
testTimeout: 30000 // milliseconds

# Or in individual tests
test('...', async () => {
  // test code
}, 30000); // 30 second timeout
```

### Caching Issues

**Problem: "Cached data is stale"**

```bash
# Solution 1: Check TTL
# Default cache TTL: 300 seconds (5 mins)

# Solution 2: Manually invalidate cache
curl -X POST http://localhost:4000/api/cache/clear

# Solution 3: Disable cache for development
CACHE_DISABLED=true pnpm api:dev
```

### Email/Notification Issues

**Problem: "Reset token email not sent"**

```bash
# Solution 1: Check email provider config
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER

# Solution 2: Verify credentials
# Test SMTP connection:
telnet $SMTP_HOST $SMTP_PORT

# Solution 3: Check email logs
tail -f logs/email.log

# Solution 4: Use test provider
npm install --save-dev ethereal-email
```

### Docker Issues

**Problem: "Container won't start"**

```bash
# Check logs
docker-compose logs api

# Verify image built
docker images

# Rebuild image
docker-compose build --no-cache api

# Check port conflicts
lsof -ti:3000 -ti:4000 -ti:5432
```

## Diagnostic Commands

### Check System Health

```bash
# Database health
psql $DATABASE_URL -c "SELECT 1"

# API health
curl http://localhost:4000/api/health/detailed | jq

# Redis (if used)
redis-cli ping

# Environment variables
printenv | grep -E "DATABASE|JWT|STRIPE|API"
```

### Collect Debug Info

```bash
# Node version
node --version && npm --version

# Git status
git log --oneline -5

# Recent logs
tail -100 logs/*.log

# System resources
top
df -h
```

### Generate Support Bundle

```bash
#!/bin/bash
# Collect diagnostics for support
tar czf support-bundle-$(date +%s).tar.gz \
  .env.example \
  package.json \
  apps/api/package.json \
  apps/web/package.json \
  apps/api/jest.config.js \
  .github/workflows/ci.yml \
  logs/*.log 2>/dev/null

echo "Support bundle created: support-bundle-*.tar.gz"
```

---

## Getting More Help

1. Check GitHub issues: `github.com/MrMiless44/Infamous-freight-enterprises/issues`
2. Review documentation: `./README.md`
3. Check commit history: `git log --grep="issue you're facing"`
4. Run tests: `pnpm test` to identify problems
5. Check logs: `tail -f logs/*.log`
6. Consult runbooks: `ops/` directory

## Quick Command Reference

```bash
# Development startup
pnpm install && pnpm build && pnpm dev

# Run tests
pnpm test

# Type check
pnpm check:types

# Lint code
pnpm lint

# Database
cd apps/api && pnpm prisma:studio

# Check health
curl http://localhost:4000/api/health/detailed

# View logs
docker-compose logs -f api
```
