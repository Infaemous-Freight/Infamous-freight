# 🔒 CodeQL Security 100% Implementation

**Last Updated**: January 11, 2026

## Executive Summary

Complete security analysis framework with **7 comprehensive scanning layers**:

1. ✅ **CodeQL Analysis** - JavaScript/TypeScript security & quality queries
2. ✅ **Dependency Scanning** - npm audit + vulnerability tracking
3. ✅ **Supply Chain Security** - SBOM generation + artifact signing
4. ✅ **Secret Detection** - TruffleHog credential scanning
5. ✅ **Code Quality Metrics** - Linting, type checking, best practices
6. ✅ **Security Configuration** - Headers, CORS, rate limiting audit
7. ✅ **Automated Reporting** - SARIF + GitHub Security Dashboard

## Table of Contents

1. [Security Scanning](#security-scanning)
2. [Vulnerability Reporting](#vulnerability-reporting)
3. [Supported Versions](#supported-versions)
4. [Security Updates](#security-updates)
5. [Best Practices](#best-practices)
6. [Contact](#contact)

## Security Scanning

### CodeQL Analysis (100% Coverage)

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                   CodeQL 100% Coverage                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ├─ CORE ANALYSIS                                           │
│ │  ├─ JavaScript/TypeScript scanning                       │
│ │  ├─ Security query suite (50+ rules)                     │
│ │  ├─ Quality query suite (100+ rules)                     │
│ │  └─ Custom rules support                                 │
│ │                                                           │
│ ├─ DEPENDENCY SCANNING                                     │
│ │  ├─ npm audit (critical/high/moderate)                   │
│ │  ├─ Outdated package detection                           │
│ │  ├─ License compliance check                             │
│ │  └─ Automated updates (Dependabot)                       │
│ │                                                           │
│ ├─ SUPPLY CHAIN                                            │
│ │  ├─ SBOM generation (CycloneDX)                          │
│ │  ├─ Secret detection (TruffleHog)                        │
│ │  ├─ Artifact integrity verification                      │
│ │  └─ Build provenance tracking                            │
│ │                                                           │
│ ├─ CODE QUALITY                                            │
│ │  ├─ ESLint/TypeScript checks                             │
│ │  ├─ Type safety validation                               │
│ │  ├─ Code complexity analysis                             │
│ │  └─ Performance metrics                                  │
│ │                                                           │
│ ├─ SECURITY CONFIG                                         │
│ │  ├─ HTTP security headers                                │
│ │  ├─ CORS policy audit                                    │
│ │  ├─ Rate limiting verification                           │
│ │  └─ Authentication flow review                           │
│ │                                                           │
│ └─ REPORTING                                               │
│    ├─ GitHub Security Dashboard                            │
│    ├─ SARIF format export                                  │
│    ├─ Email notifications                                  │
│    └─ Slack integration                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Scan Schedule:**

```
┌─ PUSH TO main/develop        → Immediate CodeQL + Dependencies
├─ EVERY PULL REQUEST          → Full security checks + Code review
├─ DAILY (3 AM UTC)            → Comprehensive analysis
└─ WEEKLY (Sunday midnight)    → Deep supply chain audit
```

**Query Coverage:**

```
Security Queries (50+):
├─ Cross-Site Scripting (XSS)
├─ SQL Injection
├─ Cross-Site Request Forgery (CSRF)
├─ Broken Authentication
├─ Sensitive Data Exposure
├─ XML External Entities (XXE)
├─ Broken Access Control
├─ Using Components with Vulnerabilities
├─ Insufficient Logging & Monitoring
└─ Command Injection

Quality Queries (100+):
├─ Dead Code
├─ Unreachable Code
├─ Incorrect Operator
├─ Redundant Condition
├─ Unused Variable
├─ Missing Error Handling
├─ Resource Leak
└─ Type Safety Issues
```

**View Results:**

```
Repository → Security → Code scanning → Filter by status/severity
https://github.com/MrMiless44/Infamous-freight-enterprises/security/code-scanning
```

### Dependency Vulnerability Management

**Automated Scanning:**

```bash
# Every push/PR runs:
pnpm audit --audit-level=moderate

# Weekly deep scan:
pnpm audit --full

# License compliance:
pnpm licenses
```

**Severity Response:**

| Severity | Action | Timeline | Block Merge? |
|----------|--------|----------|--------------|
| 🔴 Critical | Immediate response team | 1 hour | ✅ YES |
| 🟠 High | Fix + test + deploy | 24 hours | ✅ YES |
| 🟡 Moderate | Plan fix | 1 week | ❌ NO |
| 🔵 Low | Track in backlog | 30 days | ❌ NO |

**Dependabot Auto-Merge:**

- ✅ Patch updates (1.0.0 → 1.0.1)
- ✅ Minor security updates
- ❌ Major version bumps (require review)

### Supply Chain Security

**SBOM (Software Bill of Materials):**

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "version": 1,
  "components": [
    {
      "type": "library",
      "name": "@infamous-freight/shared",
      "version": "1.0.0",
      "purl": "pkg:npm/%40infamous-freight/shared@1.0.0"
    }
  ]
}
```

Generated: Automatically on each workflow run
Location: GitHub Actions artifacts
Retention: 90 days

**Secret Detection:**

- 🔍 Scans repository history
- 🔒 Detects: API keys, tokens, passwords, private keys
- ⚠️ Excludes: Test secrets in `.env.example`
- 📊 Generates report for review

**Signing & Verification:**

```bash
# Verify commit signatures (enforced for main branch)
git verify-commit <hash>

# View signature verification status
git log --show-signature --oneline -5
```

## Vulnerability Reporting

### Report Security Issues

**🚨 NEVER open public issues for security vulnerabilities**

**Use Security Advisory:**

1. Go to: `Security` → `Advisories`
2. Click: `Report a vulnerability`
3. Provide details (description, impact, steps to reproduce)
4. Attach evidence/logs

**Alternative: Direct Email**

```
security@infamous-freight.com
Subject: [SECURITY] Vulnerability in Infamous Freight
```

### Response & Disclosure Timeline

```
Day 1:  Acknowledgment email
Day 3:  Severity assessment + next steps
Day 7:  Patch development begins
Day 14: Patch available for testing
Day 21: Deploy to production
Day 28: Public disclosure (if not critical)
```

## Supported Versions

| Version | Branch | Status | Security Updates |
|---------|--------|--------|------------------|
| main | main | ✅ Supported | ✅ Yes |
| develop | develop | 🔄 Testing | ✅ Yes |
| v1.x | v1.x | 🔴 EOL | ❌ No |

**Security Patch Policy:**

- Applied to latest version immediately
- Backported to current stable branch
- Released with security advisory
- Announced in all channels

## Security Updates

### Automated Updates

**Dependabot Configuration:**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/api"
    schedule:
      interval: "daily"
    allow:
      - dependency-type: "all"
    reviewers:
      - "security-team"
    auto-merge: true  # For critical security updates
```

### Manual Update Procedure

```bash
# 1. Check for vulnerabilities
pnpm audit

# 2. Update specific package
pnpm update package-name

# 3. Run tests
pnpm test

# 4. Audit again
pnpm audit

# 5. Commit changes
git commit -am "chore: update package-name for security patch"
```

## Best Practices

### Development

**Before every commit:**

```bash
# 1. Security checks
pnpm audit --audit-level=moderate

# 2. Code quality
pnpm lint && pnpm format

# 3. Type safety
pnpm check:types

# 4. Testing
pnpm test
```

### Code Review Checklist

- [ ] No hardcoded secrets (API keys, tokens, passwords)
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] CSRF tokens for state-changing operations
- [ ] SQL injection prevention (parameterized queries)
- [ ] Proper authentication & authorization
- [ ] Error handling without exposing stack traces
- [ ] Rate limiting on sensitive endpoints
- [ ] Logging of security events
- [ ] Dependencies are up-to-date

### Deployment Security

```bash
# Pre-deployment checklist
✅ All CodeQL alerts resolved
✅ npm audit shows no critical issues
✅ All tests passing
✅ Code review approved
✅ SECURITY.md reviewed
✅ Security headers verified
✅ Rate limiting tested
✅ CORS properly configured
✅ Secrets not exposed in logs
✅ Deployment script secured
```

## Contact & Escalation

### Security Team

```
🔐 Primary: security@infamous-freight.com
🔐 On-call: security-oncall@infamous-freight.com (24/7)
🔐 GitHub: @MrMiless44 (repository owner)
```

### Escalation Path

```
CRITICAL (CVSS 9-10)
└─ Immediate notification + On-call activation
   ├─ All-hands security huddle
   ├─ Active incident response
   └─ Remediation begins within 1 hour

HIGH (CVSS 7-8)
└─ Same-day security review
   ├─ Fix prioritized for sprint
   ├─ Deployment within 24 hours
   └─ Post-incident review

MEDIUM (CVSS 4-6)
└─ Weekly security meeting
   ├─ Backlog prioritization
   ├─ Fix within 1 week
   └─ Standard deployment

LOW (CVSS 0-3)
└─ Monthly review
   ├─ Backlog item
   ├─ Fix in next sprint
   └─ Released with regular updates
```

## Resources

### Documentation

- [SECURITY.md](SECURITY.md) - This file
- [.github/workflows/codeql.yml](.github/workflows/codeql.yml) - CodeQL workflow
- [.github/codeql/codeql-config.yml](.github/codeql/codeql-config.yml) - CodeQL configuration

### GitHub Security Features

- [Security Alerts](https://github.com/MrMiless44/Infamous-freight-enterprises/security/code-scanning)
- [Dependabot](https://github.com/MrMiless44/Infamous-freight-enterprises/security/dependabot)
- [Security Advisories](https://github.com/MrMiless44/Infamous-freight-enterprises/security/advisories)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub CodeQL](https://codeql.github.com/)
- [CycloneDX SBOM](https://cyclonedx.org/)
- [CVE Database](https://cve.mitre.org/)

## SOC2-lite Compliance Controls

### Authentication & Authorization (Phase 17)

**RBAC Implementation:**

- Roles: `SHIPPER`, `DRIVER`, `ADMIN`, `SYSTEM`
- Permissions: `job:*`, `offer:*`, `payout:run`, `admin:ops`
- Files: `api/src/auth/roles.js`, `api/src/auth/authorize.js`
- Enforcement: `requirePerm()` middleware on critical endpoints

**JWT Rotation (JWKS-ready):**

- Optional JWKS validator: `api/src/auth/jwtRotation.js`
- Mounted globally, fail-open when not configured
- Populates `req.auth` for RBAC checks
- Environment: `AUTH_JWKS_URI`, `AUTH_AUDIENCE`, `AUTH_ISSUER`

### Audit Trail Integrity

**Tamper-evident Hash Chain:**

- Implementation: `api/src/lib/auditChain.js`
- Append-only log with previous hash chaining
- Automatically captures all requests via `auditLog` middleware
- Storage: Configurable via `AUDIT_LOG_DIR`, `AUDIT_LOG_FILE`
- Salt: `AUDIT_LOG_SALT` for additional entropy

**Recommended Operations:**

```bash
# View audit log
tail -f data/audit.log | jq

# Rotate logs (preserve chain)
logrotate /etc/logrotate.d/infamous-audit
```

### API Security Hardening

**Request Validation:**

- Express-validator on all write endpoints
- Zod schemas for complex payloads
- Idempotency keys via Redis: `api/src/middleware/idempotency.js`
- TTL: `IDEMPOTENCY_TTL_SECONDS` (default 900s)

**Rate Limiting:**

- Global: 100 req/15min per user
- Auth: 5 req/15min per IP
- AI: 20 req/1min per user
- Billing: 30 req/15min per user
- Payouts: Uses billing limiter + RBAC

**Security Headers:**

- Helmet with strict CSP: `api/src/middleware/securityHeaders.js`
- CSP violation reporting: `POST /api/csp-violation`
- HSTS, X-Frame-Options, X-Content-Type-Options
- Configure report endpoint: `CSP_REPORT_URI`

**CORS Policy:**

- Strict allowlist: `CORS_ORIGINS` (comma-separated)
- No wildcards in production
- Server-to-server allowed (no Origin header)

### Secrets Hygiene

**Pre-commit Hook:**

```bash
# Activate secret scanning
git config core.hooksPath .githooks

# Hook blocks commits with:
# - AWS keys, Stripe keys, JWT secrets
# - Private keys, Google API keys
# File: .githooks/pre-commit
```

**Runtime Validation:**

- Required envs checked at startup: `api/src/config/validate.js`
- Logs redact authorization headers
- Audit chain masks sensitive fields

### Incident Response

**Playbook:** See `INCIDENT_RESPONSE.md`

**Key Contacts:**

- Primary: <security@infamous-freight.com>
- On-call: <security-oncall@infamous-freight.com> (24/7)
- Escalation: Critical <1hr, High <24hr

**Detection Sources:**

- CodeQL findings
- Sentry error spikes
- Rate limit violations
- CSP violation reports
- User reports

**Monitoring Integration:**

- CSP reports → `CSP_REPORT_URI` webhook
- Auth failures → Sentry alerts
- Rate limit blocks → metrics dashboard

### Compliance Artifacts

1. **RBAC Matrix:** `api/src/auth/roles.js`
2. **Audit Logs:** `data/audit.log` (immutable)
3. **Security Headers:** Verified via SecurityHeaders.com
4. **Dependency Scan:** `pnpm audit` (daily)
5. **Secrets Scan:** Pre-commit hook + TruffleHog
6. **Incident Response:** `INCIDENT_RESPONSE.md`

### Environment Variables Reference

**Authentication:**

- `AUTH_JWKS_URI` - JWKS endpoint for JWT validation
- `AUTH_AUDIENCE` - Expected JWT audience
- `AUTH_ISSUER` - Expected JWT issuer

**Audit & Logging:**

- `AUDIT_LOG_DIR` - Directory for audit logs (default: `./data`)
- `AUDIT_LOG_FILE` - Audit log file path
- `AUDIT_LOG_SALT` - Salt for hash chain

**Security:**

- `CORS_ORIGINS` - Comma-separated allowlist (NO wildcards in prod)
- `CSP_REPORT_URI` - CSP violation webhook
- `IDEMPOTENCY_TTL_SECONDS` - Idempotency cache TTL (default: 900)

**Phase 16 (Redis/ETA):**

- `MAPBOX_ETA_CACHE_TTL_SECONDS` - Shared Redis ETA cache TTL
- `REDIS_URL` - Redis connection for cache + queues

---

**Status**: ✅ ACTIVE - CodeQL 100% + SOC2-lite Controls  
**Last Updated**: January 15, 2026  
**Next Review**: April 15, 2026
