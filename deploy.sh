#!/bin/bash
set -e

# ============================================================
# INFAMOUS FREIGHT — One-Command Deploy Script
# Usage: ./deploy.sh [environment] [fly-image]
#   environment: "prod" (default) or "staging"
#   fly-image: optional image reference for rollback/redeploy
# ============================================================

ENV=${1:-prod}
FLY_IMAGE=${2:-}
echo "🚛 Deploying Infamous Freight to $ENV..."
if [ -n "$FLY_IMAGE" ]; then
    echo "📦 Using prebuilt Fly image: $FLY_IMAGE"
fi

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

run_pm_script() {
    local script_name=$1
    shift || true
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm "$script_name" "$@"
    else
        npm run "$script_name" "$@"
    fi
}

echo ""
echo "Checking prerequisites..."
check_prereq node
if [ -f "pnpm-lock.yaml" ]; then
    PACKAGE_MANAGER="pnpm"
elif [ -f "package-lock.json" ]; then
    PACKAGE_MANAGER="npm"
elif command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
else
    PACKAGE_MANAGER="npm"
fi
check_prereq "$PACKAGE_MANAGER"
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
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
    else
        pnpm install --no-frozen-lockfile
    fi
else
    npm install
fi

# Generate Prisma client
echo ""
echo "🔄 Generating Prisma client..."
run_pm_script prisma:generate

# Run tests
echo ""
echo "🧪 Running tests..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm test -- --runInBand
else
    npm run test -- --runInBand
fi

# Build
echo ""
echo "🔨 Building..."
run_pm_script build

# Deploy API to Fly.io
echo ""
echo "🚀 Deploying API to Fly.io..."
if command -v flyctl &> /dev/null; then
    if [ -n "$FLY_IMAGE" ]; then
        flyctl deploy --app infamous-freight --image "$FLY_IMAGE"
    else
        flyctl deploy --app infamous-freight --remote-only
    fi
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
echo "  Web:    https://infamousfreight.com"
echo "  Health: https://api.infamousfreight.com/health"
echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
