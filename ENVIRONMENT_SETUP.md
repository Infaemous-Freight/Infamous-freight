# Environment Setup & Configuration Guide

## Overview

This guide covers complete environment configuration for the Infamous Freight Enterprises platform.

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.example .env.development
cp .env.example .env.production
```

### 2. Update Critical Variables

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update JWT_SECRET in .env files
JWT_SECRET=your_generated_secret_here
```

### 3. Database Setup

```bash
# Start PostgreSQL (Docker)
docker-compose up -d postgres

# Run migrations
pnpm prisma:migrate:dev --name init

# Seed database (optional)
pnpm prisma:seed
```

## Configuration Variables

### Critical (Production Required)

- `NODE_ENV` - Set to `production` in production
- `JWT_SECRET` - Use strong, randomly generated value (minimum 32 chars)
- `DATABASE_URL` - PostgreSQL connection string
- `API_URL` - Public API endpoint
- `APP_URL` - Web application URL

### API Configuration

- `API_PORT` - API server port (default: 4000, Docker: 3001)
- `LOG_LEVEL` - Logging level (error, warn, info, debug)
- `SENTRY_DSN` - Error tracking endpoint
- `CORS_ORIGINS` - Comma-separated allowed origins

### AI Services

- `AI_PROVIDER` - Provider type (openai, anthropic, synthetic)
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `ANTHROPIC_API_KEY` - Anthropic API key (if using Claude)
- `AI_SECURITY_MODE` - Security level (strict, permissive)

### Payment Services

- `STRIPE_SECRET_KEY` - Stripe API secret
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYPAL_ENV` - PayPal environment (sandbox, live)

### Rate Limiting (Configurable)

```
RATE_LIMIT_GENERAL_MAX=100        # Requests per window
RATE_LIMIT_AUTH_MAX=5              # Auth attempts per window
RATE_LIMIT_AI_MAX=20               # AI requests per minute
RATE_LIMIT_BILLING_MAX=30          # Billing ops per window
RATE_LIMIT_VOICE_MAX=10            # Voice uploads per minute
```

### Feature Flags

```
ENABLE_AI_COMMANDS=true
ENABLE_VOICE_PROCESSING=true
ENABLE_NEW_BILLING=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

## Environment-Specific Setup

### Development

```bash
# .env.development
NODE_ENV=development
API_PORT=4000
WEB_PORT=3000
LOG_LEVEL=debug
AI_PROVIDER=synthetic
```

### Staging

```bash
# .env.staging
NODE_ENV=production
API_URL=https://api-staging.infamousfreight.com
APP_URL=https://staging.infamousfreight.com
LOG_LEVEL=info
SENTRY_TRACES_SAMPLE_RATE=0.5
```

### Production

```bash
# .env.production
NODE_ENV=production
API_URL=https://api.infamousfreight.com
APP_URL=https://infamousfreight.com
LOG_LEVEL=warn
SENTRY_TRACES_SAMPLE_RATE=0.1
JWT_SECRET=<use_secrets_manager>
```

## Secret Management

### Local Development

- Use `.env.development` (gitignored)
- Generate test secrets locally
- Never commit real secrets

### Production

**Do NOT use .env files in production**

Use secrets management:

- **GitHub Actions** → Use `GITHUB_TOKEN` and repository secrets
- **Docker** → Use Docker secrets or environment variables from orchestrator
- **AWS** → AWS Secrets Manager
- **Azure** → Azure Key Vault
- **Heroku** → Config vars
- **Vercel** → Environment variables dashboard

## Validation

### Pre-Startup Check

```bash
# Validate environment
pnpm validate:env

# Or manually with Node
node apps/api/scripts/env.validation.js
```

### Health Check

```bash
# Check API is running
curl http://localhost:4000/api/health

# Expected response:
# {"uptime": 12.345, "timestamp": 1705345000000, "status": "ok"}
```

## Database Configuration

### Connection String Format

```
postgresql://username:password@host:port/database

# Example
postgresql://infamous:infamouspass@localhost:5432/infamous_freight
```

### Docker Setup

```bash
# Start database
docker-compose up -d postgres

# Access psql
docker-compose exec postgres psql -U infamous -d infamous_freight

# View connection details
docker-compose config | grep -A 5 postgres
```

### Connection Testing

```bash
# From api directory
npm run validate:env

# Or test directly
psql $DATABASE_URL -c "SELECT 1"
```

## AI Provider Setup

### OpenAI

```bash
OPENAI_API_KEY=sk_test_...
AI_PROVIDER=openai
```

### Anthropic (Claude)

```bash
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic
```

### Synthetic (Built-in for Testing)

```bash
AI_PROVIDER=synthetic
# No API key needed, uses mock responses
```

## Security Headers

### CORS Configuration

```bash
# Comma-separated origins
CORS_ORIGINS=http://localhost:3000,https://app.example.com
```

### Content Security Policy

```bash
CSP_REPORT_URI=/api/security/csp-violations
```

## Monitoring & Analytics

### Sentry Error Tracking

```bash
SENTRY_DSN=https://key@sentry.io/project
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of requests
```

### Datadog APM

```bash
DD_TRACE_ENABLED=true
DD_SERVICE=infamous-freight-api
DD_ENV=production
```

### Analytics

```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXX
VITE_PLAUSIBLE_DOMAIN=yourdomain.com
```

## Troubleshooting

### Database Connection Failed

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# View Docker logs
docker-compose logs postgres
```

### Missing Environment Variables

```bash
# Run validation
node apps/api/scripts/env.validation.js

# Lists missing required variables
```

### Port Already in Use

```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>

# Or change port
API_PORT=4001 pnpm dev:api
```

## Environment Variable Checklist

- [ ] `NODE_ENV` set appropriately
- [ ] `JWT_SECRET` generated (32+ chars)
- [ ] `DATABASE_URL` configured
- [ ] `API_PORT` available
- [ ] `API_URL` points to correct endpoint
- [ ] `APP_URL` configured
- [ ] Payment keys configured (Stripe/PayPal)
- [ ] AI provider selected and keys added
- [ ] `CORS_ORIGINS` configured
- [ ] Logging level set
- [ ] Rate limits configured
- [ ] Feature flags enabled/disabled as needed

## Additional Resources

- [.env.example](.env.example) - Complete template
- [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) - API documentation
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [SECURITY.md](SECURITY.md) - Security best practices
