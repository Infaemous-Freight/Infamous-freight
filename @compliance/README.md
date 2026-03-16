# @compliance

Internal compliance domain for Infæmous Freight.

This module centralizes compliance-related logic, schemas, types, and API
wiring.

## Responsibilities

- evaluate carrier compliance status
- validate required documents
- check document expiration
- verify operational eligibility
- produce audit-friendly compliance results

## Structure

- `api/` — route wiring and API surface
- `schemas/` — validation schemas
- `services/` — orchestration logic
- `rules/` — pure business/compliance rules
- `types/` — shared contracts

## Design Rules

- keep rules pure and deterministic
- keep services orchestration-focused
- keep API thin
- never trust client-supplied tenant scope
- return structured compliance findings, not vague booleans
