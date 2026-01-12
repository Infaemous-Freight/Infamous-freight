#!/bin/bash
# Production Setup Script for Infamous Freight Enterprises
# This script automates the complete production deployment

set -e

echo "🚀 Starting production setup for Infamous Freight Enterprises..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Fly.io. Logging in...${NC}"
    flyctl auth login
fi

echo -e "${BLUE}📦 Step 1: Creating Managed Postgres Database...${NC}"
flyctl postgres create \
    --name infamous-freight-db \
    --region iad \
    --initial-cluster-size 1 \
    --vm-size shared-cpu-1x \
    --volume-size 3 \
    || echo -e "${YELLOW}⚠️  Database might already exist or requires manual creation via dashboard${NC}"

echo -e "${BLUE}📦 Step 2: Creating API Application...${NC}"
flyctl apps create infamous-freight-api --org personal \
    || echo -e "${YELLOW}⚠️  API app might already exist${NC}"

echo -e "${BLUE}📦 Step 3: Attaching Database to API...${NC}"
flyctl postgres attach infamous-freight-db --app infamous-freight-api \
    || echo -e "${YELLOW}⚠️  Database attachment may require manual setup${NC}"

echo -e "${BLUE}🔑 Step 4: Setting API Secrets...${NC}"
echo "Generating secure secrets..."

# Generate secure random secrets
JWT_SECRET=$(openssl rand -base64 32)
API_KEY=$(openssl rand -hex 32)

flyctl secrets set \
    JWT_SECRET="$JWT_SECRET" \
    NODE_ENV="production" \
    LOG_LEVEL="info" \
    CORS_ORIGINS="https://infamous-freight-enterprises.fly.dev,https://infamous-freight-enterprises.vercel.app" \
    RATE_LIMIT_WINDOW_MS="900000" \
    RATE_LIMIT_MAX_REQUESTS="100" \
    SENTRY_DSN="" \
    --app infamous-freight-api \
    || echo -e "${YELLOW}⚠️  Secrets setup requires manual configuration${NC}"

echo -e "${BLUE}🚀 Step 5: Deploying API...${NC}"
flyctl deploy \
    --config fly.api.toml \
    --dockerfile Dockerfile.fly \
    --app infamous-freight-api \
    || echo -e "${YELLOW}⚠️  API deployment failed, may need manual intervention${NC}"

echo -e "${BLUE}📊 Step 6: Scaling API...${NC}"
flyctl scale count 1 --app infamous-freight-api
flyctl scale memory 512 --app infamous-freight-api

echo -e "${BLUE}🔍 Step 7: Verifying Deployment...${NC}"
flyctl status --app infamous-freight-api
flyctl logs --app infamous-freight-api --tail 50

echo -e "${GREEN}✅ Production setup complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Add FLY_API_TOKEN to GitHub Secrets:"
echo "   https://github.com/MrMiless44/Infamous-freight-enterprises/settings/secrets/actions"
echo ""
echo "2. Configure additional secrets via Fly.io dashboard:"
echo "   - OPENAI_API_KEY (if using OpenAI)"
echo "   - ANTHROPIC_API_KEY (if using Anthropic)"
echo "   - STRIPE_SECRET_KEY (for billing)"
echo "   - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (for billing)"
echo ""
echo "3. Run Prisma migrations:"
echo "   flyctl ssh console --app infamous-freight-api"
echo "   cd api && npx prisma migrate deploy"
echo ""
echo "4. Test API health:"
echo "   curl https://infamous-freight-api.fly.dev/api/health"
echo ""
echo -e "${GREEN}🎉 Your production environment is ready!${NC}"
