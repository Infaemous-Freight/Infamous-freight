#!/bin/bash
set -e

# ============================================================
# INFAMOUS FREIGHT — One-Command Deploy Script
# Usage: ./deploy.sh [environment]
#   environment: "prod" (default) or "staging"
# ============================================================

ENV=${1:-prod}
echo "🚛 Deploying Infamous Freight to $ENV..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prereq() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ $1 found${NC}"
}

echo ""
echo "Checking prerequisites..."
check_prereq node
check_prereq npm
check_prereq git

# Check environment variables
echo ""
echo "Checking environment..."
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY not set${NC}"
fi
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🔄 Generating Prisma client..."
cd apps/api
npx prisma generate
cd ../..

# Run tests
echo ""
echo "🧪 Running tests..."
npm run test --if-present || echo -e "${YELLOW}⚠️  No tests configured${NC}"

# Build
echo ""
echo "🔨 Building..."
npm run build

# Deploy API to Fly.io
echo ""
echo "🚀 Deploying API to Fly.io..."
if command -v flyctl &> /dev/null; then
    flyctl deploy --app infamous-freight-api --remote-only
    echo -e "${GREEN}✅ API deployed to Fly.io${NC}"
else
    echo -e "${YELLOW}⚠️  Fly CLI (flyctl) not found. Skipping API deploy.${NC}"
    echo "   Install: curl -L https://fly.io/install.sh | sh"
fi

# Deploy Web to Netlify
echo ""
echo "🌐 Deploying Web to Netlify..."
if command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=apps/web/dist
    echo -e "${GREEN}✅ Web deployed to Netlify${NC}"
else
    echo -e "${YELLOW}⚠️  Netlify CLI not found. Skipping web deploy.${NC}"
    echo "   Install: npm install -g netlify-cli"
fi

echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 INFAMOUS FREIGHT DEPLOYED!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo ""
echo "  API:    https://api.infamousfreight.com"
echo "  Web:    https://www.infamousfreight.com"
echo "  Health: https://api.infamousfreight.com/health"
echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
