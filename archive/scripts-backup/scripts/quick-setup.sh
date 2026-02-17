#!/bin/bash

# One-Command Setup Script for Infamous Freight
# Automates environment setup, dependency installation, and configuration

set -e

echo "🚀 Infamous Freight - Quick Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found, installing...${NC}"
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✅ pnpm ${PNPM_VERSION}${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found (optional for local development)${NC}"
else
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker ${DOCKER_VERSION}${NC}"
fi

echo ""

# Step 2: Clone repository (if not already in one)
echo -e "${BLUE}Step 2: Repository setup...${NC}"
echo ""

if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Not in a git repository. Clone manually:${NC}"
    echo "git clone https://github.com/yourusername/infamous-freight.git"
    exit 1
else
    echo -e "${GREEN}✅ Git repository detected${NC}"
fi

echo ""

# Step 3: Install dependencies
echo -e "${BLUE}Step 3: Installing dependencies...${NC}"
echo ""

echo "📦 Installing workspace dependencies..."
pnpm install

echo ""
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Environment configuration
echo -e "${BLUE}Step 4: Configuring environment...${NC}"
echo ""

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
        echo -e "${YELLOW}⚠️  Please update .env with your actual credentials${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env.example found, creating minimal .env...${NC}"
        cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/infamous_freight"

# API
API_PORT=4000
WEB_PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Sentry (optional)
SENTRY_DSN=""

# AI Provider (openai|anthropic|synthetic)
AI_PROVIDER="synthetic"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
EOF
        echo -e "${GREEN}✅ Minimal .env created${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""

# Step 5: Database setup
echo -e "${BLUE}Step 5: Setting up database...${NC}"
echo ""

if [ -d "apps/api/prisma" ]; then
    echo "🗄️  Generating Prisma client..."
    cd apps/api
    pnpm prisma:generate
    
    echo ""
    echo "📊 Running database migrations..."
    pnpm prisma:migrate:dev --name init || echo -e "${YELLOW}⚠️  Migration failed (database may need manual setup)${NC}"
    
    cd ../..
    echo -e "${GREEN}✅ Database setup complete${NC}"
else
    echo -e "${YELLOW}⚠️  No Prisma schema found, skipping database setup${NC}"
fi

echo ""

# Step 6: Build shared packages
echo -e "${BLUE}Step 6: Building shared packages...${NC}"
echo ""

if [ -d "packages/shared" ]; then
    echo "🔨 Building @infamous-freight/shared..."
    pnpm --filter @infamous-freight/shared build
    echo -e "${GREEN}✅ Shared package built${NC}"
else
    echo -e "${YELLOW}⚠️  No shared package found, skipping${NC}"
fi

echo ""

# Step 7: Verify installation
echo -e "${BLUE}Step 7: Verifying installation...${NC}"
echo ""

# Check if critical files exist
CRITICAL_FILES=(
    "package.json"
    "pnpm-workspace.yaml"
    ".env"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
    fi
done

echo ""

# Step 8: Start development servers
echo "=================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "=================================="
echo ""
echo "🚀 Quick start commands:"
echo ""
echo "  Start all services:"
echo -e "    ${BLUE}pnpm dev${NC}"
echo ""
echo "  Start API only:"
echo -e "    ${BLUE}pnpm api:dev${NC}"
echo ""
echo "  Start Web only:"
echo -e "    ${BLUE}pnpm web:dev${NC}"
echo ""
echo "  Run tests:"
echo -e "    ${BLUE}pnpm test${NC}"
echo ""
echo "  Type checking:"
echo -e "    ${BLUE}pnpm check:types${NC}"
echo ""
echo "  Lint & format:"
echo -e "    ${BLUE}pnpm lint && pnpm format${NC}"
echo ""
echo "📚 Documentation:"
echo "  • README.md - Project overview"
echo "  • QUICK_REFERENCE.md - Command cheat sheet"
echo "  • DOCUMENTATION_INDEX.md - Full docs"
echo ""
echo "🔗 Access points (after starting dev):"
echo "  • Web: http://localhost:3000"
echo "  • API: http://localhost:4000"
echo "  • Prisma Studio: pnpm --filter api prisma:studio"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  1. Update .env with your actual API keys"
echo "  2. Set up Stripe webhook endpoint"
echo "  3. Configure Sentry DSN (optional)"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
