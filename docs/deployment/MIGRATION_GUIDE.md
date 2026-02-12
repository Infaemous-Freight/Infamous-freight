# Migration to Monorepo Architecture

## What Changed

### Architecture

- ✅ Converted to pnpm workspace monorepo
- ✅ Created shared package for common code
- ✅ Consolidated duplicate structure (infamous-freight-ai)
- ✅ Added mobile app as workspace package
- ✅ Organized documentation

### Package Management

- **Before**: npm with individual package-lock.json files
- **After**: pnpm with single pnpm-lock.yaml

### CI/CD

- Updated GitHub Actions to use pnpm
- Enhanced codecov integration for monorepo
- Improved test coverage reporting

### Code Quality

- Pre-commit hooks with Husky (already existed, updated for pnpm)
- Lint-staged for automatic code formatting
- Centralized ESLint and Prettier config

## Migration Steps

### 1. Install pnpm

```bash
npm install -g pnpm@8
```

### 2. Clean old dependencies

```bash
# Remove all node_modules
pnpm clean

# Or manually:
rm -rf node_modules apps/api/node_modules apps/web/node_modules apps/mobile/node_modules packages/*/node_modules
rm -rf package-lock.json apps/api/package-lock.json apps/web/package-lock.json
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Build shared package

```bash
pnpm --filter @infamous-freight/shared build
```

### 5. Setup environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 6. Setup Husky hooks

```bash
pnpm prepare
```

### 7. Run migrations (if needed)

```bash
cd apps/api
pnpm prisma:migrate:dev
pnpm prisma:generate
```

## New Commands

### Development

```bash
# Start all services
pnpm dev

# Start specific service
pnpm api:dev
pnpm web:dev

# Start individual service directly
pnpm --filter infamous-freight-api dev
pnpm --filter infamous-freight-web dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Test specific service
pnpm --filter infamous-freight-api test
```

### Building

```bash
# Build all
pnpm build

# Build specific service
pnpm --filter infamous-freight-web build
```

### Linting

```bash
# Lint all services
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

## Using Shared Package

### In API (apps/api/src/example.js)

```javascript
const {
  HTTP_STATUS,
  formatCurrency,
  generateTrackingNumber,
} = require("@infamous-freight/shared");

// Use constants
res.status(HTTP_STATUS.OK).json({ success: true });

// Use utilities
const trackingNumber = generateTrackingNumber();
const price = formatCurrency(1999.99);
```

### In Web (apps/web/pages/index.tsx)

```typescript
import { User, ShipmentStatus, formatDate } from "@infamous-freight/shared";

const user: User = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const formattedDate = formatDate(new Date());
```

## Benefits

### Developer Experience

- **Single command** to install all dependencies
- **Faster installs** with pnpm's efficient caching
- **Type safety** with shared TypeScript types
- **Code reuse** through shared utilities

### CI/CD

- **Faster builds** with better caching
- **Unified testing** across services
- **Better coverage reporting**

### Maintenance

- **DRY principle** - shared code in one place
- **Consistent patterns** across services
- **Easier refactoring** with shared types

## Troubleshooting

### pnpm not found

```bash
npm install -g pnpm@8
```

### Module not found: @infamous-freight/shared

```bash
# Build the shared package first
pnpm --filter @infamous-freight/shared build

# Then rebuild your service
pnpm --filter infamous-freight-api build
```

### Prisma client issues

```bash
cd apps/api
pnpm prisma:generate
```

### Port already in use

```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9  # API
lsof -ti:3000 | xargs kill -9  # Web
```

## Rollback (if needed)

If you need to rollback to npm:

```bash
# 1. Remove pnpm files
rm pnpm-lock.yaml .npmrc pnpm-workspace.yaml

# 2. Reinstall with npm
npm install
cd apps/api && npm install
cd ../apps/web && npm install

# 3. Use npm commands
npm run dev
```

## Next Steps

1. ✅ Dependencies installed
2. ✅ Shared package built
3. ✅ Environment configured
4. ✅ Database migrated
5. ✅ Tests passing
6. 🚀 Start developing!

## Questions?

See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for complete documentation.
