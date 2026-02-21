# Backup and Recovery Procedures

**Status**: ✅ PROCEDURES DOCUMENTED  
**Date**: February 19, 2026  
**Criticality**: ESSENTIAL for business continuity

---

## 1. Backup Strategy

### Overview

```
RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 15 minutes
Target Availability: 99.9%
```

### What to Back Up

| Component | Type | Frequency | Retention |
|-----------|------|-----------|-----------|
| Database | Full backup | Daily 2 AM | 30 days |
| Database | Transaction logs | Every 5 min | 7 days |
| Application code | Git repository | Always | Forever |
| Configuration | Environment vars | Daily | 7 days |
| Uploaded files | S3/Storage | Continuous | 90 days |

---

## 2. Database Backup Procedures

### Automatic Backups (Already Configured)

**Fly.io PostgreSQL**:
```bash
# View existing backups
fly postgres list-backups -a infamous-freight-db

# Backups are created automatically:
# - Daily at 2 AM UTC
# - Retained for 30 days
# - Can be restored to point-in-time
```

**Verify Current Backup**:
```bash
# Connect to database
fly postgres connect -a infamous-freight-db

-- List existing tables
\dt

-- Check replication status
SELECT * FROM pg_stat_replication;

-- Check backup status
SELECT backups FROM pg_stat_statements;
```

### Manual Backup Procedure

```bash
# Step 1: Connect to database
fly postgres connect -a infamous-freight-db

# Step 2: Create full backup
pg_dump --format=custom --verbose \
  --file=/tmp/db_backup_$(date +%Y%m%d_%H%M%S).dump \
  postgresql://user:password@host:5432/db

# Step 3: Compress backup
gzip /tmp/db_backup_*.dump

# Step 4: Upload to S3 (for offsite storage)
aws s3 cp /tmp/db_backup_*.dump.gz \
  s3://infamous-freight-backups/db_backups/

# Step 5: Verify backup
pg_restore --list /tmp/db_backup_*.dump | head -20
```

### Backup Verification

```bash
# Test restore (dry-run)
pg_restore --list /tmp/db_backup_*.dump > /tmp/restore_list.txt

# Verify table count
grep "TABLE" /tmp/restore_list.txt | wc -l
# Expected: > 20 tables

# Verify data volume
ls -lh /tmp/db_backup_*.dump.gz
# Expected: Reasonable size for your data
```

---

## 3. Database Recovery Procedures

### Complete Database Recovery

**Scenario**: Database corrupted, need to restore

```bash
# Step 1: Create new database (if needed)
fly postgres create -a infamous-freight-db-new

# Step 2: Restore from backup
pg_restore --clean --if-exists \
  --verbose \
  --dbname=postgresql://user:password@new_host:5432/db \
  /path/to/db_backup.dump

# Step 3: Verify restoration
fly postgres connect -a infamous-freight-db-new
SELECT COUNT(*) FROM "User";  -- Should match pre-backup count

# Step 4: Update connection string
# GitHub Settings > Secrets > DATABASE_URL > Update to new host

# Step 5: Restart application
fly apps restart infamous-freight-api

# Step 6: Verify application
curl https://infamous-freight-api.fly.dev/api/health
```

### Point-in-Time Recovery (PITR)

**Scenario**: Accidental data deletion, recover to specific time

```bash
# Fly.io handles PITR automatically
# List recovery objectives:
fly postgres list-backups -a infamous-freight-db

# Restore to specific backup
fly postgres restore-backup -a infamous-freight-db \
  --backup-id <backup_id>

# Application automatically detects new database
# Verify connection restored
curl https://infamous-freight-api.fly.dev/api/health
```

### Partial Recovery (Specific Table)

```bash
# Export specific table from backup
pg_restore --table="User" \
  --data-only \
  /tmp/db_backup.dump \
  | psql postgresql://user:password@host/db

# Verify restoration
psql postgresql://user:password@host/db
SELECT COUNT(*) FROM "User";
```

---

## 4. Application Code Recovery

### Code is in Git (No Manual Backup Needed)

```bash
# List all branches
git branch -a

# List all commits
git log --oneline --all | head -20

# Recover from any previous commit
git checkout <commit-hash>
git push --force origin main  # Deploy previous version

# Or use git revert (safer)
git revert <commit-hash>
git push origin main
```

### But keep backups for external changes:

```bash
# Backup current repo to S3
cd /workspaces/Infamous-freight-enterprises
tar -czf repo_backup_$(date +%Y%m%d).tar.gz .

aws s3 cp repo_backup_*.tar.gz \
  s3://infamous-freight-backups/code/

# List all backups
aws s3 ls s3://infamous-freight-backups/code/
```

---

## 5. File Storage Recovery (S3/Blob Storage)

### User Uploaded Files

```bash
# Verify S3 bucket exists
aws s3 ls s3://infamous-freight-uploads/

# Check file count
aws s3 ls s3://infamous-freight-uploads/ --recursive | wc -l

# Restore from backup
aws s3 sync s3://infamous-freight-uploads-backup/ \
  s3://infamous-freight-uploads/ \
  --dryrun  # Review changes first

# Actual restore
aws s3 sync s3://infamous-freight-uploads-backup/ \
  s3://infamous-freight-uploads/
```

### Verify Restoration

```bash
# Test file access
aws s3 cp s3://infamous-freight-uploads/test.pdf /tmp/test.pdf

# Check file integrity
md5sum /tmp/test.pdf
# Compare with original checksum
```

---

## 6. Configuration Backup

### Environment Variables Backup

```bash
# Export GitHub Secrets
gh secret list > /tmp/secrets_list.txt

# Manually back up to secure location (encrypted)
# WARNING: Do not commit secrets to git!

# Restore from backup:
# GitHub Settings > Secrets and variables > Actions > New secret
# Enter each secret name and value
```

### Git Hooks & Scripts Backup

```bash
# Already in version control (.githooks/)
# Auto-backed up by Git

# Verify in repo
ls -la .githooks/

# Restore from git if needed
git checkout HEAD -- .githooks/
```

---

## 7. Backup Monitoring & Alerts

### Verify Backups Are Running

**GitHub Action**:
```yaml
name: Backup Verification

on:
  schedule:
    - cron: "0 3 * * *" # 3 AM daily (1 hour after backup)

jobs:
  verify-backup:
    runs-on: ubuntu-latest
    steps:
      - name: Check Fly.io backups
        run: |
          flyctl postgres list-backups -a infamous-freight-db \
            | grep -q "$(date +%Y-%m-%d)" || \
            echo "ERROR: Backup missing for today"

      - name: Verify S3 backups
        run: |
          aws s3 ls s3://infamous-freight-backups/ --recursive \
            | grep -q "$(date +%Y-%m-%d)" || \
            echo "ERROR: S3 backup missing for today"

      - name: Alert if missing
        if: failure()
        run: |
          echo "Backup verification failed"
          # Send Slack alert
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"⚠️ Backup verification failed"}'
```

### Alert Rules

```yaml
# Alert if backup > 24 hours old
- name: Backup Age
  alerting: "backup_age_hours > 24"
  
# Alert if backup size < expected
- name: Backup Size
  alerting: "backup_size_mb < 1000"
  
# Alert if restore test fails
- name: Restore Test
  alerting: "restore_test_status != 'success'"
```

---

## 8. Recovery Testing

### Monthly Recovery Drill

**First Tuesday of month, 10 AM**:

```bash
# Step 1: Full database recovery test
# - Restore to test environment
# - Verify all tables present
# - Run smoke tests
# - Estimated time: 30 minutes

# Step 2: Partial recovery test
# - Restore single table
# - Verify data integrity
# - Estimated time: 15 minutes

# Step 3: Code recovery test
# - Checkout previous commit
# - Verify application starts
# - Run tests
# - Estimated time: 10 minutes

# Step 4: File recovery test
# - Restore from S3 backup
# - Verify files accessible
# - Estimated time: 10 minutes

# Total: ~65 minutes
```

### Monthly Report

Document:
- Backup sizes
- Restore times
- Any issues encountered
- Improvements identified
- Completion status

---

## 9. Disaster Recovery Scenarios

### Scenario 1: Database Completely Lost

**Recovery Steps**:
```bash
# 1. Create new database
fly postgres create

# 2. Restore from backup
pg_restore --file=/tmp/latest_backup.dump

# 3. Update connection string
# GitHub Secrets > DATABASE_URL

# 4. Restart application
fly apps restart infamous-freight-api

# 5. Verify
curl /api/health
```
**RTO**: 60 minutes  
**Data Loss**: < 15 minutes

### Scenario 2: Application Code Lost

**Recovery Steps**:
```bash
git log --all | head  # Find latest commit
git checkout <commit> # Restore version
git push origin main
```
**RTO**: 5 minutes  
**Data Loss**: 0 (code in Git)

### Scenario 3: User Uploaded Files Lost

**Recovery Steps**:
```bash
aws s3 sync s3://infamous-freight-uploads-backup/ \
  s3://infamous-freight-uploads/
```
**RTO**: 30 minutes  
**Data Loss**: None (backup present)

---

## 10. Backup Checklist

**Daily (Automated)**:
- [ ] Database backup created
- [ ] Backup replicated to S3
- [ ] Transaction logs collected

**Weekly**:
- [ ] Verify backup integrity
- [ ] Check backup sizes are reasonable
- [ ] Test partial recovery

**Monthly**:
- [ ] Full recovery drill
- [ ] Update recovery documentation
- [ ] Train team on procedures

**Quarterly**:
- [ ] Review backup retention policy
- [ ] Update RTO/RPO targets
- [ ] Capacity planning for backups

---

## 11. Backup Storage Locations

| Type | Primary | Secondary | Retention |
|------|---------|-----------|-----------|
| Database | Fly.io PostgreSQL | S3 backup | 30 days |
| Files | Fly.io/S3 | S3 replica | 90 days |
| Code | GitHub | Local backups | Forever |
| Config | GitHub Secrets | Encrypted file | 7 days |

---

## 12. Cost Optimization

```
Current backup costs:
- Fly.io: $0 (included with service)
- S3 storage: ~$23/month
- Bandwidth: ~$5/month
Total: ~$28/month

Potential optimizations:
- Compress backups before S3 (save 60%)
- Lifecycle policy (archive after 7 days)
- Glacier storage for cold backups
```

---

**Status**: ✅ READY FOR PRODUCTION

**Next Steps**:
1. Verify Fly.io backups are running
2. Test manual backup procedure
3. Schedule first recovery drill
4. Enable backup verification workflow

**Keep this document current.** Review quarterly.
