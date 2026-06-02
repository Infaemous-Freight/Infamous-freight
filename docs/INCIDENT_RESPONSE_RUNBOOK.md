# Incident Response Runbook

## Severity Levels

### P1
Production outage, authentication failure, tenant isolation breach, database outage, payment processing outage.

Target acknowledgement: 15 minutes.

### P2
Customer-facing degradation, elevated error rate, dispatch workflow degradation.

Target acknowledgement: 30 minutes.

### P3
Operational issue, diagnostic failure, monitoring degradation.

Target acknowledgement: next business cycle.

## Initial Response

1. Confirm alert source.
2. Check public health endpoints.
3. Check Fly deployment state.
4. Check application logs.
5. Determine blast radius.
6. Escalate according to severity.

## Rollback Criteria

Rollback immediately if:

- tenant isolation risk exists
- authentication is broken
- data integrity is at risk
- production outage was introduced by latest deployment

## Evidence Collection

Capture:

- timestamps
- deployment version
- endpoint status
- screenshots
- logs
- remediation actions

Store evidence in launch-evidence folders and operational incident records.
