# Architecture

Infamous Freight uses a modular pnpm monorepo architecture.

## Workspaces

### apps/api
Express API for freight operations, auth, dispatch, and tracking.

### apps/web
Next.js web dashboard for operational workflows and visibility.

### apps/mobile
Expo / React Native mobile application for driver-facing workflows.

### packages/shared
Shared types, schemas, and utilities used across workspaces.

## Architectural Principles

### Reliability
Freight systems should fail predictably and recover cleanly.

### Observability
Operational visibility is critical for debugging and monitoring.

### Automation
Dispatch and logistics workflows benefit from structured automation.

## Layer Model

```text
clients
  ├── web
  └── mobile

api
  ├── auth
  ├── dispatch
  ├── tracking
  └── operations

shared
  ├── types
  ├── validation
  └── utilities
```
