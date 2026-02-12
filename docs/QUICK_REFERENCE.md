# 📋 Quick Reference Card

## 🚀 Getting Started

```bash
# First time setup
./setup.sh

# Or manual setup
pnpm install
pnpm --filter @infamous-freight/shared build
```

## 💻 Development Commands

### Start Services

```bash
pnpm dev              # All services
pnpm api:dev          # API only (port 3001)
pnpm web:dev          # Web only (port 3000)
```

### Testing

````bash
pnpm test             # All tests
pnpm test:coverage    # With coverage
pnpm e2e              # E2E tests

### Codex CLI

```bash
# Verify Codex CLI
codex --version

# Start interactive agent
codex

# Non-interactive exec (see docs)
codex exec --help
````

````

### Code Quality

```bash
pnpm lint             # Check all code
pnpm lint:fix         # Auto-fix issues
pnpm format           # Format code
````

### Building

```bash
pnpm build            # Build all
pnpm --filter api build      # API only
pnpm --filter web build      # Web only
pnpm --filter shared build   # Shared only
```

## 📦 Shared Package Usage

### Import in API (JavaScript)

```javascript
const { HTTP_STATUS, formatCurrency } = require("@infamous-freight/shared");
```

### Import in Web (TypeScript)

```typescript
import { User, formatDate, SHIPMENT_STATUSES } from "@infamous-freight/shared";
```

## 🗂️ Project Structure

```
infamous-freight-enterprises/
├── apps/api/                    # Backend API
├── apps/web/                    # Frontend
├── apps/mobile/                 # Mobile app
├── packages/shared/        # Shared code
├── e2e/                    # E2E tests
└── docs/                   # Documentation
```

## 🔧 Common Tasks

### Update Dependencies

```bash
pnpm update --interactive --latest
```

### Clean & Reinstall

```bash
pnpm clean
pnpm install
```

### Database Operations

```bash
cd apps/api
pnpm prisma:migrate:dev     # Run migrations
pnpm prisma:generate        # Generate client
pnpm prisma:studio          # Open GUI
pnpm prisma:seed            # Seed data
```

### Add New Dependency

```bash
# To specific package
pnpm --filter api add express

# To shared
pnpm --filter @infamous-freight/shared add lodash

# To root
pnpm add -w prettier
```

## 📚 Documentation

- [Main README](README.md) - Project overview
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration instructions
- [IMPROVEMENTS_COMPLETE.md](IMPROVEMENTS_COMPLETE.md) - What changed
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - All docs

## 🐛 Troubleshooting

### Module not found: @infamous-freight/shared

```bash
pnpm --filter @infamous-freight/shared build
```

### Port already in use

```bash
lsof -ti:3001 | xargs kill -9  # API
lsof -ti:3000 | xargs kill -9  # Web
```

### Prisma client issues

```bash
cd apps/api && pnpm prisma:generate
```

### Git hooks not running

```bash
pnpm prepare
chmod +x .husky/pre-commit
```

## 🌐 URLs

- API: <http://localhost:3001>
- Web: <http://localhost:3000>
- API Docs: <http://localhost:3001/api-docs>

## 🔑 Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

See [.env.guide.md](.env.guide.md) for all variables.

## 🎯 Pre-commit Checks

Automatically runs on `git commit`:

- Linting
- Formatting
- Type checking

To bypass (not recommended):

```bash
git commit --no-verify
```

## ⚡ Pro Tips

1. Use `pnpm -r` to run commands in all workspaces
2. Use `pnpm --filter` to target specific packages
3. Shared package changes require rebuild: `pnpm --filter shared build`
4. Check workspace structure: `pnpm list --depth=0`
5. Verify dependencies: `pnpm why <package-name>`

---

**Need help?** See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for complete docs.
