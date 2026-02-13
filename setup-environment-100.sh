#!/bin/bash
# 🔧 INFÆMOUS FREIGHT - COMPLETE ENVIRONMENT SETUP
# Automated environment configuration for all platforms
# Author: Santorio Djuan Miles
# Date: February 13, 2026

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        INFÆMOUS FREIGHT - ENVIRONMENT SETUP 100%             ║
║                                                               ║
║     Complete automated environment configuration             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo -e "${BLUE}Creating .env.production from template...${NC}"
    cat > .env.production << 'ENVEOF'
# INFÆMOUS FREIGHT - Production Environment Configuration
# Generated: $(date +"%Y-%m-%d %H:%M:%S")
# DO NOT COMMIT THIS FILE

# ============================================================================
# GENERAL
# ============================================================================
NODE_ENV=production
API_PORT=3001
WEB_PORT=3000
LOG_LEVEL=info

# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL=postgresql://user:password@host:5432/infamous_freight?schema=public

# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================
JWT_SECRET=CHANGE_ME_TO_A_SECURE_RANDOM_STRING_AT_LEAST_64_CHARS
JWT_EXPIRATION=7d
CORS_ORIGINS=https://infamous-freight-enterprises.vercel.app,https://infamous-freight.fly.dev

# ============================================================================
# AI SERVICES
# ============================================================================
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# ============================================================================
# PAYMENT PROCESSING
# ============================================================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# ============================================================================
# MONITORING & OBSERVABILITY
# ============================================================================
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ENVIRONMENT=production
DD_API_KEY=...
DD_APP_KEY=...
DD_SITE=datadoghq.com
DD_ENV=production
DD_SERVICE=infamous-freight-api
DD_TRACE_ENABLED=true

# ============================================================================
# CLOUD SERVICES
# ============================================================================
# Fly.io
FLY_API_TOKEN=...

# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=infamous-freight-uploads

# ============================================================================
# REDIS CACHE
# ============================================================================
REDIS_URL=redis://default:password@host:6379

# ============================================================================
# EMAIL SERVICE
# ============================================================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=...
SMTP_FROM=noreply@infamousfreight.com

# ============================================================================
# FEATURE FLAGS
# ============================================================================
FEATURE_AI_COMMANDS=true
FEATURE_VOICE_COMMANDS=true
FEATURE_MARKETPLACE=true
MARKETPLACE_ENABLED=true
BULLBOARD_ENABLED=true

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# FILE UPLOAD
# ============================================================================
VOICE_MAX_FILE_SIZE_MB=10
UPLOAD_MAX_FILE_SIZE_MB=50

# ============================================================================
# WEB APPLICATION
# ============================================================================
NEXT_PUBLIC_API_URL=https://infamous-freight.fly.dev
NEXT_PUBLIC_API_BASE_URL=https://infamous-freight.fly.dev/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_ENV=production

# ============================================================================
# DATADOG RUM (Frontend)
# ============================================================================
NEXT_PUBLIC_DD_APP_ID=...
NEXT_PUBLIC_DD_CLIENT_TOKEN=...
NEXT_PUBLIC_DD_SITE=datadoghq.com

# ============================================================================
# DEPLOYMENT
# ============================================================================
RELEASE_SHA=
BUILD_ID=
DEPLOYMENT_ENV=production
ENVEOF
    echo -e "${GREEN}✓ Created .env.production${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env.production and add your actual values${NC}"
else
    echo -e "${GREEN}✓ .env.production already exists${NC}"
fi

# Create .env.local for local development if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${BLUE}Creating .env.local for local development...${NC}"
    cat > .env.local << 'ENVEOF'
# INFÆMOUS FREIGHT - Local Development Environment
# Generated: $(date +"%Y-%m-%d %H:%M:%S")
# DO NOT COMMIT THIS FILE

NODE_ENV=development
API_PORT=4000
WEB_PORT=3000
LOG_LEVEL=debug

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infamous_freight?schema=public

# Local development secrets (use test values)
JWT_SECRET=development-secret-key-change-in-production-at-least-64-chars
JWT_EXPIRATION=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:4000

# AI Services (synthetic mode for dev)
AI_PROVIDER=synthetic

# Monitoring (optional in dev)
SENTRY_DSN=
DD_TRACE_ENABLED=false

# Local Redis
REDIS_URL=redis://localhost:6379

# Feature flags (all enabled in dev)
FEATURE_AI_COMMANDS=true
FEATURE_VOICE_COMMANDS=true
FEATURE_MARKETPLACE=true
MARKETPLACE_ENABLED=true
BULLBOARD_ENABLED=true

# Rate limiting (relaxed in dev)
RATE_LIMIT_ENABLED=false

# Local API endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_ENV=development
ENVEOF
    echo -e "${GREEN}✓ Created .env.local${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# Set required GitHub secrets helper
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}GITHUB SECRETS SETUP${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cat << 'EOF'

To enable automated CI/CD deployments, set the following GitHub secrets:

Required Secrets:
  - DATABASE_URL             PostgreSQL connection string
  - JWT_SECRET              Secure JWT signing key (64+ chars)
  - FLY_API_TOKEN           Fly.io API token
  - VERCEL_TOKEN            Vercel deployment token
  - VERCEL_ORG_ID           Vercel organization ID
  - VERCEL_PROJECT_ID       Vercel project ID

Optional but Recommended:
  - SENTRY_DSN              Error tracking
  - SENTRY_AUTH_TOKEN       Source map uploads
  - STRIPE_SECRET_KEY       Payment processing
  - OPENAI_API_KEY          AI features
  - DD_API_KEY              Datadog monitoring

To set secrets using GitHub CLI:
  gh secret set SECRET_NAME

To set secrets via GitHub web UI:
  https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions

EOF

echo -e "${YELLOW}Press Enter to continue after reviewing...${NC}"
read

# Validate environment variables
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}ENVIRONMENT VALIDATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f ".env.production" ]; then
    echo -e "${BLUE}Validating .env.production...${NC}"
    
    # Check for CHANGE_ME placeholders
    if grep -q "CHANGE_ME" .env.production; then
        echo -e "${RED}❌ .env.production contains placeholder values${NC}"
        echo -e "${YELLOW}Please replace CHANGE_ME values with actual credentials${NC}"
    else
        echo -e "${GREEN}✓ No placeholder values found${NC}"
    fi
    
    # Check critical variables
    CRITICAL_VARS=("DATABASE_URL" "JWT_SECRET" "CORS_ORIGINS")
    for var in "${CRITICAL_VARS[@]}"; do
        if grep -q "^$var=" .env.production; then
            echo -e "${GREEN}✓ $var is set${NC}"
        else
            echo -e "${RED}❌ $var is missing${NC}"
        fi
    done
fi

# Setup completion
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}SETUP COMPLETE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cat << EOF

${GREEN}✅ Environment setup complete!${NC}

${CYAN}📋 Next Steps:${NC}

1. ${YELLOW}Edit environment files with your actual values:${NC}
   - .env.production (for production deployment)
   - .env.local (for local development)

2. ${YELLOW}Set GitHub secrets:${NC}
   gh secret set DATABASE_URL
   gh secret set JWT_SECRET
   gh secret set FLY_API_TOKEN
   gh secret set VERCEL_TOKEN
   (etc.)

3. ${YELLOW}Test locally:${NC}
   pnpm dev

4. ${YELLOW}Deploy to production:${NC}
   ./deploy-production-100.sh

${CYAN}📚 Documentation:${NC}
  - Environment Setup: ENVIRONMENT_SETUP.md
  - GitHub Secrets: GITHUB_ACTIONS_SECRETS_SETUP.md
  - Deployment Guide: DEPLOYMENT_STATUS_100.md

${GREEN}🎉 Ready to deploy INFÆMOUS FREIGHT!${NC}

EOF
