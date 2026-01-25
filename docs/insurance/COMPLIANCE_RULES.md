# Compliance Rules

Insurance compliance is evaluated per carrier using organization-configured coverage requirements.

## Default Rules
1. **Warning** when a certificate expires within the configured warning window (default: 14 days).
2. **Non-compliant** when a required certificate is missing or expired.
3. **Suspended** when a certificate is expired beyond the configured grace period (default: 7 days).

## Inputs
- Coverage requirements (limits, warning/grace windows, required-for states)
- Certificates and their verification status
- Effective/expiration dates

## Outputs
- Compliance state: COMPLIANT, WARNING, NON_COMPLIANT, SUSPENDED
- Human-readable reasons list
- Audit log events for enforcement actions
