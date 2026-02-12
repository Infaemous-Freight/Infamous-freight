# 🚨 Disaster Recovery Plan

## Executive Summary

This document outlines the procedures and strategies for recovering Infamous Freight Enterprises platform from critical failures, data loss, and security incidents. Recovery Time Objective (RTO): **2 hours** | Recovery Point Objective (RPO): **1 hour**.

---

## 1. Backup Strategy

### Database Backups

#### Automated Backups

```bash
# Daily full backup at 2 AM UTC
BACKUP_SCHEDULE="0 2 * * *"  # Daily
RETENTION_DAYS=30

# Hourly incremental backups
INCREMENTAL_SCHEDULE="0 * * * *"  # Every hour
RETENTION_HOURS=24
```

#### Backup Configuration

```javascript
// apps/api/src/services/backup.js

const schedule = require('node-schedule');
const { prisma } = require('@infamous-freight/shared');

class BackupManager {
  constructor() {
    this.backups = [];
  }

  // Daily full backup
  scheduleDailyBackup() {
    schedule.scheduleJob('0 2 * * *', async () => {
      console.log('Starting daily backup...');
      try {
        const backup = await this.createFullBackup();
        await this.uploadToS3(backup, 'daily');
        await this.verifyBackup(backup);
        console.log('✅ Daily backup complete');
      } catch (err) {
        console.error('❌ Backup failed:', err);
        await this.sendAlert('BACKUP_FAILURE', err.message);
      }
    });
  }

  // Hourly incremental backup
  scheduleIncrementalBackup() {
    schedule.scheduleJob('0 * * * *', async () => {
      console.log('Starting incremental backup...');
      try {
        const backup = await this.createIncrementalBackup();
        await this.uploadToS3(backup, 'incremental');
        console.log('✅ Incremental backup complete');
      } catch (err) {
        console.error('❌ Incremental backup failed:', err);
      }
    });
  }

  async createFullBackup() {
    const timestamp = new Date().toISOString();
    const filename = `backup-full-${timestamp}.sql`;

    // Dump entire database
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(
        `pg_dump ${process.env.DATABASE_URL} > /backups/${filename}`,
        (err, stdout, stderr) => {
          if (err) reject(err);
          else resolve({ filename, path: `/backups/${filename}`, timestamp });
        }
      );
    });
  }

  async createIncrementalBackup() {
    const timestamp = new Date().toISOString();
    const filename = `backup-incremental-${timestamp}.sql`;

    // Backup only recent changes (using Prisma)
    const recentShipments = await prisma.shipment.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 3600000) // Last hour
        }
      }
    });

    return {
      filename,
      data: JSON.stringify(recentShipments),
      timestamp
    };
  }

  async uploadToS3(backup, type) {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();
    const fs = require('fs');

    const fileStream = fs.createReadStream(backup.path);
    const params = {
      Bucket: process.env.BACKUP_BUCKET,
      Key: `${type}/${backup.filename}`,
      Body: fileStream,
      ServerSideEncryption: 'AES256'
    };

    return s3.upload(params).promise();
  }

  async verifyBackup(backup) {
    // Test restore from backup
    console.log('Verifying backup integrity...');
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec(
        `pg_restore -d test_db ${backup.path} --dry-run`,
        (err) => {
          if (err) {
            console.error('❌ Backup verification failed');
            reject(err);
          } else {
            console.log('✅ Backup verified');
            resolve(true);
          }
        }
      );
    });
  }

  async sendAlert(type, message) {
    // Send to Slack, PagerDuty, etc
  }
}

module.exports = new BackupManager();
```

#### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@host:5432/db
BACKUP_BUCKET=infamous-freight-backups
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=yyy
```

---

### File & Asset Backups

#### S3 Backup Configuration

```bash
#!/bin/bash
# scripts/backup-assets.sh

BUCKET="infamous-freight-assets"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Backup user avatars
aws s3 sync s3://$BUCKET/avatars/ \
  /backups/assets/avatars-$DATE/ \
  --sse AES256

# Backup shipment documents
aws s3 sync s3://$BUCKET/shipments/ \
  /backups/assets/shipments-$DATE/ \
  --sse AES256

echo "✅ Asset backup complete: /backups/assets/"
```

#### Enable Versioning

```bash
# Enable S3 versioning to prevent accidental deletion
aws s3api put-bucket-versioning \
  --bucket infamous-freight-assets \
  --versioning-configuration Status=Enabled
```

---

### Application Code Backups

```bash
#!/bin/bash
# scripts/backup-code.sh

REPO_PATH="/workspaces/Infamous-freight-enterprises"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Create code snapshot
cd $REPO_PATH
git bundle create /backups/code-$DATE.bundle --all

# Upload to S3
aws s3 cp /backups/code-$DATE.bundle \
  s3://infamous-freight-backups/code/

echo "✅ Code backup complete"
```

---

## 2. Recovery Procedures

### Database Recovery (Unplanned Downtime)

#### 1-Hour RPO Recovery

```bash
#!/bin/bash
# scripts/recover-database.sh

set -e

echo "🔄 Starting database recovery..."

# 1. Stop application
docker-compose stop api web

# 2. List available backups
echo "Available backups:"
aws s3 ls s3://infamous-freight-backups/daily/ --recursive

# 3. Select backup (use latest hourly if within 1h, else latest daily)
BACKUP_FILE="backup-full-2026-01-16.sql"
echo "Restoring from: $BACKUP_FILE"

# 4. Download backup
aws s3 cp s3://infamous-freight-backups/daily/$BACKUP_FILE /tmp/

# 5. Create new database from backup
psql $DATABASE_URL < /tmp/$BACKUP_FILE

# 6. Verify recovery
psql $DATABASE_URL -c "SELECT COUNT(*) as shipment_count FROM shipments;"

# 7. Restart application
docker-compose up -d api web

echo "✅ Database recovery complete"
```

#### Verification Checklist

```bash
# 1. Check data integrity
SELECT COUNT(*) FROM shipments;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM drivers;

# 2. Check recent transactions
SELECT * FROM shipments ORDER BY updatedAt DESC LIMIT 5;

# 3. Test API connectivity
curl http://localhost:4000/api/health

# 4. Verify application
curl http://localhost:3000/health
```

---

### Application Recovery

#### Rollback to Previous Version

```bash
#!/bin/bash
# scripts/rollback-deployment.sh

# 1. Get previous deployment
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
echo "Rolling back to: $PREVIOUS_COMMIT"

# 2. Checkout previous code
git checkout $PREVIOUS_COMMIT apps/web/ apps/api/

# 3. Rebuild
pnpm install
pnpm build

# 4. Redeploy
git push origin $(git rev-parse --abbrev-ref HEAD)

# Wait for Vercel deployment
echo "Waiting for Vercel deployment..."
sleep 30

# 5. Verify
curl https://infamous-freight-enterprises.vercel.app/api/health

echo "✅ Rollback complete"
```

#### Quick Rollback via Vercel

```bash
# Using Vercel CLI
vercel rollback --confirm
# Automatically rolls back to previous successful deployment

# Or through dashboard:
# Vercel > Project > Deployments > Previous > Promote
```

---

### Full System Recovery (Catastrophic Failure)

#### Step-by-Step Recovery

```bash
#!/bin/bash
# scripts/full-system-recovery.sh

set -e

echo "🚨 Starting full system recovery..."

# 1. Provision new infrastructure
echo "1️⃣  Provisioning new infrastructure..."
terraform apply -auto-approve

# 2. Restore database
echo "2️⃣  Restoring database from backup..."
aws s3 cp s3://infamous-freight-backups/daily/latest.sql /tmp/
psql $DATABASE_URL < /tmp/latest.sql

# 3. Restore assets
echo "3️⃣  Restoring assets from S3..."
aws s3 sync s3://infamous-freight-backups/assets/ \
  s3://infamous-freight-assets/

# 4. Deploy latest code
echo "4️⃣  Deploying application..."
git clone https://github.com/infamous-freight/platform.git
cd platform
pnpm install
pnpm build
vercel deploy --prod

# 5. Verify all systems
echo "5️⃣  Verifying systems..."
curl https://api.infamousfreight.com/api/health
curl https://app.infamousfreight.com/api/health

# 6. Run smoke tests
echo "6️⃣  Running smoke tests..."
pnpm --filter e2e test:smoke

# 7. Notify team
echo "7️⃣  Notifying team..."
curl -X POST $SLACK_WEBHOOK \
  -d '{"text":"System recovery complete"}'

echo "✅ Full system recovery complete!"
```

---

## 3. Recovery Time Targets

| Scenario | RTO | RPO | Steps |
|----------|-----|-----|-------|
| Database corruption | 30 min | 1 hour | 5 |
| Application crash | 10 min | 0 min | 3 |
| Data loss | 2 hours | 1 hour | 7 |
| Complete failure | 4 hours | 1 hour | 8 |
| Security breach | 1 hour | Varies | 6 |

---

## 4. Backup Verification

### Monthly Backup Test

```bash
#!/bin/bash
# scripts/test-backup-recovery.sh

echo "🧪 Testing backup recovery..."

# 1. Create test database
createdb test_restore

# 2. Restore from latest backup
aws s3 cp s3://infamous-freight-backups/daily/latest.sql /tmp/
psql test_restore < /tmp/latest.sql

# 3. Run verification queries
psql test_restore << EOF
  SELECT COUNT(*) as shipments FROM shipments;
  SELECT COUNT(*) as users FROM users;
  SELECT COUNT(*) as drivers FROM drivers;
EOF

# 4. Cleanup
dropdb test_restore

echo "✅ Backup test complete"
```

---

## 5. Disaster Recovery Team

### On-Call Rotation

```
Monday: Alice (Primary) | Bob (Secondary)
Tuesday: Bob (Primary) | Charlie (Secondary)
Wednesday: Charlie (Primary) | Alice (Secondary)
Thursday: Alice (Primary) | Bob (Secondary)
Friday: Bob (Primary) | Charlie (Secondary)
Weekend: Rotating standby
```

### Contact Information

```
Primary On-Call: +1-555-XXXX (Slack: @oncall)
Secondary On-Call: +1-555-YYYY
Incident Commander: @incident-commander
Database Lead: @db-lead
```

### Escalation

```
Minutes  0-15: Detect issue, page on-call
Minutes 15-30: Activate incident response
Minutes 30-60: Initiate recovery procedures
Minutes 60+: Escalate to CTO/VP Engineering
```

---

## 6. Documentation & Training

### Required Reading

- [ ] This DR Plan (all staff)
- [ ] Incident Response Playbook (engineers)
- [ ] Database Recovery Guide (DBAs)
- [ ] Application Deployment Guide (DevOps)

### Quarterly Drills

```bash
# Q1: Database recovery
# Q2: Application rollback
# Q3: Full system failure
# Q4: Comprehensive disaster drill
```

---

**Status**: ✅ Comprehensive disaster recovery plan in place  
**Last Updated**: January 16, 2026  
**Next Review**: April 16, 2026  
**Test Schedule**: Monthly backup verification, Quarterly full drill
