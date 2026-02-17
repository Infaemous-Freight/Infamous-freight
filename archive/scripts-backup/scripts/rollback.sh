#!/bin/bash
set -e

# 🔄 PRODUCTION ROLLBACK SCRIPT
# Quick rollback to previous deployment

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🔄 PRODUCTION ROLLBACK PROCEDURE 🔄              ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "⚠️  WARNING: This will rollback your production deployment"
echo ""
read -p "Are you sure you want to proceed? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_error "Rollback cancelled"
    exit 1
fi

# Rollback Fly.io API
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: ROLLBACK API (Fly.io)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v flyctl &> /dev/null; then
    echo "Recent deployments:"
    flyctl releases list --limit 5
    echo ""
    
    read -p "Rollback Fly.io to previous version? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if flyctl releases rollback; then
            print_success "API rolled back successfully"
        else
            print_error "API rollback failed"
        fi
    else
        print_warning "Skipped API rollback"
    fi
else
    print_error "Fly CLI not installed"
    echo "Install: curl -L https://fly.io/install.sh | sh"
fi

# Rollback Vercel Web
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: ROLLBACK WEB (Vercel)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_warning "Vercel rollback must be done via dashboard"
echo ""
echo "To rollback Vercel deployment:"
echo "  1. Go to: https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to 'Deployments'"
echo "  4. Find previous working deployment"
echo "  5. Click '⋯' → 'Promote to Production'"
echo ""

# Git rollback option
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: GIT ROLLBACK (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Rollback Git to previous commit? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Recent commits:"
    git log --oneline -5
    echo ""
    
    read -p "Enter commit hash to rollback to: " commit_hash
    
    if [ -n "$commit_hash" ]; then
        git revert --no-commit $commit_hash..HEAD
        git commit -m "Rollback to $commit_hash"
        
        read -p "Push rollback to origin? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            print_success "Git rollback pushed"
            print_warning "This will trigger new Vercel deployment"
        fi
    else
        print_error "No commit hash provided"
    fi
else
    print_warning "Skipped Git rollback"
fi

# Verification
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Rollback steps completed"
echo ""
echo "Verify production status:"
echo "  Web: curl -I https://infamous-freight.vercel.app"
echo "  API: curl https://infamous-freight-api.fly.dev/api/health"
echo ""
echo "Monitor logs:"
echo "  Fly.io: flyctl logs --follow"
echo "  Vercel: https://vercel.com/dashboard"
echo ""

print_success "Rollback procedure complete"
