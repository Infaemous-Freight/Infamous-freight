# Environment Setup & Secrets Guide

## Quick Reference

```bash
# Copy template
cp .env.example .env.local

# Generate secrets
node scripts/generate-secrets.js

# Verify env vars
node scripts/verify-env.js

# Apply to deployment
kubectl create secret generic app-secrets --from-file=.env.local
```

---

## Environment Variables by Service

### API Service (apps/api/.env)

```bash
# JWT & Authentication
JWT_SECRET="your-256-bit-secret-here"                    # Required: 32+ chars
JWT_EXPIRY="7d"                                           # Optional: default 7d
ENABLE_TOKEN_ROTATION="false"                             # Optional: Enable token rotation

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/infamous_freight"  # Required
SLOW_QUERY_THRESHOLD_MS="1000"                            # Optional: default 1000ms

# Security & CORS
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"  # Required
CORS_CREDENTIALS="true"                                   # Optional: Allow credentials

# Rate Limiting (all optional, shown with defaults)
RATE_LIMIT_GENERAL_WINDOW_MS="900000"                     # 15 minutes
RATE_LIMIT_GENERAL_MAX="100"                              # 100 requests
RATE_LIMIT_AUTH_WINDOW_MS="900000"
RATE_LIMIT_AUTH_MAX="5"
RATE_LIMIT_AI_WINDOW_MS="60000"
RATE_LIMIT_AI_MAX="20"
RATE_LIMIT_BILLING_WINDOW_MS="900000"
RATE_LIMIT_BILLING_MAX="30"
RATE_LIMIT_VOICE_WINDOW_MS="60000"
RATE_LIMIT_VOICE_MAX="10"

# AI Service (optional)
AI_PROVIDER="synthetic"                                   # Options: openai, anthropic, synthetic
OPENAI_API_KEY=""                                         # If AI_PROVIDER=openai
ANTHROPIC_API_KEY=""                                      # If AI_PROVIDER=anthropic

# Billing (optional, if using Stripe)
STRIPE_SECRET_KEY="sk_live_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
STRIPE_CONNECT_ACCOUNT_ID=""                              # Optional: for multi-tenant

# Voice Processing (optional)
VOICE_MAX_FILE_SIZE_MB="10"                               # Max upload size

# Monitoring & Logging (optional)
LOG_LEVEL="info"                                          # Options: error, warn, info, debug
SENTRY_DSN=""                                             # Optional: For error tracking

# Port (optional)
API_PORT="4000"                                           # Default: 4000
NODE_ENV="production"                                     # Options: development, production

# Server URLs
WEB_URL="https://yourdomain.com"                          # For email links, etc.
API_BASE_URL="https://api.yourdomain.com"                 # For frontend requests
```

### Web Service (apps/web/.env.local)

```bash
# API Communication
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"          # Required: Backend URL
API_BASE_URL="https://api.yourdomain.com"                 # SSR requests

# Environment
NEXT_PUBLIC_ENV="production"                              # Options: development, production
NODE_ENV="production"

# Port
WEB_PORT="3000"                                           # Default: 3000

# Analytics (optional)
NEXT_PUBLIC_GA_ID=""                                      # Google Analytics
NEXT_PUBLIC_DD_APP_ID=""                                  # Datadog RUM
NEXT_PUBLIC_DD_CLIENT_TOKEN=""
NEXT_PUBLIC_DD_SITE="datadoghq.com"                       # or datadoghq.eu for EU
```

---

## Generating Secrets

### Option 1: Using Node Script

```bash
# Create generate-secrets.js in root
cat > scripts/generate-secrets.js << 'EOF'
const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('=== Generated Secrets ===\n');
console.log(`JWT_SECRET="${generateSecret(32)}"`);
console.log(`STRIPE_WEBHOOK_SECRET="${generateSecret(32)}"`);
console.log('\nCopy these to your .env.local and .env.production');
EOF

node scripts/generate-secrets.js
```

### Option 2: Using OpenSSL

```bash
# JWT Secret (256 bits = 32 bytes)
openssl rand -hex 32

# Webhook Secret (256 bits)
openssl rand -hex 32

# Database Password (32 chars)
openssl rand -base64 32
```

### Option 3: Using Python

```bash
python3 << 'EOF'
import secrets
print(f'JWT_SECRET="{secrets.token_hex(32)}"')
print(f'STRIPE_WEBHOOK_SECRET="{secrets.token_hex(32)}"')
print(f'DB_PASSWORD="{secrets.token_urlsafe(32)}"')
EOF
```

---

## Verification Script

```bash
# Create scripts/verify-env.js
cat > scripts/verify-env.js << 'EOF'
const fs = require('fs');
const path = require('path');

const requiredVars = {
  'api': [
    'JWT_SECRET',
    'DATABASE_URL',
    'CORS_ORIGINS',
    'NODE_ENV',
  ],
  'web': [
    'NEXT_PUBLIC_API_URL',
    'NODE_ENV',
  ],
};

function checkEnv(service) {
  const envFile = path.join(process.cwd(), service, '.env.local');
  if (!fs.existsSync(envFile)) {
    console.log(`⚠️  ${service}/.env.local not found`);
    return false;
  }

  const env = require('dotenv').parse(fs.readFileSync(envFile));
  let ok = true;

  requiredVars[service].forEach(varName => {
    if (!env[varName]) {
      console.log(`❌ ${service}: Missing ${varName}`);
      ok = false;
    } else {
      console.log(`✅ ${service}: ${varName} set`);
    }
  });

  return ok;
}

const apiOk = checkEnv('api');
const webOk = checkEnv('web');

if (apiOk && webOk) {
  console.log('\n✅ All environment variables verified!');
  process.exit(0);
} else {
  console.log('\n❌ Missing required environment variables');
  process.exit(1);
}
EOF

node scripts/verify-env.js
```

---

## Kubernetes Secrets

### Creating Secrets from .env Files

```bash
# Single secret
kubectl create secret generic app-secrets \
  --from-file=api.env=apps/api/.env.local \
  --from-file=web.env=apps/web/.env.local \
  -n infamous-freight

# Or from file
kubectl apply -f - << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: infamous-freight
type: Opaque
data:
  jwt-secret: $(echo -n "YOUR_JWT_SECRET" | base64)
  database-url: $(echo -n "postgresql://..." | base64)
  cors-origins: $(echo -n "https://yourdomain.com" | base64)
EOF
```

### Using Secrets in Deployments

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
      - name: api
        image: infamous-freight-api:1.0.0
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: CORS_ORIGINS
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: cors-origins
```

---

## AWS Secrets Manager Integration

```bash
# Store secret
aws secretsmanager create-secret \
  --name infamous-freight/api \
  --secret-string file://api/.env.local

# Retrieve in container (in Dockerfile or entrypoint)
aws secretsmanager get-secret-value \
  --secret-id infamous-freight/api \
  --query SecretString \
  --output text > /app/.env

# Use IAM role for access (no hardcoded credentials)
```

---

## Environment-Specific Configs

### Development (.env.local)

```bash
NODE_ENV="development"
JWT_SECRET="dev-secret-change-me"
DATABASE_URL="postgresql://dev:dev@localhost:5432/infamous_dev"
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
SLOW_QUERY_THRESHOLD_MS="500"      # More aggressive in dev
LOG_LEVEL="debug"
AI_PROVIDER="synthetic"
```

### Staging (.env.staging)

```bash
NODE_ENV="production"
JWT_SECRET="[generated secret]"
DATABASE_URL="postgresql://user:pass@staging-db.internal:5432/infamous_staging"
CORS_ORIGINS="https://staging.yourdomain.com"
LOG_LEVEL="info"
SENTRY_DSN="https://xxxxx@sentry.io/project-id"
```

### Production (.env.production)

```bash
NODE_ENV="production"
JWT_SECRET="[generated secret - NEVER COMMIT]"
DATABASE_URL="[RDS/DigitalOcean URL - never commit]"
CORS_ORIGINS="https://yourdomain.com"
LOG_LEVEL="warn"                    # Less verbose in prod
SENTRY_DSN="https://xxxxx@sentry.io/project-id"
STRIPE_SECRET_KEY="sk_live_xxxxx"   # Live Stripe key
```

---

## Environment Validation

### Pre-Deployment Checklist

```bash
# 1. Check all required vars are set
npm run verify-env

# 2. Check no secrets in git
git grep -i "secret\|password\|key" -- '*.md' '*.js' '*.ts' | grep -v "process.env"

# 3. Verify .env files are in .gitignore
cat .gitignore | grep "\.env"

# 4. Test database connection
psql $DATABASE_URL -c "SELECT version();"

# 5. Test API with secrets
JWT_TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({sub:'test'}, process.env.JWT_SECRET))")
curl -H "Authorization: Bearer $JWT_TOKEN" https://api.yourdomain.com/api/health
```

---

## Rotating Secrets

### JWT Secret Rotation

```bash
# 1. Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -hex 32)

# 2. Update in Kubernetes
kubectl patch secret app-secrets -p \
  "{\"data\":{\"jwt-secret\":\"$(echo -n $NEW_JWT_SECRET | base64 -w0)\"}}"

# 3. Restart pods (will pick up new secret)
kubectl rollout restart deployment/api

# 4. Monitor for errors
kubectl logs -f deployment/api

# 5. Old tokens will fail (expect some 401s for ~5 min)
# Clients need to re-authenticate
```

### Database Password Rotation

```bash
# 1. Update database password
psql -U admin -d postgres -c "ALTER USER infamous_user PASSWORD 'new_password';"

# 2. Update Kubernetes secret
kubectl patch secret app-secrets -p \
  "{\"data\":{\"database-url\":\"$(echo -n 'postgresql://infamous_user:new_password@...' | base64 -w0)\"}}"

# 3. Restart API pods
kubectl rollout restart deployment/api

# 4. Verify connection
kubectl logs deployment/api | grep "database\|connected"
```

---

## Security Best Practices

✅ **Do**:

- Store secrets in Kubernetes Secrets or AWS Secrets Manager
- Rotate secrets every 90 days
- Use 32+ character random strings for secrets
- Restrict secret access with IAM roles
- Audit all secret access

❌ **Don't**:

- Commit `.env.local` or `.env.production` to git
- Log secrets to console (even in error messages)
- Share secrets via Slack/email
- Hardcode secrets in Dockerfile or code
- Use same secret across environments

---

## Troubleshooting

### "Missing JWT_SECRET"

```bash
# Check if set in current shell
echo $JWT_SECRET

# Check if in container
kubectl exec -it pod/api -- env | grep JWT

# Check if in Kubernetes secret
kubectl get secret app-secrets -o jsonpath='{.data.jwt-secret}' | base64 -d
```

### "Connection refused" (Database)

```bash
# Test connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check if host/port correct
echo $DATABASE_URL

# Verify network access
kubectl exec -it pod/api -- \
  nc -zv $(echo $DATABASE_URL | grep -oP '(?<=@).*?(?=:)')
```

### Secrets not updated after Kubernetes patch

```bash
# Kubernetes caches secrets - need pod restart
kubectl rollout restart deployment/api

# Or delete and recreate secret
kubectl delete secret app-secrets
kubectl create secret generic app-secrets --from-file=...
kubectl rollout restart deployment/api
```

---

**Last Updated**: 2026-01-22  
**Status**: Production Ready  
**Owner**: DevOps Team
