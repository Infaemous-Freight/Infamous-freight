# 🏗️ Build Guide - Infamous Freight Enterprises

**Last Updated**: February 1, 2026  
**Status**: Production Ready ✅

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 24.13.0 (or >=20 <25) | JavaScript runtime |
| **pnpm** | >=10.0.0 | Fast package manager |
| **Git** | Latest | Version control |

### Installation

```bash
# Install Node.js (via nvm recommended)
nvm install 24.13.0
nvm use 24.13.0

# Install pnpm globally
npm install -g pnpm@latest

# Verify installations
node --version    # Should show v24.13.0
pnpm --version    # Should show 10.x.x or higher
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight-enterprises
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This installs:
# - packages/shared (shared types/constants)
# - apps/api (Express.js backend)
# - apps/web (Next.js frontend)
# - apps/mobile (React Native/Expo)
# - apps/ai (AI services)
```

### 3. Configure Environment Variables

#### Web App (.env.local)

```bash
cd apps/web
cp .env.example .env.local
```

**Required for Build:**

```env
# Minimum required for static generation
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
API_BASE_URL=http://localhost:4000/api
```

#### API (.env)

```bash
cd apps/api
cp .env.example .env
```

**Required for Build:**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/infamous_freight
JWT_SECRET=your_secret_key_minimum_32_characters
```

## Build Commands

### Full Workspace Build

```bash
# From root directory
pnpm build

# What this does:
# 1. Builds packages/shared (TypeScript → JavaScript)
# 2. Validates apps/api (syntax check)
# 3. Builds apps/web (Next.js production build)
# 4. Skips mobile/ai (build not configured)
```

**Expected Output:**

```
✓ packages/shared build (TypeScript compilation)
✓ apps/api build (Node.js syntax validation)
✓ apps/web build (Next.js production bundle)
  - 32 static pages generated
  - Build time: ~8-15 seconds
```

### Individual Package Builds

```bash
# Build shared types package
pnpm --filter @infamous-freight/shared build

# Build web app only
pnpm --filter web build

# Build API only
pnpm --filter api build

# Fast build (skip type checking)
pnpm build:fast
```

### Development Build

```bash
# Start all services in dev mode
pnpm dev

# Start individual services
pnpm --filter web dev      # Web on port 3000
pnpm --filter api dev      # API on port 4000
```

## Build Outputs

### packages/shared

- **Location**: `packages/shared/dist/`
- **Contents**: Compiled TypeScript (.js + .d.ts)
- **Used by**: All other apps

### apps/web

- **Location**: `apps/web/.next/`
- **Output Mode**: Standalone (optimized for Docker/Fly.io)
- **Bundle Size**:
  - First Load JS: ~120-150KB (target)
  - Total Static: ~2-5MB

### apps/api

- **Validation**: Syntax check only (no compilation)
- **Runtime**: Direct Node.js execution

## Troubleshooting

### ❌ "pnpm: command not found"

```bash
# Install pnpm globally
npm install -g pnpm@latest

# Or use corepack (Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

### ❌ "Unsupported pnpm version"

```bash
# Current error: Expected >=10.0.0, Got: 8.15.9
pnpm --version

# Solution: Upgrade pnpm
npm install -g pnpm@latest
pnpm --version  # Should show 10.x.x
```

### ❌ "Cannot find module '@infamous-freight/shared'"

```bash
# Rebuild shared package
pnpm --filter @infamous-freight/shared build

# Then rebuild dependent apps
pnpm --filter web build
```

### ❌ "Missing Supabase environment variables"

**Cause**: Static page generation requires Supabase config at build time.

**Solution**: Add placeholder values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
```

### ❌ TypeScript Errors During Build

```bash
# Temporary: Skip type checking
NEXT_PUBLIC_SKIP_TYPE_CHECK=1 pnpm build

# Proper fix: Check types first
pnpm --filter web typecheck
# Fix reported errors, then:
pnpm build
```

### ❌ "Port 3000 already in use"

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
WEB_PORT=3001 pnpm --filter web dev
```

### ❌ Build Hangs or Times Out

```bash
# Clear caches
rm -rf apps/web/.next
rm -rf node_modules/.cache

# Reinstall dependencies
pnpm install --force

# Try build again
pnpm build
```

## Performance Optimization

### Bundle Analysis

```bash
cd apps/web
ANALYZE=true pnpm build

# Opens browser with interactive bundle visualization
# Target: First Load JS < 150KB
```

### Build Caching

```bash
# Enable Turbopack caching (Next.js 16+)
# Already configured in next.config.js

# Clear Next.js cache if needed
rm -rf apps/web/.next/cache
```

### Incremental Builds

```bash
# TypeScript incremental compilation (already enabled)
# Location: apps/web/.next/cache/.tsbuildinfo
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml (already configured)
- uses: actions/setup-node@v4
  with:
    node-version: "22"
    cache: 'pnpm'

- run: corepack enable
- run: pnpm install --frozen-lockfile
- run: pnpm build
```

### Docker Build

```bash
# Build web app Docker image
docker build -f apps/web/Dockerfile -t infamous-freight-web .

# Build API Docker image
docker build -f apps/api/Dockerfile -t infamous-freight-api .
```

## Build Metrics

**Current Performance:**

- **Full Build Time**: 8-15 seconds
- **Incremental Build**: 2-5 seconds
- **packages/shared**: ~600-700ms
- **apps/api**: ~35-50ms
- **apps/web**: 4-8 seconds

**Targets:**

- Full build: < 60 seconds
- Incremental: < 5 seconds
- Type check: < 10 seconds

## Advanced Options

### Custom Build Configuration

```bash
# Production build with analytics
ANALYZE=true pnpm build

# Development build (faster, no optimization)
NODE_ENV=development pnpm build

# Build with verbose output
DEBUG=* pnpm build
```

### Build Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm build:shared` | Build shared types only |
| `pnpm build:web` | Build web app only |
| `pnpm build:api` | Validate API syntax |
| `pnpm build:fast` | Skip type checking |
| `pnpm typecheck` | Check types only |
| `pnpm lint` | Lint all packages |

## Support

**Issues?** Check:

1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. [GitHub Issues](https://github.com/MrMiless44/Infamous-freight/issues)
3. [CONTRIBUTING.md](./CONTRIBUTING.md)

**Success Indicators:**

- ✅ All builds complete without errors
- ✅ Type checking passes
- ✅ Tests pass (optional for build)
- ✅ Linting passes (optional for build)

---

**Next Steps:**

- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Command cheat sheet
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deploy to production
- [DEVELOPER_WORKFLOW.md](./docs/DEVELOPER_WORKFLOW.md) - Development guide
