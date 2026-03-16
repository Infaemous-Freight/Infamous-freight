# 📚 Documentation Index

> **Centralized hub for all Infæmous Freight Enterprises documentation**
>
> Last Updated: February 19, 2026

---

## 🚀 Getting Started

### Quick Start
- [README.md](README.md) - Project overview and setup instructions
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet and common tasks
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines and contribution workflow
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community standards and conduct
- [.env.example](.env.example) - Environment variable configuration template

### Setup & Installation
- **Prerequisites**: Node.js 20+, pnpm 8.15.9, Docker, PostgreSQL 16
- **Installation**: `pnpm install --frozen-lockfile`
- **Development**: `pnpm dev` (starts all services)
- **Testing**: `pnpm test` (runs all test suites)

---

## 🏗️ Architecture & Design

### System Architecture
- [Architecture Overview](README.md#architecture) - High-level system design
- [Monorepo Structure](README.md#monorepo-structure) - Workspace organization
- [Technology Stack](README.md#tech-stack) - Technologies and frameworks

### Database & Data Models
- [Prisma Schema](apps/api/prisma/schema.prisma) - Database schema and relations
- [DATABASE_MIGRATIONS.sql](DATABASE_MIGRATIONS.sql) - Migration scripts
- [Data Flow Diagrams](README.md#data-flow) - How data moves through the system

### Shared Package
- [packages/shared/src/types.ts](packages/shared/src/types.ts) - Shared TypeScript types
- [packages/shared/src/constants.ts](packages/shared/src/constants.ts) - Constants and enums
- [packages/shared/src/utils.ts](packages/shared/src/utils.ts) - Utility functions
- [packages/shared/src/env.ts](packages/shared/src/env.ts) - Environment validation

---

## 📡 API Documentation

### Core API
- [API Documentation](API-DOCUMENTATION-RECOMMENDED.md) - Complete API reference
- **Base URL**: `http://localhost:4000/api` (dev), `https://api.infamousfreight.com` (prod)
- **Swagger UI**: `http://localhost:4000/api/docs` - Interactive API explorer
- **Authentication**: JWT tokens with scope-based authorization

### API Endpoints

#### Health & System
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health metrics

#### Authentication (v1)
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `GET /v1/auth/me` - Get current user profile

#### Shipments (v1)
- `GET /api/shipments` - List shipments (paginated)
- `POST /api/shipments` - Create shipment
- `GET /api/shipments/:id` - Get shipment by ID
- `PATCH /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment
- `POST /api/shipments/:id/tracking` - Add tracking event

#### Shipments (v2) - Breaking Changes
- [apps/api/src/routes/v2/shipments.js](apps/api/src/routes/v2/shipments.js)
- **Changes**: Pagination (limit 50), status codes (204 for updates), error codes
- `GET /api/v2/shipments` - List with enhanced pagination
- `PATCH /api/v2/shipments/:id` - Update (returns 204 No Content)

#### Analytics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/drivers` - Driver performance
# Documentation Index

**Last Updated:** February 22, 2026

This index keeps the root clean and points to the active docs under [docs/README.md](docs/README.md).

## Core Links

- [README.md](README.md) - Project overview and quick start
- [docs/README.md](docs/README.md) - Full documentation index
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - Command cheatsheet
- [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md) - API endpoints
- [docs/deployment/DEPLOYMENT_RUNBOOK.md](docs/deployment/DEPLOYMENT_RUNBOOK.md) - Deployment guide
- [docs/security.md](docs/security.md) - Security best practices
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution workflow
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community standards

## Architecture & Data

- [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) - ADR overview
- [docs/architecture.md](docs/architecture.md) - System architecture
- [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) - Database schema

## Testing & Quality

- [docs/TESTING.md](docs/TESTING.md) - Testing guide
- [docs/testing/TESTING_STRATEGY.md](docs/testing/TESTING_STRATEGY.md) - Test strategy
- [docs/E2E_TESTING.md](docs/E2E_TESTING.md) - Playwright E2E

## Operations

- [docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md) - Incident response
- [docs/runbooks/incident-response.md](docs/runbooks/incident-response.md) - On-call runbook
- [docs/ONGOING_MONITORING.md](docs/ONGOING_MONITORING.md) - Monitoring overview

