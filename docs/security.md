# Security & Compliance

Infæmous Freight Enterprise follows enterprise-grade security principles with a
comprehensive security posture designed for SOC2 compliance and enterprise
trust.

## Security & Privacy at Infæmous Freight Enterprises

This page summarizes the SOC2-lite controls we publish for early enterprise
procurement.

**Controls in place**

- **Access Control**: RBAC (owner/admin/dispatcher/driver/viewer)
- **Authentication**: Supabase Auth (JWT, row-level security)
- **Data Isolation**: Company-scoped data (RLS enforced)
- **Encryption**: TLS in transit; encrypted storage at rest
- **Logging**: Immutable audit logs for ops, billing, AI actions
- **Billing Safety**: Stripe-managed PCI compliance
- **AI Governance**: Usage caps, alerts, hard stops

**Availability & Disaster Recovery**

- Multi-region cloud infrastructure
- Automated database backups
- Kill switches for AI, marketplace, and checkout

**Contact**

- security@infamousfreight.com

## Security Posture Summary

### Core Principles

- **Zero Trust Architecture**: Never trust, always verify
- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege Access**: Users and systems have minimum required
  permissions
- **Audit Everything**: Complete audit trails for compliance and forensics
- **Human-in-the-Loop**: Critical AI decisions require human approval
- **Secure by Default**: Security built-in, not bolted-on

### Key Security Features

- ✅ JWT-based authentication with refresh token rotation
- ✅ Scope-based authorization with fine-grained permissions
- ✅ Rate limiting on all API endpoints (general, auth, billing, AI)
- ✅ Input validation and sanitization on all user inputs
- ✅ Secure secret management (never committed to source control)
- ✅ Database encryption at rest and in transit
- ✅ Regular security audits with CodeQL
- ✅ Container security scanning with Trivy
- ✅ Dependency vulnerability scanning with Dependabot
- ✅ SOC2-ready architecture and controls

## Authentication and Authorization

### Authentication Flow

```
User Login → Credentials Validation → JWT Token Generation → Token Storage (HttpOnly Cookie)
                                              ↓
                                    Access Token (15 min TTL) + Refresh Token (7 day TTL)
                                              ↓
                                    Subsequent Requests → Token Validation → Authorize
```

### JWT Token Structure

**Access Token Payload:**

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "scopes": ["dispatch:read", "dispatch:write", "ai:command"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Scope-Based Authorization

Every API endpoint enforces specific scopes:

| Scope            | Description                 | Granted To                 |
| ---------------- | --------------------------- | -------------------------- |
| `dispatch:read`  | View dispatch information   | All users                  |
| `dispatch:write` | Modify dispatch assignments | Dispatchers, Admins        |
| `ai:command`     | Interact with AI agents     | Authenticated users        |
| `fleet:read`     | View fleet information      | Fleet managers, Admins     |
| `fleet:write`    | Modify fleet data           | Fleet managers, Admins     |
| `billing:read`   | View billing information    | Billing team, Admins       |
| `billing:write`  | Modify billing data         | Billing team, Admins       |
| `admin:*`        | Full administrative access  | System administrators only |

**Example Enforcement:**

```javascript
// Route requires specific scope
router.post(
  "/ai/command",
  authenticate, // Verify JWT token
  requireScope("ai:command"), // Check scope permission
  auditLog, // Log access
  handleCommand, // Execute
);
```

## Rate Limiting

### Rate Limit Tiers

All API endpoints are protected by rate limiting to prevent abuse:

| Endpoint Type  | Rate Limit   | Window     | Notes                  |
| -------------- | ------------ | ---------- | ---------------------- |
| General API    | 100 requests | 15 minutes | Most endpoints         |
| Authentication | 5 requests   | 15 minutes | Login, password reset  |
| AI Commands    | 20 requests  | 1 minute   | AI inference endpoints |
| Billing        | 30 requests  | 15 minutes | Payment operations     |

**Response on Rate Limit Exceeded:**

```json
{
  "error": "Too many requests",
  "retryAfter": 300,
  "limit": 100,
  "remaining": 0
}
```

## Data Protection

### Encryption

**At Rest:**

- Database: AES-256 encryption on PostgreSQL
- File storage: Server-side encryption on all object storage
- Backups: Encrypted with separate keys

**In Transit:**

- TLS 1.3 for all API communications
- Certificate pinning on mobile apps
- Secure WebSocket connections (WSS) for real-time updates

### Data Classification

| Classification   | Examples                       | Storage                        | Access                    |
| ---------------- | ------------------------------ | ------------------------------ | ------------------------- |
| **Public**       | Marketing content, public docs | Unencrypted                    | Anyone                    |
| **Internal**     | Shipment data, routes          | Encrypted at rest              | Authenticated users       |
| **Confidential** | Driver PII, financial data     | Encrypted at rest + in transit | Role-based access         |
| **Restricted**   | Passwords, API keys, tokens    | Hashed/encrypted + vault       | System only, never logged |

### Sensitive Data Handling

**Never stored in logs:**

- Passwords
- API keys and secrets
- Credit card numbers
- Social Security Numbers
- Authentication tokens (full)

**Redaction in logs:**

```javascript
// Email redacted
logger.info(`User logged in: u***@example.com`);

// Token redacted
logger.info(`Token used: eyJhbG...XVCJ9 (truncated)`);
```

## Input Validation and Sanitization

### Validation Strategy

All user inputs are validated using express-validator:

```javascript
// Example validation chain
[validateString("email", "Email"), validateEmail(), handleValidationErrors];
```

### Sanitization

- **XSS Prevention**: All HTML output is escaped
- **SQL Injection**: Parameterized queries via Prisma ORM
- **Command Injection**: No shell commands with user input
- **Path Traversal**: All file paths validated and sanitized

**Sanitization Functions:**

- `sanitizeString()`: Remove dangerous characters
- `sanitizeHTML()`: Escape HTML entities
- `validateUUID()`: Ensure valid UUID format
- `sanitizePhoneNumber()`: Format and validate phone numbers

## Secret Management

### Secret Storage

**Never committed to repository:**

- ✅ All secrets in `.env` files
- ✅ `.env` files in `.gitignore`
- ✅ Example `.env.example` with dummy values
- ✅ Secrets managed in platform-specific vaults (Vercel, Render)

**Secret Rotation:**

- JWT secrets: Rotated quarterly
- API keys: Rotated after any suspected compromise
- Database passwords: Rotated annually or on staff changes

### Environment Variables

Required secrets documented in
[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).

**Critical Secrets:**

```bash
# Never expose these
DATABASE_URL=postgresql://...
JWT_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
STRIPE_SECRET_KEY=sk_live_...
```

## Audit Logging

### Audit Trail Requirements

Every security-relevant event is logged:

**Logged Events:**

- User authentication (success and failure)
- Authorization failures
- AI decisions and overrides
- Data access and modifications
- Configuration changes
- Secret access
- Rate limit violations

**Audit Log Format:**

```json
{
  "timestamp": "2025-12-28T21:00:00Z",
  "eventType": "ai:decision",
  "userId": "user-uuid",
  "action": "dispatch:assign",
  "resource": "shipment:12345",
  "outcome": "success",
  "metadata": {
    "confidence": 0.95,
    "aiRole": "dispatch-operator"
  }
}
```

**Retention:**

- Audit logs: 7 years (compliance requirement)
- Application logs: 90 days
- Security logs: Permanent

## Vulnerability Management

### Security Scanning

**Automated Scans:**

- **CodeQL**: Daily scans for code vulnerabilities
- **Trivy**: Container image scanning on every build
- **Dependabot**: Daily dependency vulnerability checks
- **SAST**: Static application security testing in CI/CD

**Manual Reviews:**

- Quarterly penetration testing
- Annual third-party security audit
- Regular code reviews with security focus

### Dependency Management

- Automated dependency updates via Dependabot
- Security advisories monitored and acted upon within 48 hours
- Critical vulnerabilities patched within 24 hours
- Lockfiles (`pnpm-lock.yaml`) committed and verified in CI

### Incident Response

**Severity Levels:**

| Severity     | Response Time | Examples                                         |
| ------------ | ------------- | ------------------------------------------------ |
| **Critical** | Immediate     | Active breach, data exposure                     |
| **High**     | 4 hours       | Exploitable vulnerability, authentication bypass |
| **Medium**   | 24 hours      | DoS vulnerability, information disclosure        |
| **Low**      | 1 week        | Minor security improvements                      |

**Incident Response Process:**

1. **Detect**: Monitoring alerts or security report
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Patch vulnerability, restore service
5. **Review**: Post-incident review and documentation
6. **Communicate**: Notify affected parties as required

## Compliance

### SOC2 Type II Readiness

**Security Controls Implemented:**

- CC6.1: Logical and physical access controls
- CC6.2: Transmission of data protection
- CC6.3: Data confidentiality protection
- CC6.6: Vulnerability management
- CC6.7: Incident management
- CC7.2: Risk assessment and mitigation

**Audit Trail:**

- All system access logged
- Change management process documented
- Security policies documented and enforced
- Regular security training for team members

### Data Privacy

**GDPR Compliance:**

- User data consent management
- Right to access personal data
- Right to deletion (data erasure)
- Data portability
- Privacy by design

**Data Retention:**

- User data: Retained while account is active + 30 days after deletion request
- Transactional data: 7 years (regulatory requirement)
- Audit logs: 7 years

## Secure Development Practices

### Security in SDLC

**Development Phase:**

- Threat modeling for new features
- Security requirements documented
- Secure coding standards enforced

**Testing Phase:**

- Security test cases
- Penetration testing for critical features
- Dependency vulnerability scanning

**Deployment Phase:**

- Security review before production deployment
- Secrets never in source code
- Container security scanning

**Operations Phase:**

- Continuous monitoring
- Regular security patching
- Incident response procedures

### Code Review Standards

**Security Checklist:**

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries (no SQL injection)
- [ ] Authentication and authorization enforced
- [ ] Sensitive data encrypted at rest and in transit
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting applied where appropriate

## Security Training

**Team Training:**

- Onboarding security training for all developers
- Quarterly security awareness training
- Incident response drills
- Secure coding workshops

**Topics Covered:**

- OWASP Top 10 vulnerabilities
- Secure authentication and authorization
- Input validation and sanitization
- Secure secret management
- Incident response procedures

## Security Contacts

**Security Team:**

- Security Lead: <security@infaemousfreight.ai>
- Incident Response: <incidents@infamousfreight.com>
- Bug Bounty: <bugbounty@infamousfreight.com>

**Responsible Disclosure:**

- Report vulnerabilities to <security@infaemousfreight.ai>
- Use PGP key (available on website) for sensitive reports
- We respond to all reports within 48 hours
- See [SECURITY.md](../SECURITY.md) for full disclosure policy

## Additional Resources

### Internal Documentation

- **[API Security Checklist](API_SECURITY_CHECKLIST.md)**: API-specific security
  controls
- **[Container Security](CONTAINER_SECURITY.md)**: Docker and container security
  practices
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)**: Secret management guide
- **[AI Boundaries](ai-boundaries.md)**: AI system security and governance

### External Standards

- **OWASP Top 10**: <https://owasp.org/www-project-top-ten/>
- **CWE Top 25**: <https://cwe.mitre.org/top25/>
- **NIST Cybersecurity Framework**: <https://www.nist.gov/cyberframework>
- **SOC2 Controls**: <https://www.aicpa.org/>

---

**Document Version:** 2.0  
**Last Updated:** December 28, 2025  
**Next Review:** March 28, 2025  
**Owner:** Security Team
