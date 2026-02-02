# Production Environment Variables Configuration

# Complete guide for setting up all required secrets and configurations

## 🔐 Required Secrets (MUST be set)

### Database

```bash
# Automatically set when attaching Postgres
DATABASE_URL="postgresql://user:pass@hostname:5432/dbname"
```

### Authentication

```bash
# Generate secure JWT secret
JWT_SECRET="$(openssl rand -base64 32)"

# Set via Fly.io
flyctl secrets set JWT_SECRET="your-generated-secret" --app infamous-freight-api
```

### CORS Origins

```bash
# Comma-separated list of allowed origins
CORS_ORIGINS="https://infamous-freight-enterprises.fly.dev,https://infamous-freight-enterprises.vercel.app"

flyctl secrets set CORS_ORIGINS="$CORS_ORIGINS" --app infamous-freight-api
```

## 🤖 AI Provider Configuration

### Option 1: OpenAI (Recommended)

```bash
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."

flyctl secrets set \
  AI_PROVIDER="openai" \
  OPENAI_API_KEY="your-openai-key" \
  --app infamous-freight-api
```

### Option 2: Anthropic Claude

```bash
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."

flyctl secrets set \
  AI_PROVIDER="anthropic" \
  ANTHROPIC_API_KEY="your-anthropic-key" \
  --app infamous-freight-api
```

### Option 3: Synthetic (Testing/Development)

```bash
AI_PROVIDER="synthetic"
# No API key needed - uses built-in mock responses
```

## 💳 Billing Configuration

### Stripe

```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

flyctl secrets set \
  STRIPE_SECRET_KEY="your-stripe-key" \
  STRIPE_WEBHOOK_SECRET="your-webhook-secret" \
  --app infamous-freight-api
```

### PayPal

```bash
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="live"  # or "sandbox" for testing

flyctl secrets set \
  PAYPAL_CLIENT_ID="your-client-id" \
  PAYPAL_CLIENT_SECRET="your-client-secret" \
  PAYPAL_MODE="live" \
  --app infamous-freight-api
```

## 📊 Monitoring & Error Tracking

### Sentry

```bash
# Get DSN from https://sentry.io/settings/projects/
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ENVIRONMENT="production"

flyctl secrets set \
  SENTRY_DSN="your-sentry-dsn" \
  SENTRY_ENVIRONMENT="production" \
  --app infamous-freight-api
```

### Datadog APM

```bash
DD_TRACE_ENABLED="true"
DD_SERVICE="infamous-freight-api"
DD_ENV="production"
DD_API_KEY="..."
DD_RUNTIME_METRICS_ENABLED="true"

flyctl secrets set \
  DD_TRACE_ENABLED="true" \
  DD_SERVICE="infamous-freight-api" \
  DD_ENV="production" \
  DD_API_KEY="your-dd-api-key" \
  DD_RUNTIME_METRICS_ENABLED="true" \
  --app infamous-freight-api
```

## 🗄️ Caching (Optional)

### Redis

```bash
# Create Redis instance first
flyctl redis create --name infamous-freight-redis --region iad

# Get connection URL
flyctl redis status infamous-freight-redis

# Set secret
REDIS_URL="redis://default:password@hostname:6379"

flyctl secrets set REDIS_URL="your-redis-url" --app infamous-freight-api
```

## ⚙️ Application Configuration

### Node Environment

```bash
NODE_ENV="production"
LOG_LEVEL="info"  # error | warn | info | debug

flyctl secrets set \
  NODE_ENV="production" \
  LOG_LEVEL="info" \
  --app infamous-freight-api
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS="900000"      # 15 minutes in ms
RATE_LIMIT_MAX_REQUESTS="100"     # requests per window

flyctl secrets set \
  RATE_LIMIT_WINDOW_MS="900000" \
  RATE_LIMIT_MAX_REQUESTS="100" \
  --app infamous-freight-api
```

### Voice Processing

```bash
VOICE_MAX_FILE_SIZE_MB="10"

flyctl secrets set VOICE_MAX_FILE_SIZE_MB="10" --app infamous-freight-api
```

## 🌐 Web Frontend Environment Variables

### Vercel Deployment

```bash
# Set in Vercel dashboard: https://vercel.com/[your-project]/settings/environment-variables

# Required
NEXT_PUBLIC_API_URL="https://infamous-freight-api.fly.dev"
NEXT_PUBLIC_ENV="production"

# Optional - Datadog RUM
NEXT_PUBLIC_DD_APP_ID="..."
NEXT_PUBLIC_DD_CLIENT_TOKEN="..."
NEXT_PUBLIC_DD_SITE="datadoghq.com"
NEXT_PUBLIC_DD_SERVICE="infamous-freight-web"

# Optional - Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="..."
```

## 📋 Quick Setup Script

```bash
#!/bin/bash
# Run this script to set all production secrets at once

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)

# Set all secrets
flyctl secrets set \
  JWT_SECRET="$JWT_SECRET" \
  NODE_ENV="production" \
  LOG_LEVEL="info" \
  AI_PROVIDER="synthetic" \
  CORS_ORIGINS="https://infamous-freight-enterprises.fly.dev,https://infamous-freight-enterprises.vercel.app" \
  RATE_LIMIT_WINDOW_MS="900000" \
  RATE_LIMIT_MAX_REQUESTS="100" \
  VOICE_MAX_FILE_SIZE_MB="10" \
  --app infamous-freight-api

echo "✅ Basic secrets configured!"
echo ""
echo "⚠️  Still need to configure:"
echo "- SENTRY_DSN (error tracking)"
echo "- OPENAI_API_KEY or ANTHROPIC_API_KEY (AI features)"
echo "- STRIPE_SECRET_KEY (billing)"
echo "- REDIS_URL (caching)"
```

## 🔍 Verify Configuration

```bash
# List all secrets (values are hidden)
flyctl secrets list --app infamous-freight-api

# Test API health with secrets loaded
curl https://infamous-freight-api.fly.dev/api/health

# Check logs for configuration errors
flyctl logs --app infamous-freight-api
```

## 🚨 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for local development
   - Always use `flyctl secrets set` for production

2. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days
   - API keys: When exposed or quarterly
   - Database passwords: Every 180 days

3. **Use environment-specific values**
   - Different keys for development/staging/production
   - Never use production keys in development

4. **Audit secret access**

   ```bash
   flyctl auth whoami  # Check who has access
   flyctl apps list    # Verify your apps
   ```

## 📖 Documentation

- Fly.io Secrets: <https://fly.io/docs/reference/secrets/>
- Prisma Connection URLs: <https://www.prisma.io/docs/reference/database-reference/connection-urls>
- Sentry Setup: <https://docs.sentry.io/platforms/node/>
- Datadog APM: <https://docs.datadoghq.com/tracing/>

## 🆘 Troubleshooting

### Secrets not updating

```bash
# Restart app after setting secrets
flyctl apps restart infamous-freight-api
```

### Database connection failing

```bash
# Verify DATABASE_URL is set
flyctl secrets list --app infamous-freight-api | grep DATABASE

# Test connection
flyctl ssh console --app infamous-freight-api
# Then: echo $DATABASE_URL
```

### CORS errors

```bash
# Verify CORS_ORIGINS matches your frontend URL exactly
flyctl secrets list --app infamous-freight-api | grep CORS
```

### AI provider not working

```bash
# Check AI_PROVIDER is set correctly
flyctl logs --app infamous-freight-api | grep -i "ai provider"

# Verify API key is set (if not using synthetic)
flyctl secrets list --app infamous-freight-api | grep -E "OPENAI|ANTHROPIC"
```
