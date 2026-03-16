# Environment Variables Documentation

This document describes all environment variables used in the Infæmous Freight
Enterprises project.

## Required Variables

These must be set for the application to function properly.

### API Configuration

- `NODE_ENV` - Application environment (development, staging, production)
- `JWT_SECRET` - Secret key for JWT token signing
- `DATABASE_URL` - PostgreSQL connection string
- `SENTRY_DSN` - Sentry error tracking DSN (optional but recommended)

### AI & Integration

- `OPENAI_API_KEY` - OpenAI API key for GPT integration
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude integration
- `AI_PROVIDER` - Which AI provider to use (openai or anthropic)

### Payment Processing

- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_SUCCESS_URL` - URL for successful Stripe payments
- `STRIPE_CANCEL_URL` - URL for cancelled Stripe payments
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_SECRET` - PayPal client secret

### Voice Features

- `VOICE_MAX_FILE_SIZE_MB` - Maximum voice file size in MB (default: 10)

## Optional Variables

These provide additional functionality but have sensible defaults.

### Logging & Monitoring

- `LOG_LEVEL` - Logging level (debug, info, warn, error) - default: info
- `AUDIT_LOG` - Enable audit logging (off to disable) - default: enabled
- `HEALTH_URL` - Health check URL - default: /api/health

### Rate Limiting

- `RATE_LIMIT_POINTS` - Number of points per rate limit window - default: 100
- `RATE_LIMIT_DURATION` - Rate limit window duration in seconds - default: 60
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins - default:
  <http://localhost:3000>

### AI Security

- `AI_SECURITY_MODE` - AI security mode (strict, moderate, lenient) - default:
  moderate
- `AI_PROVIDER` - AI provider selection (openai, anthropic) - default: openai
- `AI_SYNTHETIC_ENGINE_URL` - URL for synthetic AI engine
- `AI_SYNTHETIC_API_KEY` - API key for synthetic AI engine
- `AI_HTTP_TIMEOUT_MS` - HTTP timeout for AI requests - default: 30000

## Environment-Specific Setup

### Development (.env.local)

```bash
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/infamous_freight
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_test_xxx
PAYPAL_CLIENT_ID=xxx
PAYPAL_SECRET=xxx
LOG_LEVEL=debug
```

### Staging

```bash
NODE_ENV=staging
JWT_SECRET=(secure-key-from-secrets-manager)
DATABASE_URL=(production-replica-connection)
SENTRY_DSN=(staging-sentry-dsn)
OPENAI_API_KEY=(staging-key)
LOG_LEVEL=info
```

### Production

```bash
NODE_ENV=production
JWT_SECRET=(secure-key-from-secrets-manager)
DATABASE_URL=(encrypted-production-connection)
SENTRY_DSN=(production-sentry-dsn)
OPENAI_API_KEY=(production-key)
LOG_LEVEL=warn
```

## Security Best Practices

1. **Never commit .env files** - Use `.env.local` which is gitignored
2. **Use environment-specific values** - Different keys for dev/staging/prod
3. **Rotate secrets regularly** - Change API keys quarterly
4. **Use secrets management** - AWS Secrets Manager, HashiCorp Vault, or GitHub
   Secrets
5. **Validate on startup** - Application validates required vars at startup
6. **Monitor changes** - Log when sensitive env vars are accessed
7. **Limit exposure** - Don't log API keys or secrets
8. **Use secure defaults** - Err on the side of caution with defaults

## Validation

The API validates all required environment variables on startup:

```bash
# Check validation
node apps/api/scripts/env.validation.js
```

## Docker Environment

When running in Docker, set variables via:

1. `.env.local` file (mounted as volume)
2. `.env` environment file in docker-compose
3. `docker run -e VAR=value`
4. Kubernetes secrets

Example docker-compose:

```yaml
services:
  api:
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
```

## Adding New Environment Variables

When adding a new environment variable:

1. Add it to this documentation
2. Add validation in `apps/api/scripts/env.validation.js`
3. Add default value to `.env.example` (if non-sensitive)
4. Add TypeScript type in `packages/shared/src/types.ts`
5. Document in API JSDoc comments

## References

- [Shared Package Env Helpers](packages/shared/src/env.ts)
- [API Env Validation](apps/api/scripts/env.validation.js)
- [Environment Guide](docs/env.guide.md)
