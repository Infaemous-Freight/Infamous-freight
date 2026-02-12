# Developer Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20 or higher (specified in `.nvmrc`)
- **pnpm**: Version 8.15.9 (package manager)
- **Docker**: For running the PostgreSQL database and containerized services
- **Git**: For version control

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MrMiless44/Infamous-freight-enterprises.git
cd Infamous-freight-enterprises
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspaces (api, web, mobile, packages/shared).

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the required environment variables. See [Environment Variables](ENVIRONMENT_VARIABLES.md) for details.

### 4. Start the Development Environment

#### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This starts PostgreSQL and other required services.

#### Start All Services

```bash
pnpm dev
```

This starts:

- API server (port 3001 in Docker, 4000 locally)
- Web dashboard (port 3000)
- Mobile development server

### 5. Database Setup

The API uses Prisma ORM. Generate Prisma client and run migrations:

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate:dev
```

## Project Structure

```
infamous-freight-enterprise/
├── apps/api/                 # Express.js backend (CommonJS)
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Auth, validation, error handling
│   │   ├── services/   # Business logic
│   │   └── server.ts   # Server entry point
│   └── prisma/         # Database schema and migrations
├── apps/web/                # Next.js 14 frontend (TypeScript/ESM)
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   └── lib/            # Utilities
├── apps/mobile/             # React Native/Expo app
│   └── App.tsx         # Mobile app entry point
├── packages/
│   └── shared/         # Shared TypeScript types and utilities
├── e2e/                # Playwright end-to-end tests
├── scripts/            # Build and deployment scripts
├── configs/            # Configuration files
│   ├── docker/         # Docker Compose configurations
│   ├── ci-cd/          # CI/CD platform configs
│   └── linting/        # Linting and formatting configs
└── docs/               # Documentation

```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific workspace
pnpm --filter api test
pnpm --filter web test
```

### Linting and Type Checking

```bash
# Lint all workspaces
pnpm lint

# Type check all workspaces
pnpm --filter api typecheck
pnpm --filter web typecheck
```

### Building

```bash
# Build all workspaces
pnpm build

# Build a specific workspace
pnpm --filter api build
pnpm --filter web build
```

## Working with the Shared Package

The `packages/shared` directory contains shared TypeScript types, constants, and utilities that are used across all workspaces.

**Important**: After making changes to the shared package, you must rebuild it:

```bash
pnpm --filter @infamous-freight/shared build
```

Then restart any services that depend on it.

### Importing from Shared Package

```typescript
// Import types, constants, or utilities
import {
  ApiResponse,
  HTTP_STATUS,
  SHIPMENT_STATUSES,
} from "@infamous-freight/shared";
```

## Database Migrations

When you need to modify the database schema:

1. Edit `apps/api/prisma/schema.prisma`
2. Create a migration:

   ```bash
   cd apps/api
   pnpm prisma:migrate:dev --name <migration_name>
   ```

3. The Prisma client will be automatically regenerated

To view the database in a GUI:

```bash
cd apps/api
pnpm prisma:studio
```

## API Development

The API uses:

- **Express.js** with CommonJS (`require()`)
- **Prisma ORM** for database access
- **JWT** for authentication with scope-based authorization
- **Rate limiting** for API protection

### Adding a New API Route

1. Create route file in `apps/api/src/routes/`
2. Apply middleware in order:

   ```javascript
   router.post(
     "/endpoint",
     limiters.general,
     authenticate,
     requireScope("scope:name"),
     auditLog,
     validators,
     handleValidationErrors,
     handler,
   );
   ```

3. Use `ApiResponse` for responses
4. Delegate errors with `next(err)` to global error handler

See [API Reference](apps/api/API_REFERENCE.md) for more details.

## Web Development

The web frontend uses:

- **Next.js 14** with App Router
- **TypeScript** with ESM imports
- **React** for UI components

### Adding a New Page

1. Create a new file in `apps/web/pages/` (e.g., `new-page.tsx`)
2. Export a React component
3. Use Next.js API routes in `apps/web/pages/api/` for backend communication

## Mobile Development

The mobile app uses **React Native** with **Expo**.

```bash
# Start the development server
cd apps/mobile
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios

# Run in web browser
pnpm web
```

## CI/CD

The project uses GitHub Actions for continuous integration. See `.github/workflows/` for workflow definitions.

### Workflows

- **ci.yml**: Main CI workflow (lint, test, build, HTML validation)
- **e2e.yml**: End-to-end tests with Playwright
- **codeql.yml**: Security scanning
- **docker-build.yml**: Docker image builds

Coverage reports are uploaded to Codecov automatically.

## Code Quality

### ESLint

Configuration: `configs/linting/eslint.config.js`

The project uses ESLint with:

- Recommended rules for JavaScript and TypeScript
- Prettier integration
- Different configs for CommonJS (api) and ESM (web)

### Prettier

Format code with:

```bash
pnpm format
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks. Configured in `.husky/` directory.

## Troubleshooting

### Port Already in Use

If you get port conflicts:

- API: Set `API_PORT` environment variable
- Web: Set `WEB_PORT` environment variable

### Prisma Client Issues

If you get Prisma client errors:

```bash
cd apps/api
pnpm prisma:generate
```

### Shared Package Not Found

Rebuild the shared package:

```bash
pnpm --filter @infamous-freight/shared build
```

### Docker Issues

Reset Docker containers:

```bash
docker-compose down -v
docker-compose up -d
```

### Automated Repository Fixes

If you're experiencing multiple issues (lint errors, test failures, dependency problems), use the automated fix script:

```bash
# Download from GitHub Actions artifact (if available)
# Or run directly from repository root:
chmod +x fix-repo.sh
./fix-repo.sh
```

This script will:

- Clean and reinstall dependencies
- Build the shared package
- Apply lint fixes
- Format code
- Update test snapshots
- Clean build artifacts
- Rebuild all projects
- Run tests to verify fixes

**Note**: The script is also available as a GitHub Actions artifact when the CI workflow detects test failures.

## Additional Resources

- [Testing Guide](testing/TESTING_STRATEGY.md)
- [API Security Checklist](API_SECURITY_CHECKLIST.md)
- [Deployment Guide](deployment/)
- [Architecture Overview](ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Getting Help

- Check existing documentation in the `docs/` directory
- Review the [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common commands
- Ask questions in GitHub Discussions
- Report bugs in GitHub Issues
