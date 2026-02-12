# Repository Structure

This document describes the organization of the Infamous Freight Enterprise repository.

## Overview

The repository follows a clean, organized structure with configuration files, documentation, and source code properly separated.

## Top-Level Structure

```
infamous-freight-enterprise/
├── .github/              # GitHub configuration
│   ├── workflows/        # GitHub Actions CI/CD workflows
│   ├── CODEOWNERS        # Code ownership rules
│   ├── copilot-instructions.md
│   └── dependabot.yml    # Dependency update configuration
├── .github/              # GitHub configuration
├── .husky/               # Git hooks (pre-commit, etc.)
├── configs/              # All configuration files
│   ├── ci-cd/            # CI/CD platform configurations
│   ├── docker/           # Docker Compose files
│   ├── linting/          # Linting and formatting baselines
│   ├── testing/          # Playwright test configuration
│   └── validation/       # HTML/CSS validation rules
├── docs/                 # Documentation
│   ├── apps/api/              # API documentation
│   ├── deployment/       # Deployment guides
│   ├── development/      # Development guides
│   ├── sessions/         # Historical session notes
│   └── testing/          # Testing documentation
├── src/
│   ├── apps/             # Application code
│   │   ├── apps/api/          # Backend API (Express.js, CommonJS)
│   │   ├── apps/mobile/       # Mobile app (React Native/Expo)
│   │   └── apps/web/          # Web frontend (Next.js)
│   └── packages/         # Shared packages
│       └── shared/       # Shared types, constants, utilities
├── tests/e2e/            # End-to-end tests (Playwright)
├── scripts/              # Build and deployment scripts
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # License information
├── README.md             # Main project documentation
├── SECURITY.md           # Security policy
└── package.json          # Root package configuration
```

## Configuration Files (configs/)

All configuration files are organized in the `configs/` directory:

### configs/ci-cd/

Deployment and CI/CD platform configurations:

- `codecov.yml` - Code coverage reporting
- `fly.toml` - Fly.io deployment
- `netlify.toml` - Netlify deployment
- `render.yaml` - Render deployment
- `static-analysis.datadog.yml` - Datadog static analysis
- `vercel.json` - Vercel deployment

### configs/docker/

Docker and container configurations:

- `configs/docker/docker-compose.yml` - Main Docker Compose configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production configuration
- `docker-compose.override.yml` - Local overrides

### configs/linting/

Code quality and formatting configurations:

- `.editorconfig` - Editor configuration
- `.lintstagedrc` - Pre-commit lint configuration
- `.nvmrc` - Node.js version
- `.pnpmrc` - pnpm configuration
- `eslint.config.js` - JavaScript/TypeScript linting rules

### configs/testing/

Testing configurations:

- `playwright.config.js` - Playwright test configuration shared by CI and local runs

### configs/validation/

Validation and static analysis configurations:

- `html-validate.config.js` - HTML validation rules
- `stylelint.config.cjs` - CSS validation rules
- `.stylelintignore` - CSS validation exclusions

### Symlinks for Compatibility

Some configuration files require being at the repository root for tools to work correctly. Root entrypoints re-export the versions in `configs/`:

- `codecov.yml` → `configs/ci-cd/codecov.yml`
- `eslint.config.js` → `configs/linting/eslint.config.js`
- `playwright.config.js` → `configs/testing/playwright.config.js`
- `.editorconfig` → `configs/linting/.editorconfig`
- `.lintstagedrc` → `configs/linting/.lintstagedrc`
- `.nvmrc` → `configs/linting/.nvmrc`
- `.pnpmrc` → `configs/linting/.pnpmrc`
- `.stylelintrc.json` → `configs/linting/.stylelintrc.json`

This approach keeps the root directory clean while maintaining tool compatibility.

## Documentation (docs/)

Documentation is organized by topic:

### docs/api/

- API reference and testing guides

### docs/deployment/

- Deployment runbooks
- Platform-specific deployment guides
- Migration guides

### docs/development/

- Development setup and workflow
- CI/CD configuration
- Planning and roadmap documents

### docs/sessions/

- Historical development session notes
- Implementation status documents

### docs/testing/

- Testing strategy and guides
- Coverage reports and roadmaps

### Root Documentation

- `docs/README.md` - Documentation index
- `docs/developer-guide.md` - Comprehensive developer guide
- `docs/QUICK_REFERENCE.md` - Quick command reference
- `docs/validation-guide.md` - Code validation guide

## Source Code

### apps/api/

Express.js backend API using CommonJS:

```
apps/api/
├── prisma/               # Database schema and migrations
├── scripts/              # Database and build scripts
├── src/
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── server.ts        # Entry point
├── Dockerfile           # Container image definition
└── package.json         # Dependencies and scripts
```

### apps/web/

Next.js 14 frontend using TypeScript/ESM:

```
apps/web/
├── components/          # React components
├── lib/                 # Utilities and helpers
├── pages/               # Next.js pages
│   ├── apps/api/            # Next.js API routes
│   └── *.tsx           # Page components
├── public/              # Static assets
├── styles/              # CSS stylesheets
└── package.json         # Dependencies and scripts
```

### apps/mobile/

React Native/Expo mobile app:

```
apps/mobile/
├── assets/              # Images, fonts, etc.
├── App.tsx              # Main app component
├── app.json             # Expo configuration
└── package.json         # Dependencies and scripts
```

### packages/shared/

Shared TypeScript package:

```
packages/shared/
├── src/
│   ├── constants.ts     # Shared constants
│   ├── env.ts          # Environment validation
│   ├── index.ts        # Package exports
│   ├── types.ts        # Shared TypeScript types
│   └── utils.ts        # Shared utilities
├── dist/                # Built output (generated)
└── package.json         # Package configuration
```

## Scripts

Utility scripts in `scripts/`:

- `auto-fix-tests.sh` - Automated test fixing
- `backup-database.sh` - Database backup utility
- `db-indexes.sql` - Database index definitions
- `dev.sh` - Development environment starter
- `load-test.sh` - Load testing script
- `migrate-production.sh` - Production migration script
- `regenerate-lockfile.sh` - Lockfile regeneration
- `setup-monitoring.sh` - Monitoring setup
- `verify-deployment.sh` - Deployment verification

## Build Artifacts

Generated files and directories (excluded from git):

- `node_modules/` - Dependencies
- `dist/` - Compiled output
- `build/` - Build artifacts
- `.next/` - Next.js build cache
- `coverage/` - Test coverage reports

## Environment Files

Environment configuration:

- `.env.example` - Template for environment variables
- `.env` - Local environment (git-ignored)
- `apps/web/.env.production` - Web production env
- `apps/web/.env.preview` - Web preview env

## Git Configuration

- `.gitignore` - Files to exclude from version control
- `.gitignore.env` - Additional environment exclusions
- `.husky/` - Pre-commit hooks

## Naming Conventions

The repository follows these naming conventions:

### Files

- **Documentation**: UPPERCASE with underscores (e.g., `README.md`, `CONTRIBUTING.md`)
- **Scripts**: kebab-case with `.sh` extension (e.g., `backup-database.sh`)
- **Config files**: kebab-case or dot-prefix (e.g., `.eslintrc.json`, `configs/docker/docker-compose.yml`)
- **Source files**: PascalCase for components, camelCase for utilities

### Directories

- **kebab-case** for most directories (e.g., `ci-cd`, `end-to-end`)
- **lowercase** for standard directories (e.g., `api`, `web`, `mobile`, `docs`)

## Monorepo Workspaces

The project uses pnpm workspaces defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "api"
  - "web"
  - "mobile"
  - "packages/*"
```

Each workspace has its own:

- `package.json` - Dependencies and scripts
- `node_modules/` - Workspace-specific dependencies (via pnpm linking)

## CI/CD Structure

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` - Main CI pipeline (lint, test, build, validate)
- `codeql.yml` - Security scanning
- `container-security.yml` - Container security checks
- `docker-build.yml` - Docker image builds
- `e2e.yml` - End-to-end tests
- `cd.yml` - Orchestrates production deployments
- `fly-deploy.yml` - Fly.io deployment
- `vercel-deploy.yml` - Vercel deployment

## Adding New Files

When adding new files, follow these guidelines:

### Configuration Files

- Add to appropriate `configs/` subdirectory
- Create symlink at root if tool requires it
- Document in this file

### Documentation

- Add to appropriate `docs/` subdirectory
- Update `docs/README.md` index
- Link from main README if important

### Source Code

- Add to appropriate workspace (`apps/api/`, `apps/web/`, `apps/mobile/`, or `packages/shared/`)
- Follow existing directory structure
- Update workspace package.json if adding dependencies

### Scripts

- Add to `scripts/` directory
- Use kebab-case naming
- Make executable: `chmod +x scripts/new-script.sh`
- Add documentation comment at top of file

## Maintenance

### Updating Configuration

1. Edit files in `configs/` (not symlinks)
2. Test changes locally
3. Update documentation if needed

### Moving Files

1. Update all references (imports, paths)
2. Update symlinks if necessary
3. Test build and CI pipelines
4. Update documentation

### Cleaning Up

- Temporary files are git-ignored (see `.gitignore`)
- Run `pnpm store prune` to clean dependency cache
- Run `pnpm clean` in workspaces to remove build artifacts

## References

- [Developer Guide](developer-guide.md) - Setup and development workflow
- [Documentation Index](README.md) - Complete documentation list
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute
- [Main README](../README.md) - Project overview
