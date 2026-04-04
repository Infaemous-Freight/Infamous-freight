# Codex Phased Prompting Guide

This guide captures a Codex-first workflow for building Infamous Freight in a
repo-driven, implementation-focused way.

## Why phased prompting works

Codex performs best when prompts are:

- repo-aware (explicit files/folders),
- phase-driven (one milestone at a time), and
- outcome-based (clear definition of done).

Use one phase per run rather than a single mega prompt.

## Master prompt template

Use this template when you need a full platform scaffold and want Codex to
prioritize code edits over summaries.

```text
You are working inside a real software repository.

Goal:
Build a production-ready freight logistics platform called Infamous Freight.

This is NOT a landing page task.
Do NOT generate mockups only.
Do NOT stop at marketing pages.
Do NOT return summaries instead of code.

I want a real full-stack monorepo with:
1. Marketing website
2. Shipper/customer web portal
3. Admin/dispatcher dashboard
4. Driver mobile app
5. Customer mobile app
6. Shared backend/API
7. Shared types/config/ui where sensible

Tech stack:
- Web: Next.js + TypeScript
- Mobile: React Native + Expo + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Cache/queues: Redis
- Auth: JWT + refresh tokens + role-based access
- Payments: Stripe
- SMS/OTP: Twilio
- Maps: Mapbox abstraction
- File storage: S3-compatible storage
- Push notifications: Expo notifications abstraction
- Monorepo: pnpm workspaces or Turborepo

Roles:
- SUPER_ADMIN
- ADMIN
- DISPATCHER
- CUSTOMER_OWNER
- CUSTOMER_MEMBER
- DRIVER

Core domain models:
- User
- Organization
- TeamMember
- Driver
- Vehicle
- Shipment
- ShipmentStop
- DispatchAssignment
- TrackingEvent
- ProofOfDelivery
- QuoteRequest
- PricingRule
- Invoice
- Payment
- Notification
- SupportTicket
- AuditLog
- DocumentUpload
- Address
- RefreshToken

Shipment lifecycle:
- DRAFT
- QUOTE_REQUESTED
- QUOTED
- BOOKED
- PENDING_DISPATCH
- ASSIGNED
- DRIVER_EN_ROUTE_PICKUP
- AT_PICKUP
- PICKED_UP
- IN_TRANSIT
- AT_DROPOFF
- DELIVERED
- COMPLETED
- ISSUE_REPORTED
- CANCELLED

Business requirements:
- Customers can request quotes and book shipments
- Dispatchers can assign drivers and manage shipment status
- Drivers can accept jobs, update progress, and upload POD
- Customers can track shipments and view invoice history
- Admins can view audit logs, users, customers, shipments, and support issues

Security requirements:
- hashed passwords
- refresh token rotation or secure refresh-token handling
- role guards
- ownership checks
- input validation
- audit logging for admin actions
- no hardcoded secrets
- env-based config
- upload validation placeholders

What I want you to do:
1. Inspect the repository structure first
2. Propose the target monorepo layout
3. Create or update the repo to match that layout
4. Generate Prisma schema and enums
5. Generate backend modules and routes
6. Generate web routes and layouts
7. Generate mobile app structure and screens
8. Generate env templates and docker-compose
9. Generate README setup instructions
10. Run available checks/tests/lint/typecheck where practical
11. Report what changed, what passed, and what still remains

Output requirements:
- Make real file edits
- Show diffs or file contents where useful
- Prefer creating actual files over describing them
- Keep going until the current phase is complete
- If blocked, state exactly what is blocked and continue with everything else

Do not drift into brochure copy.
Do not invent fake customer logos or fake metrics.
Do not replace implementation with generic advice.

Definition of done for this task:
- monorepo structure exists
- Prisma schema exists
- backend scaffolding exists
- web scaffolding exists
- mobile scaffolding exists
- env example exists
- docker-compose exists
- README exists
- core shipment/dispatch/auth flows are scaffolded
```

## Recommended phase prompts

### Phase 1 — Architecture and workspace scaffolding

```text
Inspect the current repository and then do the following:

1. summarize the existing structure
2. propose the target monorepo structure for a freight logistics platform
3. create missing top-level folders
4. add workspace config
5. add docker-compose for Postgres and Redis
6. add .env.example
7. add a README section called "Architecture"
8. add a Prisma schema with the core models and enums

Use the existing repository layout as the default target:
- apps/api
- apps/web
- apps/mobile
- packages/shared
- packages/genesis
- prisma
- docs

Only create new packages when the current workspace structure cannot support
the requirement cleanly.
Do not build marketing pages yet.
Do not generate filler content.
Make real file changes.
Then show me:
- files created/updated
- schema summary
- next recommended phase
```

### Phase 2 — Backend

```text
Continue by building the backend in apps/api.

First, inspect the repository and confirm the API stack already implemented in
apps/api before making changes. Do not introduce a second backend framework.
Extend the existing backend architecture in place.

Requirements:
- use the current apps/api stack found in-repo (Express + Prisma if already implemented)
- extend existing routes, controllers/handlers, services, middleware, and Prisma usage patterns
- auth endpoints/features
- users endpoints/features
- organizations endpoints/features
- shipments endpoints/features
- dispatch endpoints/features
- tracking endpoints/features
- drivers endpoints/features
- support endpoints/features

Implement:
- input validation using the existing validator pattern and shared Zod schemas where applicable
- JWT auth
- refresh token handling
- authorization and scope checks using the existing middleware pattern
- tenant-scoped Prisma queries only
- non-public endpoints using the standard middleware stack:
  limiters -> authenticate -> requireOrganization -> requireScope -> auditLog -> validators -> handleValidationErrors
- new endpoints and middleware within the existing Express route structure, not NestJS modules/guards/DTOs
- shipment create endpoint
- shipment status update endpoint
- driver assignment endpoint
- tracking event endpoint
- support ticket create endpoint

Add:
- seed script
- basic error handling
- config module
- logging structure

Make actual file edits.
After coding, run any available tests/typecheck/build commands that make sense.
Report:
- files changed
- commands run
- results
- remaining gaps
```

### Phase 3 — Web

```text
Continue by building apps/web using Next.js + TypeScript.

Create:
- marketing shell
- auth flow
- shipper dashboard layout
- dispatcher/admin dashboard layout
- shipment list page
- shipment detail page
- booking form page
- invoice page
- support page
- role-aware navigation
- typed API client layer

Requirements:
- clean enterprise SaaS UI
- no lorem ipsum
- loading states
- error states
- reusable components where sensible

Use the backend contracts already created.
Make real file edits, not just a description.
Then report:
- routes created
- components created
- integration points still pending
```

### Phase 4 — Mobile

```text
Continue by building apps/mobile with React Native Expo + TypeScript.

Create two role-based app flows:
1. Driver app flow
2. Customer app flow

Driver screens:
- login
- dashboard
- assigned jobs
- job detail
- accept/decline
- pickup flow
- in-transit updates
- dropoff flow
- POD upload placeholder
- profile

Customer screens:
- login
- dashboard
- create shipment
- shipment list
- shipment detail
- live tracking
- invoices
- support
- profile

Also add:
- navigation
- API client
- auth state
- loading/error handling
- notification hook placeholders

Make actual file edits.
Then summarize:
- files created
- screen map
- backend endpoints relied on
- missing production work
```

### Phase 5 — Hardening

```text
Finalize the scaffold for production-readiness.

Add or improve:
- README setup instructions
- local development steps
- seed instructions
- deployment notes
- environment variable documentation
- upload validation placeholders
- audit log notes
- test examples
- lint/format config
- CI notes
- security checklist
- release checklist for web and mobile

Run relevant checks if possible and report the results.
Do not re-explain the architecture unless it changed.
Focus on concrete repo changes.
```

## Correction prompt (when implementation stalls)

```text
Stop summarizing and continue implementing.

I do not want:
- homepage-only output
- mockups without code
- generic architecture advice
- repeated restatements of requirements

I want:
- concrete file edits
- backend modules
- Prisma schema
- routes
- screens
- env files
- setup docs

Resume from the last unfinished implementation step and keep making repository changes.
Then show changed files and command results.
```

## CLI-first prompt

```text
Inspect this repository and convert it into a production-style monorepo for a freight logistics platform called Infamous Freight.

Start by:
1. mapping the current repo
2. proposing the new structure
3. creating missing top-level folders
4. adding workspace config
5. adding Prisma schema
6. scaffolding apps/api, apps/web, and apps/mobile

Make edits directly in the repo.
Prefer implementation over explanation.
After each major step, summarize changed files and suggest the next command/task.
```

## Practical recommendation

Use phased prompts and repeatedly continue implementation until each layer is
fully scaffolded and validated.
