# Pre-Launch Security Audit Checklist

**Date**: [Launch Date - 1 Week]  
**Owner**: Security Lead  
**Status**: [ ] Not Started [ ] In Progress [x] Ready to Execute  

---

## Authentication & Authorization (30 min)

### JWT & Token Security

- [ ] JWT secret is 32+ characters, cryptographically random
- [ ] JWT expiry is appropriate (7-30 days)
- [ ] Token rotation is tested (if enabled)
- [ ] No token leakage in logs/errors
- [ ] Tokens are only sent in Authorization header
- [ ] HTTPS enforced (no HTTP)

### Scope Enforcement

- [ ] All sensitive endpoints require scopes
- [ ] Scopes are granular (not just "admin")
- [ ] Routes validate required scopes
- [ ] Default deny policy (require explicit allow)
- [ ] Scope registry documented in ROUTE_SCOPE_REGISTRY.md

### Organization Isolation

- [ ] Users can only access their organization
- [ ] Organization ID in JWT claim (org_id)
- [ ] All queries filtered by org_id
- [ ] Cross-org data access tested & blocked
- [ ] Test: Can user access different org's data? (should fail)

---

## Input Validation (30 min)

### Data Validation

- [ ] All user inputs validated (strings, emails, phones, UUIDs)
- [ ] Enum values validated against shared constants
- [ ] No SQL injection possible (Prisma handles escaping)
- [ ] Pagination: max page size enforced (e.g., 100)
- [ ] File uploads: size limit enforced (VOICE_MAX_FILE_SIZE_MB)
- [ ] Test: Try malicious inputs (SQL, XSS, etc.)

### Business Logic Validation

- [ ] Shipment dates: start < end
- [ ] Amounts: > 0, within reason (not $999,999)
- [ ] Rates: within industry standards
- [ ] Status transitions: valid state machine

---

## CORS & Headers (20 min)

### CORS Configuration

- [ ] CORS_ORIGINS set correctly (no wildcards in production)
- [ ] Only necessary origins allowed
- [ ] Credentials: true only if needed
- [ ] Preflight requests work (OPTIONS)
- [ ] Test: API call from unauthorized origin blocked

### Security Headers

- [ ] Content-Security-Policy set
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security: max-age=31536000
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin

### HTTPS

- [ ] All endpoints require HTTPS
- [ ] Certificate is valid and not expired
- [ ] Certificate renewal automated (ACME/Let's Encrypt)
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header set to 1 year

---

## Rate Limiting (20 min)

### Endpoint Protection

- [ ] General limiter: 100 requests/15 min per user
- [ ] Auth limiter: 5 requests/15 min per IP (prevents brute force)
- [ ] AI limiter: 20 requests/1 min per user
- [ ] Billing limiter: 30 requests/15 min per user
- [ ] Export limiter: 5 requests/hour per user (expensive ops)

### Testing

- [ ] Exceed limit 1x: get 429 response
- [ ] Exceed limit 5x: stays blocked until window resets
- [ ] Health check /api/health: bypass rate limiter
- [ ] Test X-RateLimit-* headers present in response

---

## Database Security (30 min)

### Credentials

- [ ] Database password is 32+ characters
- [ ] Password stored in Kubernetes secret (not code)
- [ ] Database URL uses encrypted connection (postgresql:// with SSL)
- [ ] No default credentials (postgres/postgres)
- [ ] Database user has minimal privileges (not superuser)

### Queries & Injections

- [ ] All queries use Prisma (parameterized)
- [ ] No raw SQL (unless absolutely necessary & parameterized)
- [ ] Slow queries monitored (SLOW_QUERY_THRESHOLD_MS)
- [ ] Query logs don't expose sensitive data (no passwords, tokens)

### Access Control

- [ ] Database only accessible from API (not from web)
- [ ] Network policies restrict access
- [ ] Database backups encrypted
- [ ] Backup retention appropriate (30+ days)

### Monitoring

- [ ] Failed login attempts logged
- [ ] Long-running queries tracked
- [ ] Connection count monitored
- [ ] Unusual query patterns alerted

---

## Logging & Monitoring (20 min)

### Sensitive Data

- [ ] No passwords logged
- [ ] No JWT tokens logged
- [ ] No API keys logged
- [ ] Errors don't expose stack traces to clients
- [ ] Audit logs capture: who, what, when, where, why

### Log Retention

- [ ] Application logs: 30 days
- [ ] Audit logs: 90 days (for compliance)
- [ ] Error logs: searchable in Sentry/DataDog
- [ ] Logs encrypted at rest

### Alerting

- [ ] High error rate alert (> 0.1%)
- [ ] Failed auth attempts alert (> 5 in 5 min)
- [ ] Rate limit blocks alert
- [ ] Database connection alert
- [ ] Security team notified

---

## Secrets Management (20 min)

### Secrets Storage

- [ ] .env files in .gitignore (never in git)
- [ ] Production secrets in Kubernetes Secrets or AWS Secrets Manager
- [ ] Secrets encrypted at rest
- [ ] Secrets encrypted in transit (over HTTPS/TLS)
- [ ] Secrets access audited

### Secrets Rotation

- [ ] JWT secret rotation plan documented
- [ ] Database password rotation plan documented
- [ ] API key rotation plan documented
- [ ] Rotation tested before production
- [ ] Calendar reminder for rotations set

---

## Dependency Security (20 min)

### Package Vulnerabilities

- [ ] Run `npm audit` or `pnpm audit`
- [ ] No high/critical vulnerabilities
- [ ] All dependencies have known versions (no wildcards)
- [ ] Dependencies up-to-date (within 1 minor version)
- [ ] Dependabot/Snyk enabled in GitHub

### Supply Chain

- [ ] Verify npm packages authenticity
- [ ] Use npm registry, not GitHub raw files
- [ ] Peer dependencies verified
- [ ] Dev dependencies don't bloat production image

---

## Third-Party Integrations (15 min)

### Stripe/PayPal

- [ ] API keys stored in Kubernetes Secret
- [ ] Webhook signatures verified
- [ ] Webhook URLs use HTTPS
- [ ] Sensitive data (card numbers) never stored locally
- [ ] PCI compliance: let Stripe handle payment data

### AI Services (OpenAI/Anthropic)

- [ ] API keys stored in Kubernetes Secret
- [ ] Rate limiting per user
- [ ] User inputs sanitized (no injection attacks)
- [ ] Model outputs don't leak other users' data
- [ ] Cost controls in place (prevent abuse)

### Email/SMS

- [ ] API keys stored securely
- [ ] Rate limiting on sends
- [ ] Opt-out/unsubscribe respected
- [ ] Templates don't contain sensitive data

---

## Infrastructure Security (30 min)

### Network

- [ ] Database only accessible from API pods
- [ ] API only accessible from apps/web/external clients
- [ ] Ingress rules enforce HTTPS
- [ ] Network policies defined (default deny)
- [ ] VPC/private networks used (not public)

### Container Security

- [ ] Images scanned for vulnerabilities
- [ ] No secrets in Dockerfile (use build args)
- [ ] Minimal base images (alpine, distroless)
- [ ] Non-root user in containers
- [ ] Resource limits set (CPU, memory)

### Kubernetes

- [ ] RBAC configured (least privilege)
- [ ] NetworkPolicies define allowed traffic
- [ ] PodSecurityPolicies enforced
- [ ] Secrets mounted as volumes (not env vars when possible)
- [ ] Image pull policies: IfNotPresent

---

## Deployment & CI/CD (20 min)

### Code Review

- [ ] All code reviewed before merge (pull requests)
- [ ] Security team approves security-related changes
- [ ] No secrets in commits (scan with git-secrets)
- [ ] Branch protection: require reviews, status checks

### Automated Testing

- [ ] Unit tests cover auth/validation
- [ ] Integration tests cover cross-org isolation
- [ ] Security tests cover common attacks
- [ ] Tests run in CI before deploy

### Deployment

- [ ] Deployments use container registry (not git)
- [ ] Containers signed/verified
- [ ] Blue-green deployments (zero downtime)
- [ ] Rollback tested & documented

---

## Compliance & Regulations (15 min)

### Data Protection

- [ ] GDPR: User can request/delete data
- [ ] SOC 2: Audit trails maintained
- [ ] Data residency: Stored in correct region
- [ ] Encryption: In transit (TLS) & at rest
- [ ] Data classification: Know what's sensitive

### Privacy

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] User consent for data use obtained
- [ ] No unauthorized third-party sharing
- [ ] Right to deletion implemented

---

## Testing & Validation (1 hour)

### Manual Testing

- [ ] Login with invalid credentials: fails
- [ ] Login with valid credentials: succeeds
- [ ] Access resource from different org: fails
- [ ] Exceed rate limit: gets 429
- [ ] Send malicious input: rejected
- [ ] CORS from wrong origin: rejected
- [ ] Unencrypted (HTTP) request: redirected to HTTPS

### Automated Security Testing

```bash
# Run OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.yourdomain.com

# Run npm audit
pnpm audit

# Scan with Snyk
snyk test --severity-threshold=high
```

### Penetration Testing (Optional)

- [ ] Hire external security firm (if high-security domain)
- [ ] Test for common vulnerabilities (OWASP Top 10)
- [ ] Document findings & remediation

---

## Post-Launch Monitoring (Ongoing)

### Security Metrics

- [ ] Failed auth attempts: 0-5/hour (normal)
- [ ] Rate limit blocks: < 1% of traffic
- [ ] Error rate: < 0.1%
- [ ] No 401/403 spikes
- [ ] No SQL errors (indicates injection attempt?)

### Incident Response

- [ ] Security team on-call 24/7
- [ ] Incident response plan documented
- [ ] Communication templates prepared
- [ ] Remediation procedures known
- [ ] Post-incident reviews scheduled

---

## Sign-Off

**Security Review Completed**: _______________  
**Date**: _____________  
**Issues Found**: 0 [ ] 1-5 [ ] 6-10 [ ] >10 [ ]  
**All Issues Resolved**: Yes [ ] No [ ]  
**Approved for Launch**: Yes [ ] No [ ]  

**Comments**:

```
[Add any notes, exceptions, or follow-up items]
```

**Security Lead**: _____________________  
**Date**: _________________  
**Next Review**: [30 days post-launch]

---

## Common Findings & Remediation

| Issue | Risk | Fix | Priority |
|-------|------|-----|----------|
| Missing HTTPS | Critical | Enable TLS everywhere | P0 |
| No rate limiting | High | Implement rate limiters | P1 |
| Hardcoded secrets | Critical | Move to Kubernetes Secrets | P0 |
| No audit logs | High | Add logging middleware | P1 |
| Overly permissive CORS | Medium | Restrict to known origins | P2 |
| Unvalidated input | High | Add validators to all endpoints | P1 |

---

**Reference Documentation**:

- [ENV_SETUP_SECRETS_GUIDE.md](ENV_SETUP_SECRETS_GUIDE.md)
- [docs/CORS_AND_SECURITY.md](docs/CORS_AND_SECURITY.md)
- [docs/ROUTE_SCOPE_REGISTRY.md](docs/ROUTE_SCOPE_REGISTRY.md)
- [OWASP Top 10](https://owasp.org/Top10/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

**Last Updated**: 2026-01-22  
**Status**: Ready for Production Launch  
**Owner**: Security Team
