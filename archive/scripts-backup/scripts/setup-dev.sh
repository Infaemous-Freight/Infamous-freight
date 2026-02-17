#!/bin/bash

set -e

echo "🚀 Setting up Infamous Freight development environment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Validate environment
echo -e "\n${BLUE}📋 Step 1: Validating environment${NC}"
bash scripts/validate-env.sh || exit 1

# 2. Install dependencies
echo -e "\n${BLUE}📦 Step 2: Installing dependencies${NC}"
pnpm install

# 3. Setup Husky hooks
echo -e "\n${BLUE}🔗 Step 3: Setting up Git hooks${NC}"
pnpm husky install 2>/dev/null || echo "Husky already installed"
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
echo -e "${GREEN}✓${NC} Git hooks installed"

# 4. Setup environment files
echo -e "\n${BLUE}⚙️  Step 4: Setting up environment files${NC}"

if [ ! -f "apps/web/.env.local" ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo -e "${GREEN}✓${NC} Created apps/web/.env.local"
  echo "  ⚠️  Please update with your Supabase credentials"
else
  echo -e "${GREEN}✓${NC} apps/web/.env.local already exists"
fi

if [ ! -f "apps/api/.env.local" ]; then
  if [ -f "apps/api/.env.example" ]; then
    cp apps/api/.env.example apps/api/.env.local
    echo -e "${GREEN}✓${NC} Created apps/api/.env.local"
    echo "  ⚠️  Please update with your database credentials"
  fi
else
  echo -e "${GREEN}✓${NC} apps/api/.env.local already exists"
fi

# 5. Build shared package
echo -e "\n${BLUE}🔨 Step 5: Building shared package${NC}"
pnpm --filter @infamous-freight/shared build
echo -e "${GREEN}✓${NC} Shared package built"

# 6. Type checking
echo -e "\n${BLUE}🔍 Step 6: Running type checks${NC}"
pnpm typecheck || echo -e "${BLUE}ℹ  Some type errors found (see BUILD.md for details)${NC}"

# 7. Success
echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📚 Next steps:"
echo "  1. Update environment files with your credentials:"
echo "     - apps/web/.env.local (Supabase API keys)"
echo "     - apps/api/.env.local (Database URL, JWT_SECRET)"
echo ""
echo "  2. Start development servers:"
echo "     pnpm dev"
echo ""
echo "  3. View comprehensive guides:"
echo "     - BUILD.md - Build and deployment guide"
echo "     - CONTRIBUTING.md - Development guidelines"
echo "     - QUICK_REFERENCE.md - Command cheat sheet"
echo ""
