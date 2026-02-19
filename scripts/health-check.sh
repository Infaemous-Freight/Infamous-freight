#!/bin/bash
################################################################################
# 🔍 Health Check Script - Quick Repository Health Verification
#
# Usage: bash scripts/health-check.sh
################################################################################

echo "🔍 Repository Health Check"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Health counters
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Helper function
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Git checks
echo "📊 Git Repository:"
git rev-parse --is-inside-work-tree > /dev/null 2>&1
check $? "Git repository initialized"

COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
if [ "$COMMITS" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} $COMMITS commits"
fi

# Directory checks
echo ""
echo "📁 Directory Structure:"
for dir in apps packages .github .githooks archive scripts; do
    if [ -d "$dir" ]; then
        echo -e "  ${GREEN}✓${NC} $dir"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "  ${RED}✗${NC} $dir (missing)"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

# Documentation checks
echo ""
echo "📚 Documentation:"
for file in README.md CONTRIBUTING.md RECOMMENDED-INDEX.md; do
    if [ -f "$file" ]; then
        LINES=$(wc -l < "$file")
        echo -e "  ${GREEN}✓${NC} $file ($LINES lines)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "  ${RED}✗${NC} $file (missing)"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

# Pattern checks
echo ""
echo "🔍 Forbidden Patterns:"
STATUS=$(find . -maxdepth 1 -name '*_STATUS.md' 2>/dev/null | wc -l)
LOG=$(find . -maxdepth 1 -name '*.log' 2>/dev/null | wc -l)

if [ "$STATUS" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} No *_STATUS.md files"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "  ${RED}✗${NC} Found $STATUS *_STATUS.md files"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

if [ "$LOG" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} No *.log files"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "  ${RED}✗${NC} Found $LOG *.log files"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Git hooks
echo ""
echo "🔐 Git Hooks:"
if git config core.hooksPath | grep -q "\.githooks"; then
    echo -e "  ${GREEN}✓${NC} Git hooks configured"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "  ${RED}✗${NC} Git hooks not configured"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

if [ -f ".githooks/pre-commit-docs" ]; then
    echo -e "  ${GREEN}✓${NC} Pre-commit hook exists"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "  ${RED}✗${NC} Pre-commit hook missing"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Summary
echo ""
echo "════════════════════════════════════════════════════════════"
SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo "Health Score: $SCORE/$TOTAL_CHECKS ($(($SCORE))%)"

if [ "$SCORE" -ge 90 ]; then
    echo "Status: ${GREEN}✅ EXCELLENT${NC}"
elif [ "$SCORE" -ge 70 ]; then
    echo "Status: ${YELLOW}⚠️  GOOD${NC}"
else
    echo "Status: ${RED}❌ NEEDS ATTENTION${NC}"
fi

echo "════════════════════════════════════════════════════════════"
