# GitHub Repository Settings Checklist

Use this checklist after cloning or before production launch. These settings are managed in the GitHub UI and should be reviewed by a repo admin.

## Branch protection for `main`

Recommended:

- Require pull request before merging.
- Require approvals for production-impacting changes.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Restrict force pushes.
- Restrict deletions.

Required status checks:

```text
CI / validation workflow
Deploy Fly API, when deployment files change
Smoke Test, for production launch validation
```

## Secrets and variables

Required repository secret:

```text
FLY_API_TOKEN=<rotated Fly deploy token>
```

Recommended variables or secrets:

```text
SITE_URL=https://www.infamousfreight.com
PUBLIC_SITE_URL=https://www.infamousfreight.com
VITE_SITE_URL=https://www.infamousfreight.com
NEXT_PUBLIC_SITE_URL=https://www.infamousfreight.com
VITE_API_URL=/api
```

Never store these in source files:

```text
DATABASE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
SENTRY_AUTH_TOKEN
PRIVATE_KEYS
```

## Actions permissions

Recommended:

- Allow GitHub Actions for this repository.
- Allow actions created by GitHub and verified creators.
- Set workflow permissions to read repository contents by default.
- Grant write permissions only to workflows that explicitly require them.

## Dependabot

Dependabot is configured in `.github/dependabot.yml`.

Review weekly dependency PRs and prioritize:

- security patches
- GitHub Actions updates
- build toolchain fixes
- runtime dependency updates that affect API/web production behavior

## Code ownership

CODEOWNERS is configured in `.github/CODEOWNERS`.

Verify listed owners are valid GitHub users or teams with repository access.

## Security

Security policy is configured in `SECURITY.md`.

Do not open public issues for exposed secrets or active vulnerabilities.

## Production launch gate

Before marking production ready:

```bash
./scripts/production-smoke-test.sh
```

All checks must pass.
