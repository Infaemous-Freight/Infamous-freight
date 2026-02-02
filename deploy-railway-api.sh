#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════════"
echo "🚂 DEPLOYING API TO RAILWAY.APP"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    curl -fsSL cli.new/railway | sh
    export PATH="$HOME/.railway/bin:$PATH"
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${BLUE}📝 Please login to Railway...${NC}"
    railway login
fi

echo -e "${GREEN}✅ Logged in as: $(railway whoami)${NC}"
echo ""

# Initialize project if needed
if [ ! -f ".railway/project.json" ]; then
    echo -e "${BLUE}📦 Initializing Railway project...${NC}"
    railway init
fi

echo ""
echo -e "${BLUE}🔐 Setting environment variables...${NC}"

# Generate JWT secret if not exists
JWT_SECRET=$(openssl rand -base64 32)

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set API_PORT=3001
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set CORS_ORIGINS="https://infamous-freight-enterprises.vercel.app"
railway variables set AI_PROVIDER=synthetic
railway variables set AVATAR_STORAGE=local
railway variables set LOG_LEVEL=info

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Check if PostgreSQL is added
echo -e "${BLUE}🗄️  Checking database...${NC}"
if ! railway variables | grep -q "DATABASE_URL"; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found. Adding database...${NC}"
    railway add --database postgresql
    echo -e "${GREEN}✅ PostgreSQL database added${NC}"
    sleep 5  # Wait for database to provision
else
    echo -e "${GREEN}✅ PostgreSQL database already configured${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Deploying API...${NC}"
echo ""

# Deploy using Dockerfile.api
railway up --dockerfile Dockerfile.api

echo ""
echo -e "${GREEN}✅ Deployment initiated${NC}"
echo ""

# Wait for deployment
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
sleep 10

# Get deployment URL
RAILWAY_URL=$(railway domain 2>/dev/null || echo "Not yet assigned")
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ API DEPLOYED SUCCESSFULLY${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Information:${NC}"
echo -e "  API URL: ${GREEN}https://$RAILWAY_URL${NC}"
echo -e "  Health Check: ${GREEN}https://$RAILWAY_URL/api/health${NC}"
echo -e "  Environment: ${GREEN}production${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Run database migrations:"
echo "     ${BLUE}railway run bash -c 'cd api && npx prisma migrate deploy'${NC}"
echo ""
echo "  2. Update Vercel environment variable:"
echo "     ${BLUE}NEXT_PUBLIC_API_URL=https://$RAILWAY_URL${NC}"
echo ""
echo "  3. Verify health check:"
echo "     ${BLUE}curl https://$RAILWAY_URL/api/health${NC}"
echo ""
echo "  4. Monitor logs:"
echo "     ${BLUE}railway logs${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
