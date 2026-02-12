# 🚀 Developer Onboarding Guide

Welcome to **Infæmous Freight Enterprises**! This guide will help you set up your development environment and start contributing in ~15 minutes.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [x] **Node.js 20+** - Download from [nodejs.org](https://nodejs.org)
- [x] **pnpm 9+** - Install via `npm install -g pnpm`
- [x] **Docker Desktop** - For local API development ([docker.com](https://docker.com))
- [x] **Git** - Version control
- [x] **GitHub account** - With repo access
- [x] **Code editor** - VS Code recommended

### Quick Install (macOS/Linux)

```bash
# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm@9

# Install Docker Desktop
# Download from https://docker.com/products/docker-desktop
```

---

## ⚡ Quick Start (15 minutes)

### Step 1: Clone Repository (2 min)

```bash
git clone git@github.com:MrMiless44/Infamous-freight.git
cd Infamous-freight
```

### Step 2: Install Dependencies (5 min)

```bash
# Install all workspace dependencies
pnpm install

# This installs dependencies for:
# - Root workspace
# - apps/web (Next.js frontend)
# - apps/api (Express.js backend)
# - apps/mobile (React Native)
# - packages/shared (Shared utilities)
```

### Step 3: Environment Configuration (5 min)

```bash
# Copy example environment file
cp .env.example .env.local

# Fill in required variables (see below)
nano .env.local  # or use your preferred editor
```

**Required Environment Variables:**

```bash
# Database (get from team lead or use local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infamous_freight

# JWT Secret (for development)
JWT_SECRET=dev-secret-change-in-production-minimum-32-chars

# API Configuration
API_PORT=4000
WEB_PORT=3000
NODE_ENV=development

# Optional: Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Getting Credentials:**

- **Production DB URL**: Ask team lead (stored in 1Password vault)
- **Supabase Keys**: In 1Password under "Infamous Freight - Supabase"
- **Sentry DSN**: In Sentry dashboard (shared access)
- **Stripe Keys**: In 1Password under "Infamous Freight - Stripe"

### Step 4: Build Shared Package (1 min)

```bash
# The shared package must be built before starting services
pnpm build:shared
```

### Step 5: Start Development Servers (2 min)

```bash
# Start all services in parallel
pnpm dev

# Or start individually:
pnpm dev:web    # Web app on http://localhost:3000
pnpm dev:api    # API on http://localhost:4000
```

### Step 6: Verify Setup (1 min)

Open your browser and verify:

- ✅ Web app: [http://localhost:3000](http://localhost:3000)
- ✅ API health: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- ✅ Supabase Studio: `pnpm supabase:studio` → [http://localhost:54323](http://localhost:54323)

---

## 🏗️ Project Structure

```
infamous-freight/
├── apps/
│   ├── apps/web/                  # Next.js 16 frontend (TypeScript)
│   │   ├── pages/           # Route pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities, hooks
│   │   ├── proxy.ts         # Edge middleware
│   │   └── next.config.js   # Next.js config
│   ├── apps/api/                  # Express.js backend (CommonJS)
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── middleware/  # Auth, validation, errors
│   │   │   ├── services/    # Business logic
│   │   │   └── server.js    # Express app
│   │   └── prisma/          # Database schema
│   └── apps/mobile/               # React Native (Expo)
├── packages/
│   └── shared/               # Shared types, constants, utils
│       └── src/
│           ├── types.ts      # TypeScript types
│           ├── constants.ts  # Shared constants
│           └── utils.ts      # Shared utilities
├── e2e/                      # Playwright end-to-end tests
├── .github/
│   └── workflows/            # CI/CD pipelines
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Workspace definition
└── .env.example              # Environment template
```

---

## 🔄 Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-amazing-feature

# 3. Make your changes
# ... edit files ...

# 4. Rebuild shared package if you changed types
pnpm build:shared

# 5. Test locally
pnpm test

# 6. Check code quality
pnpm lint
pnpm typecheck

# 7. Commit changes (pre-commit hooks will run automatically)
git add .
git commit -m "feat: add amazing feature"

# 8. Push to GitHub
git push origin feature/my-amazing-feature

# 9. Create Pull Request
# Go to GitHub and click "Create Pull Request"

# 10. Wait for CI checks to pass
# Request review from team

# 11. Merge after approval
```

### Branch Naming Convention

- `feature/` - New features (`feature/add-dashboard`)
- `fix/` - Bug fixes (`fix/login-redirect`)
- `refactor/` - Code refactoring (`refactor/api-structure`)
- `docs/` - Documentation only (`docs/update-readme`)
- `test/` - Test additions (`test/add-api-tests`)

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**

```bash
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(api): resolve CORS error on /shipments endpoint"
git commit -m "docs(readme): update installation steps"
```

---

## 🛠️ Common Commands

### Development

```bash
pnpm dev                  # Start all services
pnpm dev:web              # Start web only (port 3000)
pnpm dev:api              # Start API only (port 4000)
```

### Building

```bash
pnpm build                # Build all packages
pnpm build:web            # Build web app
pnpm build:api            # Build API
pnpm build:shared         # Build shared package (run first!)
```

### Testing

```bash
pnpm test                 # Run all tests
pnpm test:coverage        # Run with coverage report
pnpm --filter web test    # Test specific package
```

### Code Quality

```bash
pnpm lint                 # Lint all packages
pnpm lint:fix             # Auto-fix linting issues
pnpm typecheck            # TypeScript type checking
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting
```

### Database (Supabase)

```bash
pnpm supabase:start       # Start local Supabase
pnpm supabase:stop        # Stop local Supabase
pnpm supabase:studio      # Open Studio UI
pnpm supabase:reset       # Reset database
pnpm supabase:migrate     # Run migrations
```

### Deployment

```bash
pnpm deploy:vercel        # Deploy web to Vercel
pnpm deploy:fly           # Deploy API to Fly.io
pnpm deploy:all           # Deploy both
pnpm status               # Check deployment status
pnpm logs:vercel          # View Vercel logs
pnpm logs:fly             # View Fly.io logs
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (web)
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000 (API)
lsof -ti:4000 | xargs kill -9
```

### Shared Package Not Found

```bash
# Rebuild shared package
pnpm build:shared

# Restart dev servers
pnpm dev
```

### Type Errors After Updating Shared Package

```bash
# Rebuild shared and regenerate types
pnpm build:shared
pnpm typecheck

# Restart TypeScript server in VS Code
# CMD+Shift+P → "TypeScript: Restart TS Server"
```

### Database Connection Errors

```bash
# Reset local Supabase
pnpm supabase:reset

# Check Supabase status
pnpm supabase:status

# View logs
pnpm supabase:logs
```

### Node Version Issues

```bash
# Check required version (should be 20+)
node --version

# Switch to correct version with nvm
nvm use 20
```

### Cache Issues

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Git Pre-commit Hooks Failing

```bash
# Run hooks manually to see errors
npm run lint
npm run typecheck

# Fix issues, then commit again

# Emergency bypass (use sparingly!)
git commit --no-verify -m "emergency fix"
```

---

## 📚 Key Documentation

### Essential Reading

- [README.md](README.md) - Project overview
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Architecture details

### Technical Guides

- [API Documentation](apps/api/README.md) - Backend API reference
- [Web App Guide](apps/web/README.md) - Frontend architecture
- [Shared Package](packages/shared/README.md) - Types and utilities
- [Security Guide](OWASP_SECURITY_GUIDE.md) - Security best practices

### Operations

- [Deployment Guide](PRODUCTION_DEPLOY_GUIDE.md) - Production deployments
- [Monitoring Guide](MONITORING_GUIDE.md) - Observability setup
- [Database Migrations](DATABASE_MIGRATIONS.sql) - Schema changes

---

## 🎯 Your First Contribution

Great starting points for first-time contributors:

### Good First Issues

Look for issues labeled `good first issue` on GitHub:

1. Documentation improvements
2. Adding tests
3. Fixing typos
4. Updating dependencies
5. Small bug fixes

### Suggested First Tasks

1. **Add a test** - Pick any function without tests and add test coverage
2. **Fix linting** - Run `pnpm lint:fix` and commit improvements
3. **Update docs** - Find outdated documentation and update it
4. **Add types** - Find `any` types and replace with proper types

### Example Task: Add Tests

```bash
# 1. Find a function without tests
# apps/api/src/services/shipmentService.js

# 2. Create test file
touch apps/api/tests/services/shipmentService.test.js

# 3. Write tests
# ... add test code ...

# 4. Run tests
pnpm --filter api test

# 5. Commit and push
git add .
git commit -m "test(api): add shipment service tests"
git push origin feature/add-shipment-tests
```

---

## 🔐 Security & Credentials

### Accessing Secrets

**All sensitive data is stored in 1Password.** Request access from your team lead.

**Vaults:**

- `Infamous Freight - Development` - Dev environment variables
- `Infamous Freight - Production` - Production secrets (restricted)
- `Infamous Freight - API Keys` - Third-party service keys

### Never Commit:

- ❌ API keys
- ❌ Passwords
- ❌ JWT secrets
- ❌ Database URLs
- ❌ Private keys
- ❌ Access tokens

### Always:

- ✅ Use `.env.local` (gitignored)
- ✅ Use environment variables
- ✅ Reference `.env.example` for structure
- ✅ Report exposed secrets immediately

---

## 🤝 Getting Help

### Internal Resources

1. **Team Slack** - `#infamous-freight-dev` channel
2. **Tech Leads** - @MrMiless44 (GitHub)
3. **Weekly Standup** - Tuesdays 10am EST
4. **Code Review** - Request review in PR

### External Resources

1. **Next.js Docs** - [nextjs.org/docs](https://nextjs.org/docs)
2. **Prisma Docs** - [prisma.io/docs](https://www.prisma.io/docs)
3. **Supabase Docs** - [supabase.com/docs](https://supabase.com/docs)
4. **Express.js** - [expressjs.com](https://expressjs.com/)

### Common Questions

**Q: How do I add a new API route?**

A: Create file in `apps/api/src/routes/`, export router, import in `server.js`.

**Q: How do I add a new page?**

A: Create file in `apps/web/pages/`, Next.js handles routing automatically.

**Q: How do I share types between frontend and backend?**

A: Define types in `packages/shared/src/types.ts`, rebuild with `pnpm build:shared`.

**Q: How do I run tests for one package only?**

A: `pnpm --filter <package-name> test` (e.g., `pnpm --filter web test`)

**Q: How do I update dependencies?**

A: `pnpm update` for all, or `pnpm update <package>` for specific package.

---

## ✅ Checklist: I'm Ready to Contribute!

Before you start coding, ensure:

- [x] Repository cloned locally
- [x] Dependencies installed (`pnpm install`)
- [x] Environment variables configured (`.env.local`)
- [x] Shared package built (`pnpm build:shared`)
- [x] Dev servers running (`pnpm dev`)
- [x] Web app loads at `localhost:3000`
- [x] API health check returns 200 at `localhost:4000/api/health`
- [x] Tests pass (`pnpm test`)
- [x] Linting passes (`pnpm lint`)
- [x] Type checking passes (`pnpm typecheck`)
- [x] Pre-commit hooks work (try a test commit)
- [x] Access to 1Password vault
- [x] Access to GitHub repo
- [x] Added to team Slack channel
- [x] Read key documentation (README, CONTRIBUTING)

---

## 🎉 Welcome Aboard!

You're all set! Here's what happens next:

1. **Explore the codebase** - Familiarize yourself with the structure
2. **Pick your first issue** - Look for `good first issue` label
3. **Ask questions** - No question is too small!
4. **Ship code** - Make your first commit
5. **Celebrate** - You're part of the team! 🚀

**Need help?** Reach out in `#infamous-freight-dev` or DM your team lead.

**Happy coding!** 💻

---

**Document Version**: 1.0  
**Last Updated**: February 2, 2026  
**Maintained By**: DevOps Team  
**Contact**: @MrMiless44
