# Security Policy - Infæmous Freight

**Last Updated:** January 16, 2026  
**Version:** 2.0 (Phase 18)  
**Status:** Active

## Overview

This document outlines the security controls and standards implemented across Infæmous Freight's platform to meet SOC2-lite requirements.

## 1. Access Control

### 1.1 Authentication

- **JWT-based:** All API endpoints protected with JSON Web Tokens
- **Expiration:** 24-hour token lifetime with 7-day refresh token
- **Rotation-ready:** Optional JWKS support for key rotation without redeployment
- **Fallback:** Automatic validation via JWT_SECRET if JWKS not configured

### 1.2 Authorization (RBAC)

Four roles with granular permissions:

| Role | Permissions | Use Case |
|------|-------------|----------|
| SHIPPER | job:create, job:accept, offer:accept | Freight shippers booking deliveries |
| DRIVER | job:deliver, offer:respond, payout:receive | Drivers executing deliveries |
| ADMIN | admin:ops, user:manage | Operational management |
| SYSTEM | All permissions | Internal services/automation |

**Critical endpoints protected:**

- Job marketplace accept: `requirePerm("job:accept")`
- Offer acceptance: `requirePerm("offer:accept")`
- Payout operations: `requirePerm("payout:run")`
- Admin health checks: `requirePerm("admin:ops")`

### 1.3 Session Management

- No persistent sessions; token-based stateless design
- Rate limiting prevents brute force: 5 attempts per 15 minutes per IP (auth endpoints)
- Failed attempts logged and monitored

## 2. Data Protection

### 2.1 In Transit

- **TLS 1.2+:** HTTPS enforced for all API endpoints
- **Certificate pinning:** Recommended for mobile apps
- **Cipher suites:** Strong algorithms (ECDHE, AES-256-GCM)

### 2.2 At Rest

- **Sensitive fields:** Passwords hashed with bcrypt (min 12 rounds)
- **Encryption:** Customer data encrypted per column with AES-256 if required
- **Key rotation:** Keys rotated quarterly

### 2.3 Secrets Management

- **No hardcoded secrets:** All keys loaded from environment variables
- **Pre-commit scanning:** `.githooks/pre-commit` blocks commits with secrets
- **Patterns blocked:** AWS keys, Stripe keys, JWT secrets, private keys
- **Rotation:** All secrets rotatable without code changes

## 3. Audit & Logging

### 3.1 Immutable Audit Trail

- **Hash chaining:** SHA256 previous-hash linkage prevents tampering
- **Automatic capture:** All API requests logged with user, action, result
- **Fields captured:** method, path, status, duration, user ID, role, IP
- **TTL:** Audit logs retained for 90 days minimum
- **Verification:** `verifyJobAuditChain()` detects tampering

### 3.2 Error Tracking

- **Sentry integration:** All exceptions automatically captured
- **Profiling:** Performance traces sampled (10% by default)
- **Context:** Request ID, user, service name attached to errors
- **Alerts:** Critical errors trigger real-time notifications

## 4. Rate Limiting & DoS Protection

| Limiter | Rate | Window | Purpose |
|---------|------|--------|---------|
| General | 100 requests | 15 minutes | API baseline protection |
| Auth | 5 attempts | 15 minutes | Brute force prevention |
| AI | 20 requests | 1 minute | AI service throttle |
| Billing | 30 requests | 15 minutes | Payment operation protection |
| Export | 5 requests | 1 hour | Heavy query protection |

## 5. Security Headers

All responses include:

```
Content-Security-Policy: default-src 'self'; report-uri /api/csp-violation
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 6. CORS Policy

- **Allowlist:** Configured via `CORS_ORIGINS` (comma-separated list)
- **No wildcards:** All origins explicitly enumerated in production
- **Server-to-server:** Internal requests allowed when Origin header absent
- **Credentials:** CORS credentials disabled for unauthenticated endpoints

## 7. Incident Response

**Contact:** <security@infamous-freight.com> (critical), <security-oncall@infamous-freight.com> (24/7)

**Response time SLAs:**

- Critical (CVSS 9-10): Response within 1 hour
- High (CVSS 7-8): Response within 24 hours
- Medium (CVSS 4-6): Response within 72 hours
- Low (CVSS 0-3): Response within 2 weeks

See [INCIDENT_RESPONSE.md](../INCIDENT_RESPONSE.md) for detailed procedures.

## 8. Compliance

### 8.1 Standards

- SOC2-lite: Implemented
- OWASP Top 10: Controls address all categories
- NIST Cybersecurity Framework: Aligned

### 8.2 Certifications

- HTTPS/TLS: ✅ A+ rating (SecurityHeaders.com)
- HSTS: ✅ Preload eligible
- Code scanning: ✅ GitHub CodeQL (100% issues fixed)

## 9. Monitoring & Alerts

### 9.1 Operational Monitoring

- **Health endpoints:** `/healthz`, `/readyz`, `/api/status` for ops dashboards
- **Worker heartbeat:** Redis-backed liveness checks (30-second TTL)
- **Queue monitoring:** BullBoard dashboard at `/ops/queues`

### 9.2 Security Monitoring

- **Failed auth:** Logged and monitored (trigger after 10 failures/hour)
- **Rate limit breaches:** Tracked per category
- **CSP violations:** Reported to `/api/csp-violation` webhook
- **Sentry:** Real-time error alerts for P0/P1 issues

## 10. Change Management

All changes follow:

1. Code review (2+ approvers for security)
2. Automated tests (>80% coverage)
3. Security scanning (CodeQL, dependency audit)
4. Staging verification (all critical changes)
5. Audit trail (git commits signed, all deployments logged)

## 11. Vendor & Dependency Management

- **Weekly audits:** `pnpm audit` runs in CI/CD
- **Vulnerability scanning:** GitHub Dependabot enabled
- **Direct dependencies:** <50, regularly reviewed
- **Removal:** Unused packages removed quarterly

## 12. Review Cycle

This policy is reviewed **quarterly** and updated as needed.

**Next Review Date:** April 16, 2026

---

**Approval:**  
Santorio Djuan Miles (Chief Architect)  
Date: January 16, 2026
