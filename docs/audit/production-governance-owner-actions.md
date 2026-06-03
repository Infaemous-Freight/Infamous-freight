# INFÆMOUS FREIGHT — Owner-Only Production Governance Actions

This document tracks the remaining actions that require direct administrative access outside normal repository file commits.

## GitHub organization and repository settings

- [ ] Turn on repository security scanning features available for the organization plan.
- [ ] Turn on push-time blocking for credential-like material where available.
- [ ] Turn on Dependabot alerts.
- [ ] Turn on Dependabot security updates.
- [ ] Protect `main`.
- [ ] Protect `production` if used.
- [ ] Protect `release/*` if used.
- [ ] Require pull request review before merge.
- [ ] Require all required checks to pass before merge.
- [ ] Require branches to be up to date before merge.
- [ ] Restrict force pushes.
- [ ] Restrict branch deletion.
- [ ] Limit bypass permissions to the owner only.
- [ ] Preserve workflow run history for release and security evidence.

## Required status checks to configure

Use the exact check names produced by current workflows after they run successfully:

- CodeQL / analyze
- Secret scan / gitleaks
- OpenSSF Scorecard / scorecard
- existing build/test/lint/typecheck workflows
- production smoke workflow, if present

## Release evidence required before production approval

- [ ] Netlify production deploy URL and deploy result captured.
- [ ] Fly.io API deployment and health check captured.
- [ ] Supabase migration/auth/storage status captured if changed.
- [ ] Stripe webhook delivery verified if billing changed.
- [ ] Registration flow tested.
- [ ] Login flow tested.
- [ ] Public quote request tested.
- [ ] Public tracking tested with a known-safe tracking number.
- [ ] Authenticated load creation tested.
- [ ] Dispatch workflow tested.
- [ ] Billing/customer portal tested.

## Credential rotation evidence template

| System | Credential class | Rotated? | Date | Evidence location | Owner |
|---|---|---:|---|---|---|
| GitHub | deployment/integration token | No |  |  |  |
| Fly.io | deploy token | No |  |  |  |
| Netlify | site/team token | No |  |  |  |
| Supabase | app/backend keys | No |  |  |  |
| Stripe | API/webhook keys | No |  |  |  |
| Sentry | DSN/auth token | No |  |  |  |
| Package registry | publish token | No |  |  |  |

## Go/no-go rule

Infamous Freight should not be marked 100/100 production-ready until every P0 item above has evidence attached and no Critical/High security alerts remain open.
