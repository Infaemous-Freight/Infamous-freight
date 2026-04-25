# Backup and Restore Verification

A backup is not launch-ready until it has been restored and validated outside production.

## Launch Gate

Paid beta and public launch are blocked unless:

- Backup job exists
- Latest backup location is known
- Retention policy is documented
- Restore has been tested outside production
- Restore time is recorded
- Restored data has been validated
- Restore owner is identified

## Ownership

| Role | Name | Contact |
|---|---|---|
| Database Owner |  |  |
| Restore Owner |  |  |
| Backup Provider Owner |  |  |
| Launch Owner |  |  |

## Backup Configuration Checklist

- [ ] Production database provider identified
- [ ] Backup method documented
- [ ] Backup schedule documented
- [ ] Backup retention documented
- [ ] Backup storage location verified
- [ ] Backup access permissions verified
- [ ] Encryption at rest confirmed if provider supports it
- [ ] Backup monitoring/alerting configured
- [ ] Latest successful backup timestamp recorded
- [ ] Evidence logged

## Restore Test Procedure

Run this outside production.

1. Identify latest backup.
2. Provision non-production restore target.
3. Restore backup into the target.
4. Record restore start time.
5. Record restore completion time.
6. Connect application or database client to restored target.
7. Run validation queries.
8. Confirm restored data shape and counts are plausible.
9. Destroy or secure restored target according to policy.
10. Log evidence.

## Validation Queries

Use the actual schema names for the repository. The examples below must be adapted if table/model names differ.

```sql
-- Confirm core records exist
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Load";
SELECT COUNT(*) FROM "Invoice";

-- Confirm recent records restored
SELECT MAX("createdAt") FROM "Load";
SELECT MAX("createdAt") FROM "Invoice";
```

## Restore Evidence Template

```markdown
## Restore Test
Production Backup Restore Verification

## Date/Time
YYYY-MM-DD HH:MM TZ

## Backup Timestamp


## Restore Target


## Restore Start


## Restore End


## Restore Duration


## Validation Queries Run


## Validation Result


## Status
PASS / FAIL

## Owner


## Notes

```

## Failure Handling

If backup or restore fails:

- Mark launch as blocked.
- Create a critical blocker.
- Identify whether the issue is backup creation, permissions, storage, restore tooling, schema mismatch, or data corruption.
- Do not proceed to paid beta or public launch.
- Re-run restore verification after fix.

## Cleanup

- [ ] Restored database access restricted
- [ ] Temporary credentials revoked
- [ ] Temporary restore target deleted or secured
- [ ] Evidence retained
- [ ] Blocker status updated
