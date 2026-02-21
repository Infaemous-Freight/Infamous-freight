# Prisma Database Setup & Migrations

This document outlines the Prisma ORM setup, database migrations, and schema
management for Infamous Freight Enterprises.

## Quick Start

### 1. Initialize Database (First Time)

```bash
# From project root
cd api

# Generate Prisma Client
pnpm prisma:generate

# Create database and run migrations
pnpm prisma:migrate:dev --name init

# Seed with test data (optional)
pnpm prisma:seed
```

### 2. After Schema Changes

```bash
cd api

# Create a new migration
pnpm prisma:migrate:dev --name <description>
# Example: pnpm prisma:migrate:dev --name add_user_indexes

# Generate updated Prisma Client
pnpm prisma:generate
```

### 3. View Data (Development)

```bash
cd api

# Open Prisma Studio UI
pnpm prisma:studio
# Opens at http://localhost:5555
```

## Available Commands

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| `pnpm prisma:generate`    | Generate Prisma Client from schema     |
| `pnpm prisma:migrate:dev` | Create & apply migration (development) |
| `pnpm prisma:migrate`     | Apply pending migrations (production)  |
| `pnpm prisma:studio`      | Open Prisma Studio UI                  |
| `pnpm prisma:seed`        | Run seed script (optional)             |

## Schema Structure

### Core Models

#### `users`

- Primary identity model
- Email-based uniqueness
- Role-based access control (admin, user, driver)
- Indexes: email, role, createdAt

#### `drivers`

- Freight drivers
- Status tracking (available, unavailable, on-duty)
- Unique email per driver
- Indexes: status, email, createdAt

#### `shipments`

- Freight shipments
- Relationship to drivers (optional, many-to-one)
- Status tracking (created, picked_up, in_transit, delivered, cancelled)
- Unique tracking ID and reference
- Indexes: driverId, status, createdAt, reference

#### `payments`

- Payment transaction records
- Stripe integration (stripePaymentIntentId)
- Type tracking (ONE_TIME, recurring)
- Indexes: userId, status, createdAt, stripePaymentIntentId

#### `subscriptions`

- Recurring billing subscriptions
- Stripe integration (stripeSubscriptionId, stripeCustomerId)
- Status tracking (active, paused, cancelled)
- Period tracking (currentPeriodStart, currentPeriodEnd)
- Indexes: userId, status, createdAt, stripeSubscriptionId

#### `stripe_customers`

- Stripe customer mapping
- Links user to Stripe customer ID
- Indexes: stripeCustomerId

#### `ai_events`

- AI command history & logging
- Type tracking (shipment.created, shipment.status.changed, etc.)
- JSON payload support
- Indexes: userId, type, createdAt

## Database Indexes

All hot-path queries are indexed for optimal performance:

### By Query Type

**User Queries:**

- `users.email` (unique)
- `users.role` (filtering)
- `users.createdAt` (sorting)

**Driver Queries:**

- `drivers.status` (availability checks)
- `drivers.email` (lookup)
- `drivers.createdAt` (sorting)

**Shipment Queries:**

- `shipments.driverId` (foreign key)
- `shipments.status` (filtering)
- `shipments.reference` (lookup)
- `shipments.createdAt` (sorting)

**Payment Queries:**

- `payments.userId` (aggregation)
- `payments.status` (filtering: succeeded, failed, pending)
- `payments.stripePaymentIntentId` (lookup)
- `payments.createdAt` (date range)

**Subscription Queries:**

- `subscriptions.userId` (lookup)
- `subscriptions.status` (filtering: active, cancelled)
- `subscriptions.stripeSubscriptionId` (lookup)
- `subscriptions.createdAt` (sorting)

## Foreign Keys & Relationships

All relationships use proper foreign key constraints:

```prisma
// One Shipment → One Driver (optional)
shipment.driver → driver.id (onDelete: SET NULL)

// Many AiEvents → One User
aiEvent.user → user.id (onDelete: CASCADE)

// Many Payments → One User
payment.user → user.id (onDelete: CASCADE)

// Many Subscriptions → One User
subscription.user → user.id (onDelete: CASCADE)

// Many StripeCustomers → One User
stripeCustomer.user → user.id (onDelete: CASCADE)
```

## Migration Workflow

### Creating Migrations

1. **Modify schema** in `api/prisma/schema.prisma`
2. **Run migration** with descriptive name:
   ```bash
   cd api
   pnpm prisma:migrate:dev --name add_notification_preferences
   ```
3. **Review SQL** in `api/prisma/migrations/<timestamp>_<name>/migration.sql`
4. **Commit migration** to version control
5. **Test** with seed data

### Conflict Resolution

If migration conflicts occur:

```bash
# View migration status
cd api && npx prisma migrate status

# Reset development database (⚠️ DESTRUCTIVE)
cd api && npx prisma migrate reset --force
```

## Performance Considerations

### Query Optimization

```javascript
// ❌ Inefficient: N+1 queries
const shipments = await prisma.shipment.findMany();
for (const s of shipments) {
  s.driver = await prisma.driver.findUnique({ where: { id: s.driverId } });
}

// ✅ Efficient: Include related data
const shipments = await prisma.shipment.findMany({
  include: { driver: true },
});

// ✅ Efficient: Use select for filtered fields
const shipments = await prisma.shipment.findMany({
  where: { status: "in_transit" },
  select: {
    id: true,
    reference: true,
    driver: { select: { name: true, phone: true } },
  },
});
```

### Aggregation Optimization

```javascript
// Batch operations for performance
const [userCount, activeShipments, revenueThisMonth] = await Promise.all([
  prisma.user.count(),
  prisma.shipment.count({ where: { status: "in_transit" } }),
  prisma.payment.aggregate({
    where: {
      status: "succeeded",
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  }),
]);
```

## Seeding Data

The seed script (`api/prisma/seed.js`) creates test data:

```bash
cd api
pnpm prisma:seed
```

**Creates:**

- 2 test users (admin, regular user)
- 2 test drivers
- 1 test shipment

## CI/CD Integration

CI pipeline includes Prisma validation:

```yaml
# .github/workflows/ci.yml
- name: Prisma validate
  run: cd api && pnpm prisma validate

- name: Prisma format check
  run: cd api && pnpm prisma format --check
```

## Troubleshooting

### Connection Issues

```bash
# Test database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/db npx prisma db execute --stdin <<< "SELECT 1"
```

### Schema Out of Sync

```bash
# Reset and rebuild (development only)
cd api && npx prisma migrate reset --force

# Then rebuild and seed
pnpm prisma:generate
pnpm prisma:seed
```

### Slow Queries

```bash
# Check query performance
# Enable query logging in .env:
# DATABASE_URL="postgresql://...?logqueries=true"

# Use EXPLAIN in Prisma Studio or directly:
# SELECT * FROM shipments WHERE status = 'in_transit';
# With INDEX on status, should use index scan
```

## Environment Setup

Create `.env.local` for development:

```dotenv
# Database (PostgreSQL required)
DATABASE_URL="postgresql://username:password@localhost:5432/infamous_freight_dev"

# Optional: Test database
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/infamous_freight_test"
```

## Best Practices

1. **Always use migrations** for schema changes
2. **Test migrations** on a copy of production data
3. **Use transactions** for multi-table operations
4. **Index wisely** - add indexes for frequently queried fields
5. **Use select/include** to avoid N+1 queries
6. **Document changes** in migration names
7. **Review SQL** before applying in production
8. **Backup database** before running reset command
