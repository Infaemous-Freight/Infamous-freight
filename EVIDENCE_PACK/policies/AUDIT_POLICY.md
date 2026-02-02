# Audit Policy - Infæmous Freight

**Effective Date:** January 16, 2026  
**Version:** 1.0 (Phase 18)

## 1. Purpose

This policy establishes requirements for audit logging, retention, and verification to ensure:

- **Non-repudiation:** Users cannot deny actions they performed
- **Compliance:** SOC2-lite auditability requirements met
- **Tamper detection:** Hash chaining prevents unauthorized modifications
- **Incident investigation:** Complete record for root cause analysis

## 2. Scope

This policy applies to:

- All API requests and responses
- Authentication events (success and failure)
- Authorization decisions (grants and denials)
- Data modifications (create, update, delete)
- Administrative actions
- Security-relevant events (rate limits, CSP violations, auth failures)

## 3. Audit Trail Requirements

### 3.1 Mandatory Fields

Every audit entry MUST include:

```json
{
  "timestamp": "2026-01-16T12:34:56.789Z",
  "id": "audit-uuid",
  "prevHash": "previous_entry_hash_or_genesis",
  "hash": "sha256_of_this_entry",
  "request": {
    "method": "POST",
    "path": "/api/jobs/accept",
    "ip": "192.0.2.1",
    "userAgent": "curl/7.64"
  },
  "response": {
    "statusCode": 200,
    "duration": 145
  },
  "actor": {
    "userId": "user-123",
    "role": "SHIPPER",
    "email": "user@example.com"
  },
  "action": "job:accept",
  "resource": {
    "type": "Job",
    "id": "job-456"
  },
  "result": "success",
  "context": {
    "tags": ["phase-18", "audit"],
    "extra": {}
  }
}
```

### 3.2 Hash Chain Integrity

- **Algorithm:** SHA256
- **Input:** Previous hash + current entry JSON + audit salt
- **Verification:** `verifyJobAuditChain(jobId)` validates linkage
- **Tampering Detection:** Any modification breaks hash chain

```javascript
// Example verification
const result = await verifyJobAuditChain("job-123", prisma);
if (!result.ok) {
  console.log("TAMPERING DETECTED:", result.tampering);
  // Possible values: "BROKEN_CHAIN", "DATA_MODIFIED"
}
```

## 4. Log Retention

| Log Type | Retention | Storage | Rotation |
|----------|-----------|---------|----------|
| API access | 90 days | Hot (searchable) | Weekly |
| Audit chain | 1 year | Archive (cold) | Monthly |
| Error logs | 30 days | Sentry | Automatic |
| Security events | 1 year | Archive + Sentry | Monthly |

- **Backup:** Audit logs backed up daily (immutable storage)
- **Deletion:** After retention expires, logs archived to cold storage (no deletion)

## 5. Audit Log Verification

### 5.1 Automated Verification

Verification runs:

- **On-demand:** `POST /api/audit/verify` (admin only)
- **Scheduled:** Daily at 02:00 UTC (random sample)
- **On access:** Before returning job event history

### 5.2 Verification Process

```bash
# Example: Verify single job
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://api.infamous-freight.com/api/audit/verify \
  -d '{"jobId": "job-123"}'

# Response
{
  "ok": true,
  "checked": 47,
  "jobId": "job-123",
  "verified": "2026-01-16T12:00:00Z"
}
```

### 5.3 Tampering Response

If tampering detected:

1. **Immediate:** Alert security team via Sentry
2. **Investigation:** Run full chain verification on related records
3. **Notification:** Notify affected parties within 1 hour
4. **Remediation:** Rollback to last known good state from backup
5. **Prevention:** Add additional controls if needed

## 6. Access Control

### 6.1 Who Can Access Audit Logs

| Role | Read | Verify | Delete | Export |
|------|------|--------|--------|--------|
| User | Own events | No | No | No |
| Admin | All | Yes | No | Yes |
| Auditor | All | Yes | No | Yes |
| System | All | Yes | No | Yes |

### 6.2 Log Export Requirements

- Exports logged with exporter identity
- Rate limited: Max 5 exports per hour per user
- Format: JSON or CSV (redacted)
- Redaction: Remove internal IPs, internal user IDs

## 7. Audit Data Privacy

### 7.1 What's Logged

- ✅ User ID (opaque identifier)
- ✅ Action type
- ✅ Resource ID
- ✅ Outcome (success/failure)
- ✅ Timestamp
- ✅ IP address
- ✅ User role

### 7.2 What's NOT Logged

- ❌ Passwords (even hashed)
- ❌ API keys or secrets
- ❌ Full request/response bodies (truncated to 1KB)
- ❌ Personally identifiable data (except user ID)
- ❌ Payment card details

## 8. Compliance Evidence

### 8.1 For Auditors

- **Access log exports:** 90-day rolling window
- **Verification reports:** Monthly integrity check results
- **Tampering incidents:** None (historical record)
- **Retention evidence:** Backup manifests and rotation logs

### 8.2 For Customers

Customers can request:

- Their own audit trail
- Verification certificate (signed)
- Log export in compliance format
- Access control matrix

## 9. Monitoring & Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Chain break | `prevHash` mismatch | CRITICAL | Page on-call |
| Data modified | Hash mismatch | CRITICAL | Page on-call |
| Verification failed | Script fails | HIGH | Investigation |
| Log quota exceeded | >1M/day | MEDIUM | Alert ops |
| Retention violated | Logs deleted early | HIGH | Investigation |

## 10. Audit of Audits

- **Monthly:** Manual sample verification (random 10 records)
- **Quarterly:** Full audit trail integrity review
- **Annual:** Third-party audit of audit controls
- **Continuous:** Sentry alerts on verification failures

## 11. Exceptions

Exceptions to this policy require:

- Written approval from Chief Architect
- Documented business justification
- Risk assessment signed off
- Duration limit (max 30 days)

## 12. Training & Awareness

All team members complete:

- Annual security awareness training
- Quarterly audit trail procedures review
- Incident response drills (semi-annual)

## 13. Review & Update

This policy is reviewed:

- **Quarterly:** Effectiveness check
- **Annually:** Compliance certification
- **As-needed:** Security incident response

**Next Review:** April 16, 2026

---

**Approval:**  
Santorio Djuan Miles, Chief Architect  
January 16, 2026
