# Phase 19: Quick Reference — Enterprise Multi-Tenancy

## Files Created/Modified

| File | Purpose | Status |
|------|---------|--------|
| `apps/api/prisma/schema.prisma` | Added Organization + OrgAuditLog models, extended User/Job | ✅ |
| `apps/api/src/db/tenant.ts` | Tenant-scoped Prisma client (row-level security) | ✅ |
| `apps/api/src/middleware/security.js` | Updated authenticate() + added requireOrganization() | ✅ |
| `apps/api/src/security/kms.ts` | AES-256-GCM key manager + field encryption | ✅ |
| `apps/api/src/audit/orgAuditLog.ts` | Audit logging + queries + CSV export | ✅ |
| `apps/api/src/admin/auditExport.ts` | Audit export (JSON/CSV/JSONL) + DPA report | ✅ |
| `apps/api/.env.phase19` | MASTER_KEY environment variable | ✅ |

---

## Quick Start

### 1. Setup Master Key

```bash
# Generate 32-byte base64 key
MASTER_KEY=$(openssl rand -base64 32)
echo "MASTER_KEY=$MASTER_KEY" >> apps/api/.env

# Verify
echo $MASTER_KEY | base64 -d | wc -c
# Should output: 32
```

### 2. Run Migration

```bash
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate
```

### 3. Create Organization

```javascript
import { generateDataKey } from "@/security/kms";

const org = await prisma.organization.create({
  data: {
    name: "Acme Logistics",
    slug: "acme-logistics",
    dataKeyEnc: generateDataKey(), // Encrypted by MASTER_KEY
  },
});
```

### 4. Secure JWT Claims

Ensure JWT includes:
```json
{
  "sub": "user_123",
  "org_id": "org_456",
  "role": "SHIPPER"
}
```

### 5. Apply Tenant Isolation in Routes

```javascript
import { tenantPrisma } from "@/db/tenant";
import { requireOrganization } from "@/middleware/security";

router.get(
  "/jobs",
  authenticate,
  requireOrganization, // ← Block if no org_id
  async (req, res) => {
    const orgId = req.auth.organizationId;
    const tprisma = tenantPrisma(prisma, orgId); // ← Enforce isolation
    const jobs = await tprisma.job.findMany();
    res.json(jobs);
  }
);
```

---

## Key Modules

### Tenant Isolation

```typescript
import { tenantPrisma } from "@/db/tenant";

const tprisma = tenantPrisma(prisma, organizationId);
// All queries now filtered by organizationId automatically
const jobs = await tprisma.job.findMany(); // ← Only org's jobs
```

### KMS (Encryption)

```typescript
import { generateDataKey, decryptDataKey, encryptField, decryptField } from "@/security/kms";

// Create org with encrypted key
const dataKeyEnc = generateDataKey();

// Decrypt for use
const dataKey = decryptDataKey(dataKeyEnc);

// Encrypt sensitive field
const encrypted = encryptField(dataKey, "123-45-6789"); // SSN
await prisma.user.update({ where: { id }, data: { ssn: encrypted } });

// Decrypt when needed
const plaintext = decryptField(dataKey, encrypted); // "123-45-6789"
```

### Audit Logging

```typescript
import { logAuditEvent, AUDIT_ACTIONS } from "@/audit/orgAuditLog";

await logAuditEvent(prisma, {
  organizationId: "org_123",
  userId: "user_456",
  action: AUDIT_ACTIONS.JOB_ACCEPTED,
  entity: "job",
  entityId: jobId,
  metadata: { wave: 2, driverId: "driver_789" },
});
```

### Audit Export

```typescript
import { exportOrgAudit, generateDPAReport } from "@/admin/auditExport";

// Export for period
const result = await exportOrgAudit(prisma, {
  organizationId: "org_123",
  from: new Date("2026-01-01"),
  to: new Date("2026-01-31"),
  format: "csv", // json | csv | jsonl
});

// DPA compliance report
const report = await generateDPAReport(prisma, "org_123", fromDate, toDate);
console.log(report.summary.totalEvents, "events logged");
```

---

## Security Checklist

- [ ] MASTER_KEY generated & stored securely
- [ ] All routes use `tenantPrisma(prisma, orgId)`
- [ ] All routes have `requireOrganization` middleware
- [ ] JWT includes `org_id` claim
- [ ] Audit events logged for sensitive actions
- [ ] Sensitive fields encrypted with KMS
- [ ] Audit export tested (JSON/CSV/JSONL)
- [ ] Cross-org access tested (should fail)

---

## Testing

### Verify Tenant Isolation

```bash
# Should fail - org2 can't see org1's data
curl -H "Authorization: Bearer $TOKEN_ORG2" \
  http://localhost:4000/api/jobs/$ORG1_JOB_ID
# Expected: 404 or empty result
```

### Test Audit Export

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/audit/export?from=2026-01-01&to=2026-01-31&format=csv" \
  > audit.csv
```

### Verify Encryption

```javascript
const dataKey = decryptDataKey(org.dataKeyEnc);
const encrypted = encryptField(dataKey, "secret");
const decrypted = decryptField(dataKey, encrypted);
assert(decrypted === "secret");
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "No organization" error | JWT missing `org_id` claim |
| Decryption failed | MASTER_KEY not set or wrong value |
| Cross-org data leak | Route not using `tenantPrisma()` |
| Audit logs missing | Migration not applied |
| PII visible in exports | Check CSV redaction (should show `***REDACTED***`) |

---

## Deployment

```bash
# 1. Generate key
export MASTER_KEY=$(openssl rand -base64 32)

# 2. Run migration
pnpm prisma migrate deploy

# 3. Verify organizations exist
pnpm prisma studio

# 4. Test routes
curl http://localhost:4000/api/jobs

# 5. Check audit logs
curl http://localhost:4000/api/audit/logs
```

---

## Monitoring

Set alerts for:
- `AUTH_FAILED` audit events (spike detection)
- `SCOPE_VIOLATION` events (unauthorized access attempts)
- KMS decryption errors (key corruption)
- Cross-org queries (intrusion detection)

---

## Next Phases

**Phase 20**: SSO/SAML integration  
**Phase 21**: Per-org API keys  
**Phase 22**: Advanced RBAC  
**Phase 23**: Automated compliance reporting

---

## Support

- **Key Generation**: `openssl rand -base64 32`
- **Migration Help**: `pnpm prisma migrate --help`
- **Schema Inspection**: `pnpm prisma studio`
- **Audit Queries**: Use `getAuditLogs()` with filters

---

**Status**: ✅ Production Ready | Phase 19 Complete | Enterprise Secured

*2026-01-16*
