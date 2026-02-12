# Prisma Migrations Guide

## Quick Commands

```bash
# Generate Prisma Client (after schema changes)
cd apps/api && pnpm prisma:generate

# Create a new migration (development)
cd apps/api && pnpm prisma:migrate:dev --name descriptive_name

# Apply migrations (production)
cd apps/api && pnpm prisma:migrate

# Open Prisma Studio (database GUI)
cd apps/api && pnpm prisma:studio

# Reset database (⚠️ DEVELOPMENT ONLY)
cd apps/api && pnpm prisma migrate reset
```

## Migration Workflow

### 1. Development Workflow
```bash
# Edit apps/api/prisma/schema.prisma
# Add fields, indexes, or models

# Create migration
cd apps/api
pnpm prisma:migrate:dev --name add_user_indexes

# Prisma will:
# - Generate SQL migration file
# - Apply migration to dev DB
# - Regenerate Prisma Client
```

### 2. Production Deployment
```bash
# Apply pending migrations
cd apps/api
pnpm prisma:migrate

# Or use deploy command directly
npx prisma migrate deploy
```

## Performance Indexes Added (2026-02-07)

### Users
- `role` - Filter by user role
- `createdAt` - Sort/filter by registration date

### Drivers
- `status` - Find available drivers
- `createdAt` - Sort drivers by join date

### Shipments
- `status` - Filter by shipment status
- `driverId` - Find shipments by driver
- `createdAt` - Sort by creation date
- `(status, createdAt)` - Composite index for filtered sorts

### AiEvents
- `userId` - Get user's AI history
- `createdAt` - Recent events
- `(userId, createdAt)` - User history sorted

### Payments
- `userId` - User payment history
- `status` - Filter by payment status
- `createdAt` - Recent payments
- `(userId, status, createdAt)` - Complex queries

### Subscriptions
- `userId` - User subscriptions
- `status` - Active subscriptions
- `(userId, status)` - User's active subs
- `currentPeriodEnd` - Upcoming renewals

## Schema Changes

### Shipments
- Added `reference` field (unique, replacing trackingId as primary reference)
- Made `trackingId` optional for backward compatibility

### Payments
- Changed `amount` from `Int` (cents) to `Decimal(10,2)` (dollars)
- Added `stripePaymentIntentId` for Stripe integration
- Added `type` field (ONE_TIME/RECURRING)
- Added `description` and `metadata` fields

### Subscriptions
- Added `stripeSubscriptionId`, `stripeCustomerId`, `stripePriceId`
- Made `tier`, `amount`, `email` optional
- Renamed legacy `stripeId` to `stripe_id_legacy`

### StripeCustomers
- Renamed `stripeId` to `stripeCustomerId` for clarity
- Added index on `stripeCustomerId`

## Best Practices

### DO ✅
- Always test migrations on development database first
- Use descriptive migration names: `add_payment_indexes` not `update`
- Add indexes for foreign keys
- Add indexes for frequently queried fields
- Use composite indexes for multi-field queries
- Run `prisma:generate` after schema changes
- Commit both schema.prisma and migration files

### DON'T ❌
- Never edit migration files after they're applied
- Never use `migrate reset` in production
- Don't skip migrations (apply in order)
- Don't add indexes on every field (overhead)
- Don't forget to update Prisma Client after schema changes

## Troubleshooting

### Migration Out of Sync
```bash
# Check migration status
npx prisma migrate status

# If dev DB is out of sync
npx prisma migrate reset  # ⚠️ DEV ONLY

# If prod DB is out of sync
# Manually fix DB then mark migration as applied
npx prisma migrate resolve --applied "20260207000000_migration_name"
```

### Schema Drift Detected
```bash
# Your database schema differs from migrations
# Option 1: Create migration to fix
npx prisma migrate dev --create-only --name fix_drift

# Option 2: Reset dev database
npx prisma migrate reset  # ⚠️ DEV ONLY
```

### Prisma Client Out of Date
```bash
# Regenerate client
npx prisma generate

# Or install and generate
pnpm install @prisma/client
npx prisma generate
```

## Common Queries with Indexes

```typescript
// Uses status index
const pending = await prisma.shipment.findMany({
  where: { status: 'pending' }
});

// Uses (status, createdAt) composite index
const recentPending = await prisma.shipment.findMany({
  where: { status: 'pending' },
  orderBy: { createdAt: 'desc' }
});

// Uses (userId, status, createdAt) composite index
const userSuccessfulPayments = await prisma.payment.findMany({
  where: {
    userId: 'user_123',
    status: 'succeeded'
  },
  orderBy: { createdAt: 'desc' }
});

// Uses (userId, status) composite index
const activeSubscriptions = await prisma.subscription.findMany({
  where: {
    userId: 'user_123',
    status: 'active'
  }
});
```

## Index Monitoring

Check index usage in PostgreSQL:
```sql
-- See index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%';
```

## Resources

- [Prisma Migrations Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Index Performance](https://www.postgresql.org/docs/current/indexes-types.html)
