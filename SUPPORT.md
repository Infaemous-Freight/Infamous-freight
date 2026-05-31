# Support

This document explains how to get help with INFÆMOUS FREIGHT.

## Before requesting support

Check these documents first:

- [`README.md`](README.md)
- [`docs/current-status.md`](docs/current-status.md)
- [`docs/PRODUCTION_SMOKE_TESTING.md`](docs/PRODUCTION_SMOKE_TESTING.md)
- [`docs/LOCAL_STARTUP_CHECKLIST.md`](docs/LOCAL_STARTUP_CHECKLIST.md)
- [`docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md`](docs/environment/ENVIRONMENT_VARIABLES_COMPLETE.md)

## Reporting bugs

Open a GitHub Issue with:

- affected route or script
- environment: local, Netlify, Fly.io, or other
- expected behavior
- actual behavior
- reproduction steps
- screenshots or logs with secrets removed
- commit SHA or deploy identifier when available

## Production issues

For production issues, include:

- affected URL
- deployment timestamp
- Netlify deploy identifier when available
- Fly.io app/version details when available
- health check output
- whether billing, tracking, quote intake, or authenticated routes are affected
- known recent changes

Do not paste secrets, tokens, private keys, customer billing data, driver personal data, or private shipment details into public issues.

## Security issues

Do not open public issues for security vulnerabilities. Use the responsible disclosure process in [`SECURITY.md`](SECURITY.md).

## Feature requests

Open a GitHub Issue or Discussion with:

- feature summary
- target user: owner-operator, carrier, broker, shipper, dispatcher, or enterprise logistics team
- business value
- operational risk
- route or module affected
- expected acceptance criteria

## Current readiness

Before requesting launch approval or public customer use, verify [`docs/current-status.md`](docs/current-status.md). Some operator-facing routes may remain demo-backed or gated.
