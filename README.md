# Infamous Freight

AI-powered freight and logistics automation platform connecting shippers, brokers, and carriers with real-time tracking, intelligent load orchestration, and automated workflow execution.

## Platform Overview

Infamous Freight is a multi-tenant logistics SaaS designed to automate freight operations across carrier networks, broker systems, and shipper integrations.

Core capabilities include:

- AI-driven load matching
- real-time shipment tracking
- automated carrier assignment
- broker workflow automation
- multi-tenant SaaS architecture
- observability and operational telemetry
- production CI/CD deployment pipelines

## Architecture

The platform is structured as a monorepo:

apps/
web
api
mobile

packages/
shared
genesis

ai/
inference
orchestration

infrastructure/
terraform
k8s
deploy

monitoring/
observability/

.github/
workflows/

## Core Components

### Web Platform
Next.js application for brokers, shippers, and operational dashboards.

### API
TypeScript/Node service layer powering logistics workflows, carrier networks, and shipment state.

### Mobile
Driver-oriented mobile interface for real-time updates and delivery workflows.

### AI Services
Machine learning and rule engines supporting:

- load recommendation
- anomaly detection
- route optimization
- operational automation

### Infrastructure
Infrastructure-as-code supporting containerized deployment across cloud environments.

## CI/CD

The repository uses GitHub Actions pipelines for:

- lint
- typecheck
- automated testing
- production builds
- deployment automation
- security scanning

## Security

Security controls include:

- dependency review
- secret scanning
- CodeQL analysis
- least-privilege workflow permissions

## Vision

Infamous Freight aims to become the operating system for freight logistics, enabling automated coordination between carriers, brokers, and shippers through intelligent software infrastructure.
