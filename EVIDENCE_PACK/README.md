# Evidence Pack - SOC2-lite Compliance Artifacts

This folder contains operational and compliance artifacts for SOC2-lite enterprise customer audits.

## Directory Structure

### `policies/`

Security, incident response, and operational policies:

- `SECURITY_POLICY.md` - Security controls and standards
- `INCIDENT_RESPONSE_PLAN.md` - Incident response procedures
- `ACCESS_CONTROL_POLICY.md` - RBAC and authorization
- `CHANGE_MANAGEMENT.md` - Change deployment procedures
- `AUDIT_POLICY.md` - Audit log retention and integrity
- `DATA_RETENTION.md` - Data lifecycle policies

### `logs/`

System and audit logs (sanitized for customer delivery):

- `audit_chain_sample.log` - Sample tamper-evident audit chain
- `sentry_errors_summary.json` - Error tracking summary
- `access_logs_summary.json` - API access patterns
- `security_events.log` - Security-related events
- `system_health.log` - System health check logs

### `screenshots/`

Visual evidence of security controls:

- `dashboard_monitoring.png` - Sentry/monitoring dashboard
- `rbac_enforcement.png` - RBAC role configuration
- `audit_chain_verification.png` - Audit verification run
- `security_headers.png` - Security headers validation
- `rate_limiting.png` - Rate limiting configuration
- `csp_report.png` - Content Security Policy reports

### `artifacts/`

Configuration and test artifacts:

- `security_headers.json` - Current security headers
- `api_capabilities.json` - API security capabilities
- `test_results.json` - Security test results
- `dependency_audit.json` - Dependency vulnerability scan
- `code_coverage.json` - Test coverage metrics

## Usage

### For Audits

1. Share appropriate files with auditors/customers
2. Redact sensitive data (IPs, internal hostnames, user details)
3. Include attestations of procedures followed
4. Provide verification scripts (e.g., `verify_headers.sh`)

### For CI/CD Integration

```bash
# Generate evidence artifacts
pnpm generate:evidence

# Verify audit chain integrity
node apps/api/src/audit/verify.js --jobId=<JOB_ID>

# Collect security headers
curl -i https://api.infamous-freight.com/api/health
```

### Compliance Checklist

- [ ] Access control matrix (RBAC roles documented)
- [ ] Audit trail sample (latest 7 days)
- [ ] Security headers verification
- [ ] Incident response test (within 6 months)
- [ ] Dependency audit (within 30 days)
- [ ] Code coverage (>80%)
- [ ] Error tracking enabled (Sentry)
- [ ] Rate limiting verified
- [ ] CORS allowlist validated
- [ ] CSP violations reviewed

## Updating Evidence

Update artifacts regularly:

1. **Weekly**
   - Refresh audit log samples
   - Update security event summary
   - Check Sentry error trends

2. **Monthly**
   - Run security headers verification
   - Audit RBAC configuration
   - Verify audit chain integrity (random sample)

3. **Quarterly**
   - Full dependency audit
   - Incident response test
   - Security assessment review

## Security Notes

- ⚠️ Redact all production data before sharing
- ⚠️ Remove internal IPs and hostnames
- ⚠️ Do not include real encryption keys
- ✅ Include timestamps for all evidence
- ✅ Sign critical artifacts (GPG) if required
- ✅ Maintain chain of custody for audit logs

## Related Documentation

- [SECURITY.md](../SECURITY.md) - Complete security documentation
- [INCIDENT_RESPONSE.md](../INCIDENT_RESPONSE.md) - Incident playbook
- [.env.example](../apps/api/.env.example) - Environment configuration reference
