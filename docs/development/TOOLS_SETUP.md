# Development Tools Setup Guide

## ✅ Tools Installed and Verified

All required development tools are now configured and ready to use:

### Core Tools

- **Node.js**: v24.14.1 ✓
- **npm**: v11.11.0 ✓
- **pnpm**: v10.25.0 ✓
- **Git**: v2.52.0 ✓

### Development Tools

- **Prettier**: v3.7.4 (Code formatter) ✓
- **ESLint**: v9.39.2 (Linter) ✓
- **TypeScript**: v5.9.3 (Type checking) ✓
- **Husky**: v9.1.7 (Git hooks) ✓

## Available Commands

All tools are available through `pnpm`:

```bash
# Package management
pnpm install          # Install dependencies
pnpm add <package>    # Add a package
pnpm -r build         # Build all workspaces

# Code formatting
pnpm format           # Format all code
pnpm format:check     # Check formatting without changing

# Linting
pnpm lint             # Lint all code
pnpm lint:fix         # Fix linting issues

# Type checking
pnpm check:types      # Check TypeScript types

# Testing
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage

# Quality checks
pnpm check:all        # Run all checks (lint + types + format)

# Development
pnpm dev              # Start all dev servers
pnpm api:dev          # Start API only
pnpm web:dev          # Start Web only
```

## Environment Setup

### Workspace Structure

```
infamous-freight-enterprises/
├── apps/api/                    # Express REST API
├── apps/web/                    # Next.js React app
├── packages/
│   └── shared/            # Shared types & utilities
├── apps/mobile/                # React Native app
└── e2e/                   # Playwright E2E tests
```

### Git Hooks

Husky is configured with the following hooks:

- **pre-commit**: Runs Prettier on staged files
- **commit-msg**: Validates commit message format (Conventional Commits)

### PATH Configuration

pnpm is added to your `~/.bashrc`:

```bash
export PATH="/home/vscode/.local/share/pnpm:$PATH"
```

## Troubleshooting

### If pnpm is not found

```bash
export PATH="/home/vscode/.local/share/pnpm:$PATH"
source ~/.bashrc
```

### If dependencies are out of sync

```bash
pnpm install
pnpm -r build
```

### If git hooks are not working

```bash
pnpm prepare
```

## Quick Start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Run development servers**

   ```bash
   pnpm dev
   ```

3. **Run type checking and formatting**

   ```bash
   pnpm check:all
   ```

4. **Build for production**

   ```bash
   pnpm -r build
   ```

## Next Steps

- See [README.md](README.md) for project overview
- Check [CHANGELOG.md](CHANGELOG.md) for recent updates
- Review [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) for
  configuration
