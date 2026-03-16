# Infæmous Freight Enterprises - Documentation Index

## Getting Started

- [Project Summary](../PROJECT_SUMMARY.md) - Overview of the project
- [README](../../README.md) - Main project documentation
- [Production README](../deployment/production-overview.md) - Production
  deployment guide
- [Environment Configuration](../ENVIRONMENT_VARIABLES.md) - Environment setup guide
- [Consolidation Strategy](CONSOLIDATION_STRATEGY.md) - Architecture decisions

## Development Guides

### Setup & Configuration

- [Environment Variables](.env.guide.md) - Complete env configuration guide
- Package management with pnpm workspaces

### Architecture

- **Monorepo Structure**: Using pnpm workspaces
  - `/apps/api` - REST API backend service
  - `/apps/web` - Next.js frontend application
  - `/apps/mobile` - React Native mobile app (Expo)
  - `/packages/shared` - Shared types, utilities, and constants
  - `/e2e` - End-to-end tests with Playwright

### Code Quality

- Pre-commit hooks with Husky
- Linting with ESLint
- Formatting with Prettier
- Automated testing with Jest

## Deployment

### Deployment Guides

- [Deployment Runbook](../deployment/DEPLOYMENT_RUNBOOK.md) - Complete deployment
  instructions
- [Observability & Monitoring](../MONITORING_OBSERVABILITY_SETUP.md) - Monitoring
  and alerting setup
- [Incident Response](../INCIDENT_RESPONSE.md) - Handling production incidents

### Infrastructure

- [Branch Protection](../BRANCH_PROTECTION.md)
- [Container Security](../CONTAINER_SECURITY.md)
- [Database Migrations](../DATABASE_MIGRATIONS.md)
- [Dependabot Setup](../DEPENDABOT_SETUP.md)

## Testing

### Testing Documentation

- [E2E Testing](../E2E_TESTING.md) - Playwright end-to-end tests
- [Smoke Tests](../smoke-health.md) - Health check documentation
- Unit tests for all services

### Quality Assurance

- [Quality Enforcement](../QUALITY_ENFORCEMENT_SUMMARY.md)
- [Ongoing Monitoring](../ONGOING_MONITORING.md)
- Code coverage with Codecov

## Project History

### Implementation Timeline

- [Week 1-2 Implementation](../history/WEEK1-2_COMPLETE.md)
- [Week 3-4 Implementation](../history/WEEK3-4_IMPLEMENTATION.md)
- [Implementation Summary](../history/IMPLEMENTATION_SUMMARY.md)
- [Infrastructure Complete](../history/INFRASTRUCTURE_COMPLETE.md)

## Scripts & Tools

### Available Scripts

From the root directory:

```bash
# Development
pnpm dev              # Start all services in development mode
pnpm dev:api          # Start only API service
pnpm dev:web          # Start only web service

# Building
pnpm build            # Build all services
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage
pnpm lint             # Lint all services
pnpm lint:fix         # Fix linting issues

# E2E Testing
pnpm test:e2e         # Run Playwright tests
```

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Pre-commit hooks will run automatically
4. Push and create a pull request
5. CI pipeline will run tests and checks
6. Merge after approval

### Code Standards

- Follow existing code patterns
- Write tests for new features
- Update documentation as needed
- Use semantic commit messages

## Support & Resources

### External Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Expo Docs](https://docs.expo.dev/)
- [Playwright Docs](https://playwright.dev/)

### Project Contacts

- GitHub: MrMiless44/Infamous-freight-enterprises
- License: See [LICENSE](LICENSE)
