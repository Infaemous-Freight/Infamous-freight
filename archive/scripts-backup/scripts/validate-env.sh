#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating development environment..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo -n "Node.js version: $NODE_VERSION ... "
if [[ $NODE_VERSION == v24.* ]]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠${NC} (recommend v24.x for full compatibility)"
fi

# Check pnpm version
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm -v)
  echo -n "pnpm version: $PNPM_VERSION ... "
  if [[ $PNPM_VERSION == 10.* ]] || [[ $PNPM_VERSION == 11.* ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC} (requires >=10.0.0)"
    exit 1
  fi
else
  echo -e "${RED}✗${NC} pnpm not found"
  echo "  Install with: npm install -g pnpm@latest"
  exit 1
fi

# Check Git
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  echo -n "Git: ${GIT_VERSION#git version } ... ${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC} Git not found"
  exit 1
fi

# Check required files
echo ""
echo "Checking required files..."

REQUIRED_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "pnpm-lock.yaml"
  ".env.example"
  "BUILD.md"
  ".github/workflows/ci.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}✗${NC} $file (missing)"
  fi
done

# Check environment setup
echo ""
echo "Checking environment configuration..."

if [ -f "apps/web/.env.local" ]; then
  echo -e "${GREEN}✓${NC} apps/web/.env.local (configured)"
elif [ -f "apps/web/.env" ]; then
  echo -e "${YELLOW}⚠${NC} apps/web/.env (should use .env.local for local dev)"
else
  echo -e "${YELLOW}⚠${NC} No .env file found (optional for builds)"
fi

# Check dependencies
echo ""
echo "Checking node_modules..."

if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} Dependencies installed"
else
  echo -e "${YELLOW}⚠${NC} Dependencies not installed"
  echo "  Run: pnpm install"
fi

# Final summary
echo ""
echo "🎉 Environment validation complete!"
echo ""
echo "Next steps:"
echo "  1. pnpm install           # Install dependencies (if needed)"
echo "  2. pnpm typecheck         # Check types"
echo "  3. pnpm build             # Build workspace"
echo "  4. pnpm dev               # Start development servers"
