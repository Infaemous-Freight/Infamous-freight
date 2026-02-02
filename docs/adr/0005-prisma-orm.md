# ADR-0005: Prisma ORM for Database Management

## Status

Accepted

## Context

The API service needed an ORM/database abstraction layer for PostgreSQL. Requirements:

- Type-safe database queries
- Migration management
- Relationship handling
- Development productivity (auto-completion, type checking)
- Good documentation and community support
- Compatible with CommonJS Node.js

Options evaluated:

1. **Prisma**: Modern ORM with schema-first approach
2. **Sequelize**: Established ORM with extensive features
3. **TypeORM**: TypeScript-first ORM
4. **Knex.js**: Query builder without full ORM features
5. **Raw SQL**: Direct PostgreSQL client (pg)

## Decision

We chose **Prisma ORM** as our database abstraction layer.

**Schema definition** (`api/prisma/schema.prisma`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  shipments Shipment[]
}

model Shipment {
  id             String   @id @default(cuid())
  trackingNumber String   @unique
  origin         String
  destination    String
  status         String   @default("pending")
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Migration workflow:**

```bash
# 1. Edit schema.prisma
# 2. Create migration
pnpm prisma:migrate:dev --name add_shipment_priority

# 3. Generate client
pnpm prisma:generate

# 4. Apply in production
pnpm prisma:migrate:deploy
```

**Usage in API:**

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Type-safe queries with auto-completion
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
  include: { shipments: true },
});
```

## Rationale

**Why Prisma over alternatives:**

| Feature         | Prisma       | Sequelize   | TypeORM      | Raw SQL            |
| --------------- | ------------ | ----------- | ------------ | ------------------ |
| Type safety     | ✅ Excellent | ⚠️ Limited  | ✅ Good      | ❌ None            |
| Auto-completion | ✅ Yes       | ⚠️ Partial  | ✅ Yes       | ❌ No              |
| Migration tools | ✅ Built-in  | ⚠️ External | ✅ Built-in  | ❌ Manual          |
| Learning curve  | ✅ Low       | ⚠️ Medium   | ⚠️ Medium    | ⚠️ High            |
| Performance     | ✅ Good      | ✅ Good     | ⚠️ Issues    | ✅ Optimal         |
| Documentation   | ✅ Excellent | ⚠️ Outdated | ⚠️ Scattered | ✅ PostgreSQL docs |

**Prisma advantages:**

1. **Schema as source of truth**: Single declarative schema file
2. **Type generation**: TypeScript types auto-generated from schema
3. **Migration safety**: Detects schema drift, validates changes
4. **Developer experience**: Best-in-class auto-completion and error messages
5. **Prisma Studio**: Visual database browser (GUI)
6. **Active development**: Regular updates, modern practices

**Sequelize drawbacks:**

- Older API design (callback-heavy)
- Weaker TypeScript support
- Migration system less robust
- Documentation often outdated

**TypeORM drawbacks:**

- Decorator-heavy (verbose)
- Performance issues reported at scale
- Migration system can be fragile
- Less intuitive API

## Consequences

**Positive:**

- ✅ Type-safe queries prevent runtime errors
- ✅ Auto-completion speeds up development
- ✅ Schema changes tracked in git-friendly migrations
- ✅ Prisma Studio provides GUI for data inspection
- ✅ Generated client optimized for queries
- ✅ Easy relationship traversal: `include: { shipments: true }`
- ✅ Transaction support: `prisma.$transaction()`

**Negative:**

- ❌ Additional build step (generate client after schema changes)
- ❌ Opinionated schema format (can't use custom SQL features easily)
- ❌ Generated client adds ~5MB to node_modules
- ❌ Learning curve for developers unfamiliar with Prisma
- ❌ Some advanced PostgreSQL features require raw SQL escape hatch

**Performance considerations:**

```javascript
// ✅ GOOD: Efficient query with select
const users = await prisma.user.findMany({
  select: { id: true, email: true }  // Only fetch needed fields
});

// ❌ BAD: Over-fetching
const users = await prisma.user.findMany();  // Fetches all fields

// ✅ GOOD: Use transactions for consistency
await prisma.$transaction([
  prisma.user.update({ where: { id: '1' }, data: { ... } }),
  prisma.shipment.create({ data: { userId: '1', ... } })
]);
```

**Critical workflows:**

```bash
# Development: Create and apply migration
cd api
pnpm prisma:migrate:dev --name descriptive_change_name

# Production: Apply pending migrations
pnpm prisma:migrate:deploy

# Reset database (DESTRUCTIVE - dev only)
pnpm prisma:migrate:reset

# Open database GUI
pnpm prisma:studio

# Generate client after pulling schema changes
pnpm prisma:generate
```

## Escape Hatches

For complex queries not supported by Prisma:

```javascript
// Raw SQL queries
const result = await prisma.$queryRaw`
  SELECT * FROM "User" 
  WHERE "createdAt" > NOW() - INTERVAL '7 days'
`;

// Raw execute (INSERT/UPDATE/DELETE)
await prisma.$executeRaw`
  UPDATE "Shipment" 
  SET "status" = 'delivered' 
  WHERE "id" = ${shipmentId}
`;
```

## Migration from Raw SQL

If we later need more control:

1. Prisma supports `@db.` attributes for PostgreSQL-specific types
2. Can use `prisma migrate diff` to generate migrations from existing DB
3. Prisma Migrate can be replaced while keeping Prisma Client
4. Raw SQL always available via `$queryRaw` / `$executeRaw`

## Related

- [ADR-0002: Shared Package Pattern](0002-shared-package-pattern.md) - Types defined in shared, Prisma models in API
- Prisma Documentation: <https://www.prisma.io/docs>
- [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md) - Migration best practices
