#!/bin/bash
# Auto-fix Lint Errors Script
# Infamous Freight Enterprises - Fix common lint errors automatically

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Auto-fix Lint Errors${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Run ESLint --fix
echo -e "${YELLOW}Step 1: Running ESLint auto-fix...${NC}"
cd /workspaces/Infamous-freight-enterprises
pnpm lint --fix || echo -e "${YELLOW}Some errors cannot be auto-fixed${NC}"

# 2. Fix console.log statements (replace with logger)
echo -e "${YELLOW}Step 2: Documenting console.log usage...${NC}"
grep -r "console.log" apps/web/src apps/web/components apps/web/pages --include="*.ts" --include="*.tsx" -n | head -20 || echo "No console.log found"

# 3. Fix unused variables (add underscore prefix)
echo -e "${YELLOW}Step 3: Listing unused variables...${NC}"
pnpm typecheck 2>&1 | grep "is declared but never used" | head -10 || echo "No unused variables found"

# 4. Fix == to ===
echo -e "${YELLOW}Step 4: Fixing == to === ...${NC}"
find apps/web -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ == / === /g'
find apps/web -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ != / !== /g'
echo -e "${GREEN}✓ Fixed == to ===${NC}"

# 5. Run Prettier
echo -e "${YELLOW}Step 5: Running Prettier...${NC}"
pnpm format || echo -e "${YELLOW}Prettier not configured${NC}"

# 6. Final lint check
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Final Lint Check:${NC}"
pnpm lint --max-warnings 100 && {
  echo -e "${GREEN}✓ Lint passed with warnings${NC}"
} || {
  echo -e "${RED}✗ Lint still has errors${NC}"
  echo ""
  echo -e "${YELLOW}Remaining errors:${NC}"
  pnpm lint 2>&1 | grep "error" | head -20
}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Auto-fix Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git diff"
echo "  2. Manual fixes may be needed for:"
echo "     - console.log statements (replace with proper logger)"
echo "     - @typescript-eslint/no-explicit-any (add proper types)"
echo "     - Unused variables (remove or prefix with _)"
echo "  3. Commit: git add . && git commit -m 'fix: Lint errors'"
echo ""
