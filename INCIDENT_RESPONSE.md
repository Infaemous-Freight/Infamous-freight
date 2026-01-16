# Incident Response Outline (SOC2-lite)

Purpose: Provide a practical, repeatable process to triage, contain, and remediate security incidents.

## 1. Detection & Triage
- Sources: Monitoring alerts, Sentry errors, CodeQL findings, user reports
- Classify severity: Critical, High, Medium, Low
- Assign incident lead and create a secure channel (private Slack + issue in security advisories)

## 2. Containment
- Disable affected endpoints or rotate credentials if necessary
- Increase rate limits and enable strict CORS if abuse suspected
- Snapshot logs (audit chain in `data/audit.log`) and relevant systems

## 3. Eradication
- Identify root cause (vuln, misconfig, dependency issue)
- Apply patch, update dependencies, and add guardrails (validation, headers, RBAC checks)

## 4. Recovery
- Deploy fix to production
- Monitor for regressions (Sentry, health checks, metrics)
- Notify stakeholders of resolution and impact

## 5. Postmortem
- Timeline of events, what went well/poorly, action items
- Document changes to prevent recurrence (tests, lint rules, middleware)

## Contact & Escalation
- Primary: security@infamous-freight.com
- On-call: security-oncall@infamous-freight.com (24/7)
- Escalation policy: critical within 1 hour, high within 24 hours

## References
- RBAC: `api/src/auth/roles.js`, `api/src/auth/authorize.js`
- Audit chain: `api/src/lib/auditChain.js`
- JWT JWKS validator: `api/src/auth/jwtRotation.js`
- Security headers: `api/src/middleware/securityHeaders.js`
- CORS allowlist: `api/src/middleware/cors.js`
