# Supabase Auth Plan-Gated Security Setting

_Last updated: June 2026_

## Context

The Infæmous Supabase project currently shows the Auth security recommendation for leaked-password / compromised-password protection. This setting is plan-gated in Supabase and is only available on supported paid plans.

## Decision

Leaked-password protection is recommended for production, but it must not be treated as an unconditional CI/CD blocker while the project is on a Supabase plan that does not expose the setting.

## Current handling

- If the Supabase project plan supports leaked-password protection, enable it in Supabase Authentication settings.
- If the current plan does not support it, leave the setting disabled and record this document as accepted risk until the project is upgraded.
- CI/CD checks must not fail solely because this paid-plan-only setting is unavailable.
- Supabase Security Advisor findings that are actionable on the current plan remain launch-relevant and should continue to be fixed.

## Compensating controls

While leaked-password protection is unavailable, maintain the following controls:

- Keep email verification enabled where applicable.
- Preserve rate limiting on authentication and API routes.
- Preserve production JWT validation and tenant-aware authorization.
- Preserve RLS on tenant-owned Supabase tables.
- Avoid exposing Supabase service role keys or JWT secrets to browser/public environments.
- Monitor authentication errors and suspicious sign-in behavior.
- Upgrade the Supabase project plan before or shortly after launch if credential-risk posture requires compromised-password blocking.

## CI/CD guidance

Any auth-settings verification should use plan-aware logic:

```text
if Supabase plan supports leaked-password protection:
  assert leaked-password protection is enabled
else:
  assert accepted-risk documentation exists and do not fail deployment solely on this advisor item
```

## Review trigger

Review this decision when any of the following changes:

- Supabase project plan changes.
- Authentication provider changes.
- Public user registration volume increases.
- Compliance, customer, or insurance requirements mandate compromised-password blocking.
