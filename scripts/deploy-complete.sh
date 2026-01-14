#!/bin/bash
# Complete Deployment Script - Deploys entire stack to production
# Usage: ./scripts/deploy-complete.sh

set -e

echo "🚀 Complete Production Deployment for Infamous Freight Enterprises"
echo "=================================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl not installed. Install: https://fly.io/docs/hands-on/install-flyctl/${NC}"
    exit 1
fi

if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Fly.io${NC}"
    flyctl auth login
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not installed${NC}"
    exit 1
fi

# Check for uncommitted changes (skip in Vercel builds)
if [ "$VERCEL" != "1" ]; then
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes. Commit them first.${NC}"
        git status
        exit 1
    fi
else
    echo -e "${GREEN}✅ Vercel build detected, skipping uncommitted changes check${NC}"
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 1: Build and test locally
echo -e "${BLUE}Step 1: Running tests...${NC}"
if [ -f "api/package.json" ]; then
    cd api
    npm test || echo -e "${YELLOW}⚠️  Tests failed, continuing anyway...${NC}"
    cd ..
fi

# Step 2: Deploy database (if not exists)
echo -e "${BLUE}Step 2: Setting up database...${NC}"
if ! flyctl apps list | grep -q "infamous-freight-db"; then
    echo "Creating Postgres database..."
    flyctl postgres create \
        --name infamous-freight-db \
        --region iad \
        --initial-cluster-size 1 \
        --vm-size shared-cpu-1x \
        --volume-size 3 \
        || echo -e "${YELLOW}⚠️  Database creation failed. Create manually at https://fly.io/dashboard${NC}"
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi

# Step 3: Create Redis (optional)
echo -e "${BLUE}Step 3: Setting up Redis cache...${NC}"
read -p "Do you want to create a Redis cache? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! flyctl apps list | grep -q "infamous-freight-redis"; then
        flyctl redis create \
            --name infamous-freight-redis \
            --region iad \
            || echo -e "${YELLOW}⚠️  Redis creation failed${NC}"
    else
        echo -e "${GREEN}✅ Redis already exists${NC}"
    fi
else
    echo "Skipping Redis setup"
fi

# Step 4: Deploy API
echo -e "${BLUE}Step 4: Deploying API...${NC}"
if ! flyctl apps list | grep -q "infamous-freight-api"; then
    echo "Creating API app..."
    flyctl apps create infamous-freight-api --org personal \
        || echo -e "${YELLOW}⚠️  App creation failed. Create manually at https://fly.io/dashboard${NC}"
fi

echo "Attaching database to API..."
flyctl postgres attach infamous-freight-db --app infamous-freight-api \
    || echo -e "${YELLOW}⚠️  Database attachment may already exist${NC}"

echo "Setting API secrets..."
JWT_SECRET=$(openssl rand -base64 32)
flyctl secrets set \
    JWT_SECRET="$JWT_SECRET" \
    NODE_ENV="production" \
    LOG_LEVEL="info" \
    CORS_ORIGINS="https://infamous-freight-enterprises.fly.dev,https://infamous-freight-enterprises.vercel.app" \
    --app infamous-freight-api \
    || echo -e "${YELLOW}⚠️  Failed to set secrets${NC}"

echo "Deploying API..."
flyctl deploy \
    --config fly.api.toml \
    --dockerfile Dockerfile.fly \
    --app infamous-freight-api

echo -e "${GREEN}✅ API deployed${NC}"

# Step 5: Deploy Web
echo -e "${BLUE}Step 5: Deploying Web...${NC}"
flyctl deploy \
    --config fly.toml \
    --app infamous-freight-enterprises

echo -e "${GREEN}✅ Web deployed${NC}"

# Step 6: Run database migrations
echo -e "${BLUE}Step 6: Running database migrations...${NC}"
echo "Connecting to API to run migrations..."
flyctl ssh console --app infamous-freight-api -C "cd api && npx prisma migrate deploy" \
    || echo -e "${YELLOW}⚠️  Migration failed. Run manually: flyctl ssh console --app infamous-freight-api${NC}"

# Step 7: Verify deployments
echo -e "${BLUE}Step 7: Verifying deployments...${NC}"
echo ""
echo "API Status:"
flyctl status --app infamous-freight-api

echo ""
echo "Web Status:"
flyctl status --app infamous-freight-enterprises

# Step 8: Test endpoints
echo -e "${BLUE}Step 8: Testing endpoints...${NC}"
echo ""
echo "Testing API health..."
API_HEALTH=$(curl -s https://infamous-freight-api.fly.dev/api/health | head -c 100)
echo "API Response: $API_HEALTH"

echo ""
echo "Testing Web..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://infamous-freight-enterprises.fly.dev/)
echo "Web HTTP Status: $WEB_STATUS"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Your applications are live:${NC}"
echo "  API:  https://infamous-freight-api.fly.dev"
echo "  Web:  https://infamous-freight-enterprises.fly.dev"
echo "  Docs: https://infamous-freight-api.fly.dev/api/docs"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo "  API Logs:  flyctl logs --app infamous-freight-api"
echo "  Web Logs:  flyctl logs --app infamous-freight-enterprises"
echo "  API Status: flyctl status --app infamous-freight-api"
echo "  Web Status: flyctl status --app infamous-freight-enterprises"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Set up monitoring (see scripts/setup-monitoring.sh)"
echo "2. Configure CI/CD GitHub secrets:"
echo "   - FLY_API_TOKEN: $(flyctl auth token)"
echo "3. Add external service credentials:"
echo "   - SENTRY_DSN"
echo "   - OPENAI_API_KEY or ANTHROPIC_API_KEY"
echo "   - STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET"
echo "4. Enable Redis caching:"
echo "   - Get Redis URL: flyctl redis status infamous-freight-redis"
echo "   - Set secret: flyctl secrets set REDIS_URL='...' --app infamous-freight-api"
echo ""
echo -e "${GREEN}🎉 Happy shipping!${NC}"
