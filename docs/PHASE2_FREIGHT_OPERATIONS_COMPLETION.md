# Phase 2 Freight Operations Completion

This document defines the completion gate for making Infamous Freight freight operations production-ready.

## Scope

Phase 2 covers the operational freight workflows that turn the technical platform into a revenue-generating transportation management system.

Required domains:

1. Dispatch workflow
2. Load lifecycle
3. Shipment tracking
4. Carrier and driver operations
5. Compliance monitoring
6. Billing and settlement handoff
7. Operations evidence capture

## Completion Gate

Phase 2 is complete when the repository contains executable validation coverage for every operational workflow and the production evidence log shows each workflow passing with controlled test data.

## Required Workflow Assertions

### Dispatch

- Active dispatches must have an assigned carrier or driver.
- Dispatches must have SLA timers.
- Risk scoring must produce a level and explainable reason.
- Escalation must create an auditable incident.

### Loads

- Loads must support quote, booked, assigned, picked up, in transit, delivered, and closed states.
- Invalid state transitions must be rejected.
- Tenant ownership must be preserved throughout every state transition.

### Tracking

- Public tracking responses must expose only safe public shipment fields.
- GPS heartbeat loss must become an operational alert.
- Delay risk above threshold must create an escalation candidate.

### Carrier and Driver Operations

- Carrier profile must include operating status and compliance readiness.
- Driver assignment must be tenant-scoped.
- Driver workflow must support load assignment, pickup, in-transit, delivery, and proof-of-delivery events.

### Compliance

- Insurance expiration, authority status, CSA risk, and document gaps must be detectable.
- Compliance blockers must prevent unsafe dispatch where configured.

### Billing

- Delivered/closed shipments must be eligible for invoice generation.
- Billing failures must be reported as operational exceptions.
- Carrier settlement handoff must be traceable.

## Evidence Requirements

For each workflow, capture:

- timestamp
- test actor
- tenant or organization identifier
- route or UI path
- request/response evidence or screenshot
- result
- failure notes if any

## Non-Source-Control Requirements

These cannot be completed by repository changes alone:

- live GPS provider credentials
- live carrier compliance provider credentials
- Stripe live billing credentials
- production test user credentials
- PagerDuty/Slack webhook delivery proof

Operator evidence must be stored in the launch evidence workspace after running the production workflows.
