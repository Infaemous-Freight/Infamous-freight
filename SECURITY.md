# Security Policy

Security issues are handled with priority. Do not open public issues for active vulnerabilities or exposed secrets.

## Reporting a vulnerability

Report security issues privately to the repository owner or organization administrator.

Include:

- affected service or file
- reproduction steps
- observed impact
- suggested fix, if known
- whether any secret, token, or credential was exposed

## Secret exposure response

If a token, password, private key, webhook secret, or API key is exposed:

1. Revoke the exposed credential immediately.
2. Create a replacement credential.
3. Update the relevant GitHub Actions, Fly.io, Netlify, Stripe, Sentry, Supabase, or other service secret.
4. Redeploy affected services.
5. Run smoke tests.
6. Document the incident and resolution in a private tracker or sanitized public issue.

Do not rely on deleting Git history as the primary fix. Assume exposed secrets are compromised.

## Supported branches

Only the default branch, `main`, is considered supported for security fixes.

## Production security expectations

- Use explicit CORS origins in production.
- Never run production with demo secrets.
- Keep deployment tokens scoped to the minimum required permission.
- Use GitHub Actions secrets for deploy credentials.
- Rotate credentials after suspected exposure.
- Keep CI, Docker, and runtime Node versions aligned.
- Validate public health endpoints after every production deploy.

## Dependency updates

Dependency changes should pass CI and include a clear reason when they affect runtime, security, build tooling, or deployment.