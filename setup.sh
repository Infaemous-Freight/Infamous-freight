#!/bin/bash
set -e

echo "🚀 Infamous Freight Enterprises - Setup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    echo -e "${GREEN}✓ pnpm installed${NC}"
else
    echo -e "${GREEN}✓ pnpm is installed ($(pnpm --version))${NC}"
fi

# Clean old dependencies
echo ""
echo "🧹 Cleaning old dependencies..."
pnpm clean 2>/dev/null || rm -rf node_modules apps/api/node_modules apps/web/node_modules apps/mobile/node_modules packages/*/node_modules
rm -f package-lock.json apps/api/package-lock.json apps/web/package-lock.json apps/mobile/package-lock.json
echo -e "${GREEN}✓ Cleaned${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build shared package
echo ""
echo "🔨 Building shared package..."
pnpm --filter @infamous-freight/shared build
echo -e "${GREEN}✓ Shared package built${NC}"

# Setup environment
echo ""
if [ ! -f .env.local ]; then
    echo "⚙️  Setting up environment..."
    cp .env.example .env.local
    echo -e "${YELLOW}⚠  Please edit .env.local with your actual values${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# Setup Husky
echo ""
echo "🪝 Setting up Git hooks..."
pnpm prepare
echo -e "${GREEN}✓ Git hooks configured${NC}"

# Generate Prisma client (if needed)
echo ""
if [ -f apps/api/prisma/schema.prisma ]; then
    echo "🗄️  Generating Prisma client..."
    cd apps/api
    pnpm prisma:generate
    cd ../..
    echo -e "${GREEN}✓ Prisma client generated${NC}"
fi

# Run tests
echo ""
echo "🧪 Running tests..."
pnpm test 2>/dev/null || echo -e "${YELLOW}⚠  Some tests may need environment setup${NC}"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local with your configuration"
echo "  2. Run 'pnpm dev' to start all services"
echo "  3. Or run 'pnpm api:dev' or 'pnpm web:dev' for individual services"
echo ""
echo "See MIGRATION_GUIDE.md for more details."
