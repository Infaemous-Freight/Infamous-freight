/*

* Prisma Database Migration Guide
* For Infamous Freight Enterprises
 */

# Prerequisites

1. PostgreSQL database running and accessible
2. DATABASE_URL environment variable set
3. Prisma CLI available: `npx prisma --version`

# Migration Workflow

## Development (Recommended)

```bash
# 1. Update schema.prisma with new models/changes
# 2. Create and apply migration
cd api
pnpm prisma:migrate:dev --name describe_your_change

# 3. Review generated SQL in migrations folder
# 4. Generate Prisma Client
pnpm prisma:generate

# 5. (Optional) View data in Studio
pnpm prisma:studio
```

## Production

```bash
# 1. Review pending migrations
cd api
pnpm prisma:migrate:status

# 2. Apply all pending migrations (non-interactive)
pnpm prisma:migrate:deploy

# 3. Verify with health check
curl http://localhost:4000/api/health/detailed
```

# Common Scenarios

## Adding a new model

1. Add to schema.prisma
2. Run `pnpm prisma:migrate:dev --name add_new_model`
3. Indexes are auto-applied based on @index directives

## Adding indexes for performance

1. Add `@@index([field])` or `@@index([field1, field2])` to model
2. Run `pnpm prisma:migrate:dev --name add_indexes_to_model`
3. Verify with database query metrics

## Rolling back a migration (dev only)

```bash
# Reset local database (DESTRUCTIVE!)
cd api
pnpm prisma:migrate:resolve --rolled-back migration_name
```

## Checking migration status

```bash
cd api
pnpm prisma:migrate:status
# Output shows:
# - Pending migrations (not yet applied)
# - Applied migrations
# - Any drift between schema.prisma and database
```

# Index Strategy

## Current Indexes (as of schema update)

### High-Priority Indexes (Hot Paths)
* `shipments`: status, driverId, createdAt, trackingId
* `payments`: userId, status, createdAt
* `subscriptions`: userId, status
* `users`: email, role

### Composite Indexes (Query Optimization)
* `shipments(status, createdAt DESC)` - for filtered listings
* `payments(userId, status, createdAt DESC)` - for user revenue reports

### Foreign Key Indexes
* `shipments.driverId` - automatically indexed
* All user references - see User model relationships

## Index Size Monitoring

```sql
-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check slow queries (enable log_statement = 'all')
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

# Maintenance

## Analyzing Query Plans

```sql
-- Before optimization
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shipments 
WHERE status = 'pending' 
ORDER BY createdAt DESC 
LIMIT 10;

-- Should use index: shipments_status_createdAt_idx
-- Verify with EXPLAIN output
```

## Vacuum and Analyze (weekly)

```bash
cd api
# Run via Prisma
pnpm prisma db execute --stdin < vacuum.sql

# Or directly in psql
ANALYZE; -- Updates table statistics for query planner
VACUUM ANALYZE; -- Reclaims space + analyzes
```

## Monitoring Replication Lag (if applicable)

For replicated databases, ensure migrations are applied to all replicas before code deployment.

# Troubleshooting

## "relation does not exist"

Your migration likely wasn't applied. Run:

```bash
cd api
pnpm prisma:migrate:deploy
```

## "index already exists"

Migration tried to create duplicate index. Resolve:

```bash
cd api
pnpm prisma:migrate:resolve --rolled-back migration_name
# Then update schema.prisma and retry
```

## Performance degradation after migration

1. Run `ANALYZE` to update table statistics
2. Review new index bloat with the size query above
3. Check for missing indexes on new columns

## Connection pool exhausted

If `max_connections` is hit, check:

```sql
SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;
```

Increase `DATABASE_URL` pool size if needed.

# Integration with CI/CD

See [.github/workflows/ci.yml](.github/workflows/ci.yml):
* Migrations applied before tests
* Shared package built first
* All type checks pass before build

# References

* [Prisma Documentation](https://www.prisma.io/docs/)
* [PostgreSQL Query Planner](https://www.postgresql.org/docs/current/sql-explain.html)
* [Index Design Best Practices](https://www.postgresql.org/docs/current/indexes.html)
