# Security Hardening Checklist

# Complete guide for production security

## ✅ Current Security Measures (Already Implemented)

### 1. Authentication & Authorization

- [x] JWT-based authentication with `authenticate()` middleware
- [x] Scope-based authorization with `requireScope()`
- [x] Token expiration and validation
- [x] Bearer token format enforcement
- [x] User context in requests (`req.user`)

### 2. Rate Limiting

- [x] General API rate limit: 100 requests/15min
- [x] Authentication endpoints: 5 requests/15min
- [x] AI commands: 20 requests/1min
- [x] Billing endpoints: 30 requests/15min
- [x] IP-based and user-based rate limiting

### 3. HTTP Security Headers

- [x] Helmet.js integration
- [x] Content Security Policy (CSP)
- [x] HSTS (HTTP Strict Transport Security)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] X-XSS-Protection
- [x] Referrer-Policy: strict-origin-when-cross-origin

### 4. Input Validation

- [x] express-validator for all inputs
- [x] String validation with max length
- [x] Email normalization and validation
- [x] Phone number validation
- [x] UUID validation for IDs
- [x] Validation error handling middleware

### 5. CORS Configuration

- [x] Strict origin validation
- [x] Environment-based allowed origins
- [x] Credentials support
- [x] Preflight request handling
- [x] 403 rejection for unauthorized origins

### 6. Error Handling

- [x] Global error handler
- [x] Sentry error tracking
- [x] Structured logging
- [x] No sensitive data in error responses
- [x] Proper HTTP status codes

### 7. Database Security

- [x] Prisma ORM (prevents SQL injection)
- [x] Parameterized queries
- [x] Connection pooling
- [x] Environment-based connection strings

### 8. Monitoring & Logging

- [x] Winston structured logging
- [x] HTTP request logging
- [x] Performance monitoring
- [x] Correlation IDs for request tracking
- [x] Audit logging for sensitive operations

## 🔒 Additional Security Enhancements

### 9. Secrets Management

**Status**: Needs configuration

```bash
# Rotate secrets regularly
JWT_SECRET=$(openssl rand -base64 32)
flyctl secrets set JWT_SECRET="$JWT_SECRET" --app infamous-freight-api

# Set encryption keys
ENCRYPTION_KEY=$(openssl rand -base64 32)
flyctl secrets set ENCRYPTION_KEY="$ENCRYPTION_KEY" --app infamous-freight-api
```

### 10. Database Encryption at Rest

**Status**: Enable in production

```bash
# Enable encryption for Postgres volumes
flyctl volumes create pg_data \
  --region iad \
  --size 10 \
  --encrypted \
  --app infamous-freight-db
```

### 11. TLS/SSL Configuration

**Status**: Automatic with Fly.io

- ✅ Fly.io provides automatic TLS certificates
- ✅ HTTPS enforced for all external traffic
- ✅ Certificate renewal handled automatically

**Verify TLS**:

```bash
curl -vI https://infamous-freight-api.fly.dev/api/health 2>&1 | grep -i "SSL\|TLS"
```

### 12. API Key Management (for external integrations)

**Implementation**: Add API key authentication for third-party integrations

```javascript
// apps/api/src/middleware/apiKey.js
const apiKey = (req, res, next) => {
  const key = req.headers["x-api-key"];
  const validKeys = (process.env.API_KEYS || "").split(",");

  if (!key || !validKeys.includes(key)) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
};

module.exports = { apiKey };
```

**Usage**:

```javascript
// In routes that need API key auth
router.get("/external/data", apiKey, authenticate, handler);
```

### 13. Request Size Limits

**Status**: Partially implemented

```javascript
// Current: express.json({ limit: '12mb' })

// Add to apps/api/src/server.js for file uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Voice route already has: limits.fileSize: 10MB
```

### 14. IP Whitelisting (Optional)

**For admin endpoints only**:

```javascript
// apps/api/src/middleware/ipWhitelist.js
const ipWhitelist = (req, res, next) => {
  const whitelist = (process.env.ADMIN_IP_WHITELIST || "").split(",");
  const clientIp = req.ip || req.connection.remoteAddress;

  if (whitelist.length && !whitelist.includes(clientIp)) {
    return res.status(403).json({ error: "IP not authorized" });
  }

  next();
};
```

### 15. Security Scanning

**GitHub Actions**: CodeQL already enabled

**Additional tools**:

```bash
# npm audit for vulnerabilities
npm audit

# Check for known vulnerabilities
npm audit fix

# Snyk for continuous monitoring
npm install -g snyk
snyk auth
snyk test
```

### 16. Dependency Security

**Status**: Needs regular updates

```bash
# Check outdated packages
npm outdated

# Update dependencies safely
npm update

# Major version updates
npm install package@latest
```

**Automation**: Add Dependabot configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/api"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
  - package-ecosystem: "npm"
    directory: "/web"
    schedule:
      interval: "weekly"
```

### 17. Session Security

**If using sessions** (currently JWT-based):

```javascript
// apps/api/src/config/session.js
const session = require("express-session");
const RedisStore = require("connect-redis")(session);

module.exports = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    maxAge: 3600000, // 1 hour
    sameSite: "strict", // CSRF protection
  },
});
```

### 18. Brute Force Protection

**Status**: Implemented via rate limiting

**Enhanced protection**:

```javascript
// apps/api/src/middleware/bruteForce.js
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many failed login attempts. Try again in 15 minutes.",
    });
  },
});
```

### 19. SQL Injection Prevention

**Status**: ✅ Protected by Prisma ORM

- Prisma uses parameterized queries
- No raw SQL in codebase (except `$queryRaw` which is safe)
- Input validation on all database operations

### 20. XSS Prevention

**Status**: ✅ Protected

- CSP headers block inline scripts
- express-validator sanitizes inputs
- React/Next.js escapes output by default
- No dangerouslySetInnerHTML usage

### 21. CSRF Protection

**Status**: JWT-based auth (stateless)

For cookie-based auth, add:

```javascript
const csrf = require("csurf");
app.use(csrf({ cookie: true }));
```

### 22. Subresource Integrity (SRI)

**For web frontend**:

```html
<!-- apps/web/pages/_document.tsx -->
<script
  src="https://cdn.example.com/script.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

### 23. Security Audits

**Regular audits**:

```bash
# Weekly security audit
npm audit

# Check for vulnerable dependencies
npm audit fix

# Run CodeQL scan
git push  # Triggers GitHub Actions CodeQL workflow
```

### 24. Backup & Disaster Recovery

**Database backups**:

```bash
# Enable automatic backups on Fly.io Postgres
flyctl postgres db backup --app infamous-freight-db

# List backups
flyctl postgres db list-backups --app infamous-freight-db

# Restore from backup
flyctl postgres db restore --backup-id <id> --app infamous-freight-db
```

### 25. Incident Response Plan

**Create**: `docs/INCIDENT_RESPONSE.md`

1. Detection (monitoring alerts)
2. Analysis (check logs, Sentry, Datadog)
3. Containment (rotate secrets, block IPs)
4. Eradication (patch vulnerabilities)
5. Recovery (restore from backups)
6. Post-mortem (document and improve)

## 🔐 Security Checklist Summary

### Critical (Must Do)

- [ ] Set strong JWT_SECRET (32+ bytes)
- [ ] Enable HTTPS only (enforced)
- [ ] Configure CORS_ORIGINS correctly
- [ ] Set up Sentry for error tracking
- [ ] Enable database backups
- [ ] Add Dependabot for dependency updates

### Important (Should Do)

- [ ] Rotate secrets every 90 days
- [ ] Set up Datadog APM monitoring
- [ ] Configure Redis for session storage
- [ ] Enable database encryption at rest
- [ ] Set up IP whitelisting for admin routes
- [ ] Regular security audits (npm audit)

### Nice to Have

- [ ] Add API key authentication for external APIs
- [ ] Implement request signing
- [ ] Set up security headers monitoring
- [ ] Add rate limit dashboard
- [ ] Implement audit log dashboard

## 📚 Security Resources

- OWASP Top 10: <https://owasp.org/www-project-top-ten/>
- Node.js Security Best Practices: <https://nodejs.org/en/docs/guides/security/>
- Express Security: <https://expressjs.com/en/advanced/best-practice-security.html>
- Fly.io Security: <https://fly.io/docs/reference/security/>

## 🚨 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email: <security@infamous-freight.com>
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## ✅ Verification Commands

```bash
# Check security headers
curl -I https://infamous-freight-api.fly.dev/api/health

# Verify TLS version
openssl s_client -connect infamous-freight-api.fly.dev:443 -tls1_3

# Test rate limiting
for i in {1..10}; do curl https://infamous-freight-api.fly.dev/api/health; done

# Check CORS
curl -H "Origin: https://evil.com" https://infamous-freight-api.fly.dev/api/health

# Audit dependencies
cd apps/api && npm audit

# Check for known CVEs
npm audit --audit-level=moderate
```
