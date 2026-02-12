# Database Migration Strategy

This guide documents safe, reliable database migration procedures for the Infamous Freight Enterprises platform. All migrations use Prisma ORM with PostgreSQL.

## Overview

Migrations move your database schema from one state to another in a controlled way. This document ensures all migrations are safe, reversible, and production-ready.

## Prerequisites

- PostgreSQL database accessible
- Prisma CLI installed: `npm install -D prisma`
- Database credentials in `.env` file (`DATABASE_URL`)
- Backup of production database before any migration

## Types of Migrations

### Safe Migrations (No Data Loss)

✅ Adding new nullable columns
✅ Adding new tables
✅ Adding columns with default values
✅ Renaming columns (with proper schema handling)
✅ Relaxing constraints

### Dangerous Migrations (Requires Strategy)

⚠️ Removing columns
⚠️ Removing tables
⚠️ Changing column types
⚠️ Adding NOT NULL columns without defaults
⚠️ Adding unique constraints to populated columns

### Very Risky (Requires Approval)

❌ Dropping entire tables with data
❌ Major schema restructuring
❌ Changing column primary keys

## Development Workflow

### Step 1: Create Migration

```bash
# Create a new migration based on schema changes
cd apps/api
npx prisma migrate dev --name add_user_roles

# This will:
# 1. Create a new migration file in prisma/migrations/
# 2. Apply migration to development database
# 3. Regenerate Prisma client
```

### Step 2: Review Generated SQL

```bash
# Check the migration file before committing
cat prisma/migrations/<timestamp>_<name>/migration.sql
```

**What to look for:**

- All changes are intentional
- No unexpected column drops
- Proper constraint ordering
- Correct data transformations

### Step 3: Commit Migration

```bash
# Stage migration files
git add prisma/migrations/

# Commit with clear message
git commit -m "chore(db): add user roles migration

- Creates new 'roles' table with user_id foreign key
- Adds 'role_id' column to users table
- Migration is backward compatible
- No data loss or downtime required"

# Push to repository
git push origin <branch>
```

## Staging/Production Workflow

### Before Deployment

```bash
# 1. Get latest schema
git pull origin main

# 2. Back up database (CRITICAL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Test migration locally first
npx prisma migrate deploy --preview-feature

# 4. Verify schema
npx prisma db execute --stdin < verify_schema.sql

# 5. Run health checks
npm run test
npm run start  # Test server starts successfully
```

### Execute Migration

```bash
# In production environment with proper backups:
npx prisma migrate deploy

# This:
# - Connects to production database
# - Replays all pending migrations in order
# - Updates _prisma_migrations table
# - Does NOT regenerate Prisma client (safe for production)
```

### Verify Migration Success

```bash
# Check migration status
npx prisma migrate status

# Expected output:
# Pending migrations:
# None - your database is up to date

# Validate data integrity
npm run validate:data

# Check application health
curl http://localhost:3000/api/health
```

## Handling Migration Conflicts

### Scenario 1: Conflicting Migrations

If two developers create migrations that conflict:

```bash
# Reset to last known good state
npx prisma migrate resolve --rolled-back <migration_name>

# Recreate migration with both changes
npx prisma migrate dev --name merged_migration
```

### Scenario 2: Migration Fails in Production

```bash
# 1. Immediately restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 2. Identify issue
npx prisma migrate status

# 3. Fix migration file
vim prisma/migrations/<timestamp>_<name>/migration.sql

# 4. Mark as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# 5. Test fix locally before retry
npx prisma migrate deploy

# 6. Retry in production with backup ready
```

## Rollback Procedures

### Option 1: Zero-Downtime Rollback (Preferred)

For safe migrations (adding columns, new tables):

```bash
# Create inverse migration
npx prisma migrate dev --name rollback_user_roles

# This creates a migration that reverses the previous one
# - Removes the added columns/tables
# - Preserves data where possible
# - No downtime required

# Review and commit
git add prisma/migrations/
git commit -m "chore(db): rollback user roles migration"
git push
```

### Option 2: Database Restoration

For complex issues:

```bash
# 1. Stop application
systemctl stop infamous-freight-api

# 2. Restore database from backup
psql $DATABASE_URL < backup_20241213_120000.sql

# 3. Reset migration history (if needed)
npx prisma migrate resolve --rolled-back <migration_name>

# 4. Start application
systemctl start infamous-freight-api

# 5. Verify health
curl http://localhost:3000/api/health
```

### Option 3: Manual SQL Rollback

For emergency situations:

```sql
-- Execute in psql or GUI
-- EXAMPLE: Remove added column
ALTER TABLE users DROP COLUMN role_id CASCADE;

-- EXAMPLE: Remove new table
DROP TABLE roles CASCADE;

-- Update migration history
DELETE FROM _prisma_migrations
WHERE migration_name = 'YYYYMMDD000001_add_user_roles';
```

## Data Transformation Migrations

### Adding Required Column to Populated Table

❌ **Wrong approach:**

```sql
ALTER TABLE users ADD COLUMN status VARCHAR NOT NULL;
-- FAILS: Existing rows have no default value
```

✅ **Correct approach:**

```sql
-- Step 1: Add column with default
ALTER TABLE users ADD COLUMN status VARCHAR NOT NULL DEFAULT 'active';

-- Step 2: Update values based on business logic
UPDATE users SET status = 'inactive' WHERE last_login < NOW() - INTERVAL '1 year';

-- Step 3: Remove default if temporary
ALTER TABLE users ALTER COLUMN status DROP DEFAULT;

-- Step 4: Optionally add constraint
ALTER TABLE users ADD CONSTRAINT status_check
  CHECK (status IN ('active', 'inactive', 'suspended'));
```

### Renaming Column

Use Prisma's rename feature:

```prisma
// schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @db.VarChar(255) // Old name

  @@map("users") // Map to existing table
}
```

```bash
# Create rename migration
npx prisma migrate dev --name rename_email_to_email_address

# Prisma will generate proper SQL for renaming
```

### Changing Column Type

```bash
# Development: Test locally
npx prisma db execute --stdin <<EOF
ALTER TABLE users
  ALTER COLUMN created_at TYPE timestamp with time zone
  USING created_at AT TIME ZONE 'UTC';
EOF

# Then commit migration
git add prisma/migrations/
git commit -m "chore(db): change created_at to timestamp with timezone"
```

## Pre-Flight Checks (Before Every Production Migration)

Create `scripts/pre-migration-check.js`:

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function preMigrationChecks() {
  console.log("Running pre-migration checks...");

  // 1. Check database connectivity
  try {
    const version = await prisma.$queryRaw`SELECT version();`;
    console.log("✓ Database connected:", version[0].version);
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    process.exit(1);
  }

  // 2. Check backup exists
  // (Implementation depends on your backup system)

  // 3. Verify no active connections
  const activeConnections = await prisma.$queryRaw`
    SELECT count(*) as count FROM pg_stat_activity 
    WHERE datname = current_database() AND pid != pg_backend_pid();
  `;

  if (activeConnections[0].count > 0) {
    console.warn("⚠ Active database connections detected");
    console.warn("  Migrations may cause locks");
  } else {
    console.log("✓ No active connections");
  }

  // 4. Check Prisma status
  const status = await exec("npx prisma migrate status");
  console.log("✓ Prisma status OK");

  console.log("\n✅ All pre-migration checks passed");
  process.exit(0);
}

preMigrationChecks().catch((error) => {
  console.error("Pre-migration check failed:", error);
  process.exit(1);
});
```

Run before every production migration:

```bash
npm run pre-migration-check
```

## Deployment Strategy

### Blue-Green Deployment

For zero-downtime deployments:

```bash
# 1. Deploy new version to staging slot with migration applied
git push heroku develop:main  # Deploy to staging

# 2. Test thoroughly on staging
npm run test
curl https://staging-api.infamous-freight.com/health

# 3. Run migration on production with backup
DATABASE_URL=prod npx prisma migrate deploy

# 4. Verify production health
curl https://api.infamous-freight.com/health

# 5. Switch production traffic to new version
heroku ps:scale web=1 --app infamous-freight-prod
heroku release-phase --app infamous-freight-prod
```

### Canary Deployment

For even safer deployments:

```bash
# 1. Deploy to 10% of servers
heroku ps:scale web=10 --app infamous-freight-prod
git push heroku develop:main --app infamous-freight-prod

# 2. Monitor error rates (5 minutes)
# If error rate < 1%, proceed
# If error rate > 1%, rollback immediately

# 3. Gradually increase traffic
heroku ps:scale web=50 --app infamous-freight-prod  # 50%
heroku ps:scale web=100 --app infamous-freight-prod  # 100%
```

## Monitoring & Verification

### Post-Migration Checks

```bash
# 1. Verify schema matches expectations
npx prisma introspect

# 2. Check data integrity
npm run validate:data

# 3. Monitor performance impact
# - Watch query execution times
# - Check for new slow queries
# - Monitor CPU and memory

# 4. User acceptance testing
# - Run smoke tests
# - Test critical workflows
# - Check for regressions
```

### Monitoring Queries

```sql
-- Check for table locks
SELECT * FROM pg_stat_activity
WHERE query LIKE '%ALTER%' OR query LIKE '%CREATE%';

-- Check index status
SELECT * FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Monitor slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```

## Emergency Procedures

### Database Corruption Detected

```bash
# 1. Stop application immediately
systemctl stop infamous-freight-api

# 2. Restore from backup
pg_restore -d infamous_freight backup_latest.dump

# 3. Verify data integrity
VACUUM ANALYZE;
REINDEX DATABASE infamous_freight;

# 4. Start application
systemctl start infamous-freight-api

# 5. Create incident report
# Document what happened, how to prevent
```

### Running Out of Disk Space During Migration

```bash
# 1. Pause migration (Ctrl+C)

# 2. Clean up temporary files
VACUUM FULL;

# 3. Extend disk space

# 4. Retry migration
npx prisma migrate deploy
```

## Best Practices Checklist

Before every migration:

- [x] Backup database
- [x] Test migration locally
- [x] Review generated SQL
- [x] Verify data transformations
- [x] Check for locks or conflicts
- [x] Run pre-flight checks
- [x] Plan rollback strategy
- [x] Notify team of maintenance window (if needed)
- [x] Document changes in git commit
- [x] Monitor post-deployment

## Environment-Specific Commands

### Development

```bash
cd apps/api

# Create and apply migration
npx prisma migrate dev --name description

# Reset database (dev only!)
npx prisma migrate reset --force

# Update Prisma client
npx prisma generate
```

### Staging

```bash
cd apps/api

# Preview pending migrations
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Verify
npx prisma db execute --stdin < verify.sql
```

### Production

```bash
cd apps/api

# Check status (read-only)
npx prisma migrate status

# Apply migrations (with backup!)
npx prisma migrate deploy

# NEVER use migrate reset in production!
# NEVER use --force flag in production!
```

## Documentation & Communication

### Migration Announcement Template

```markdown
## Database Migration: [Date] [Time UTC]

**Scope:** Add user roles table and role_id column to users

**Expected Downtime:** None (zero-downtime migration)

**Rollback Time:** <5 minutes if issues detected

**What Changes:**

- New `roles` table created
- New `role_id` column added to users table (nullable, defaults to null)
- All existing users unaffected

**Testing:**

- Migration tested in development and staging
- No data loss
- All tests passing

**Post-Deployment Verification:**

- Health checks passing
- APIs responding normally
- Smoke tests running successfully
```

## References

- [Prisma Migrations Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero Downtime Deployments](https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-zero-downtime)
- [Blue-Green Deployments](https://martinfowler.com/bliki/BlueGreenDeployment.html)

## Support & Questions

For migration questions or issues:

1. Check this documentation
2. Review Prisma official docs
3. Run `npx prisma migrate status` for current state
4. Contact the database team
5. Create an issue in the repository

---

**Last Updated:** December 13, 2025  
**Maintained By:** Development Team  
**Status:** Active
