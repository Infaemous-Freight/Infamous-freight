Infæmous Freight

Overview

Infæmous Freight is an AI-powered freight and logistics operations platform built to optimize dispatch workflows, shipment visibility, fleet coordination, and operational intelligence.

The platform combines modern logistics infrastructure with AI-driven automation and analytics to help carriers, dispatch teams, and logistics operators run efficient freight operations.

The repository is organized as a pnpm monorepo delivering a unified platform across API, web, and mobile surfaces.

⸻

Platform Vision

The goal of Infæmous Freight is to become a logistics intelligence platform capable of:
	•	dispatch automation
	•	operational analytics
	•	fleet intelligence
	•	shipment lifecycle visibility
	•	driver coordination
	•	AI-driven operational insights

Rather than acting as a simple load management tool, Infæmous Freight is designed as a freight operating system.

⸻

Product Architecture

The Infæmous ecosystem consists of three major layers.

Infæmous Freight

Category: Core Product

The primary logistics platform responsible for managing freight operations.

Capabilities include:
	•	dispatch workflow automation
	•	shipment lifecycle tracking
	•	fleet activity monitoring
	•	routing intelligence
	•	operational dashboards
	•	logistics analytics

Infæmous Freight acts as the system of record for logistics workflows.

⸻

Genesis Avatar

Category: AI Interface Layer

Genesis Avatar is the conversational AI and avatar interface used to interact with the platform.

Capabilities include:
	•	conversational operational queries
	•	AI-driven command execution
	•	logistics insights
	•	workflow assistance
	•	cross-surface assistant experience

Genesis Avatar provides the AI interaction layer for the platform.

⸻

Platform Infrastructure

Supporting infrastructure powers the entire ecosystem:
	•	authentication
	•	tenant isolation
	•	data orchestration
	•	observability
	•	API infrastructure
	•	shared domain models

These components support the platform but are not standalone products.

⸻

Monorepo Structure

apps/
  api/        Backend logistics engine
  web/        Operations dashboard
  mobile/     Mobile operations interface

packages/
  shared/     Shared schemas, utilities, domain models

Surface Responsibilities

Surface	Purpose
apps/api	Platform orchestration and logistics engine
apps/web	Operations control plane
apps/mobile	Field operations interface
packages/shared	Shared types and utilities


⸻

Technology Stack

Backend
	•	Node.js
	•	Express
	•	Prisma ORM
	•	PostgreSQL
	•	Redis

Frontend
	•	Next.js
	•	TypeScript
	•	TailwindCSS

Mobile
	•	React Native
	•	Expo

Infrastructure
	•	Docker
	•	GitHub Actions
	•	CodeQL
	•	Security audit pipelines

⸻

Getting Started

Clone the repository.

git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

Enable pnpm via Corepack.

corepack enable
corepack prepare pnpm@10.15.0 --activate

Copy environment variables.

cp .env.example .env

Install dependencies.

pnpm install

Build the workspace.

pnpm build


⸻

Development

API

pnpm dev

or

pnpm dev:api

Web Dashboard

pnpm dev:web

Mobile App

pnpm dev:mobile


⸻

Local Infrastructure

Infæmous Freight includes a local infrastructure environment for development.

Services include:
	•	PostgreSQL
	•	Redis
	•	API container

Start infrastructure

make infra-up

View logs

make infra-logs

Run health smoke test

make smoke

Stop infrastructure

make infra-down

The smoke test validates the /health endpoint to confirm that the platform services are operational.

⸻

Validation

Before opening a pull request, run the validation suite.

pnpm run validate

Or step-by-step:

pnpm build
pnpm typecheck
pnpm lint
pnpm test


⸻

Makefile Commands

Common development helpers are available via make.

make install
make build
make typecheck
make lint
make test
make validate
make dev
make infra-up
make infra-down
make infra-logs
make smoke


⸻

Contributing

See:

CONTRIBUTING.md

Pull Request Checklist

Before submitting a PR:
	•	build passes
	•	lint passes
	•	tests pass
	•	validation passes

Branch naming examples

feature/dispatch-engine
feature/shipment-tracking
fix/api-timeout
docs/readme-update

Commit format

This repository follows Conventional Commits.

Examples:

feat: add shipment tracking API
fix: resolve pnpm workspace dependency issue
docs: update architecture documentation


⸻

CI/CD

The repository uses a simplified workflow set to reduce noise and duplication.

Active workflows include:
	•	ci.yml — build, lint, typecheck, test
	•	codeql.yml — security scanning
	•	security-audit.yml — dependency audits
	•	cd.yml — deployment workflow

This structure ensures a clear CI signal without redundant pipelines.

⸻

Architecture

Full architecture documentation can be found in:

docs/ARCHITECTURE.md

Platform model:

Client (Web / Mobile)
       │
       ▼
API Gateway
       │
       ▼
AI Orchestration Layer
       │
       ▼
Business Logic Engine
       │
       ▼
Data Layer (PostgreSQL + Redis)


⸻

Deployment

Deployment guidance is documented in:

docs/DEPLOYMENT.md

Deployment documentation includes:
	•	environment setup
	•	secret management
	•	release procedures
	•	operational expectations

⸻

Release Governance

Release procedures are documented in:

docs/RELEASE.md

This checklist includes:
	•	CI verification
	•	environment validation
	•	rollback strategy
	•	smoke testing
	•	post-release monitoring

⸻

Security

Security guidelines include:
	•	never commit secrets
	•	validate all external inputs
	•	maintain RBAC and tenant boundaries
	•	store production credentials in managed secret stores

⸻

Support for Contributors

When contributing:
	•	keep pull requests focused
	•	avoid unrelated file changes
	•	document operational changes
	•	include logs or screenshots when helpful

The goal is simple:

predictable, repeatable, production-grade logistics software.