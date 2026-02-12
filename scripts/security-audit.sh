#!/bin/bash
# Security audit and hardening script

set -e

echo "🔒 Starting Security Audit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

print_status "📋 Step 1: pnpm Audit" "$YELLOW"
cd /workspaces/Infamous-freight-enterprises/apps/api
pnpm audit --audit-level=moderate || true

print_status "\n📦 Step 2: Checking for outdated packages" "$YELLOW"
pnpm outdated || true

print_status "\n🔐 Step 3: Verifying environment variables" "$YELLOW"
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NODE_ENV"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_status "⚠️  Missing required environment variables:" "$RED"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
else
    print_status "✅ All required environment variables set" "$GREEN"
fi

print_status "\n🔍 Step 4: Checking for exposed secrets" "$YELLOW"
if command -v git &> /dev/null; then
    # Check for common patterns of exposed secrets
    git grep -i "api[_-]key\|password\|secret\|token" -- '*.ts' '*.js' | grep -v "test" | grep -v "JWT_SECRET" | grep -v "process.env" || print_status "No exposed secrets found" "$GREEN"
fi

print_status "\n🛡️  Step 5: Verifying security headers" "$YELLOW"
# Check if Helmet.js is being used
if grep -r "helmet" src/ &> /dev/null; then
    print_status "✅ Helmet.js security headers configured" "$GREEN"
else
    print_status "⚠️  Helmet.js not found - consider adding security headers" "$YELLOW"
fi

print_status "\n🔒 Step 6: Checking HTTPS configuration" "$YELLOW"
if [ "$NODE_ENV" = "production" ]; then
    if [ -n "$FORCE_HTTPS" ]; then
        print_status "✅ HTTPS enforcement enabled" "$GREEN"
    else
        print_status "⚠️  HTTPS not enforced - set FORCE_HTTPS=true" "$YELLOW"
    fi
fi

print_status "\n⚡ Step 7: Rate limiting verification" "$YELLOW"
if grep -r "express-rate-limit" src/ &> /dev/null; then
    print_status "✅ Rate limiting configured" "$GREEN"
else
    print_status "⚠️  Rate limiting not found" "$YELLOW"
fi

print_status "\n🔑 Step 8: JWT security check" "$YELLOW"
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    if [ $JWT_LENGTH -lt 32 ]; then
        print_status "⚠️  JWT_SECRET is too short ($JWT_LENGTH chars) - use at least 32 characters" "$RED"
    else
        print_status "✅ JWT_SECRET length is secure ($JWT_LENGTH chars)" "$GREEN"
    fi
fi

print_status "\n📊 Step 9: Dependency vulnerability scan" "$YELLOW"
if command -v snyk &> /dev/null; then
    snyk test || print_status "Snyk found vulnerabilities - review above" "$YELLOW"
else
    print_status "ℹ️  Snyk not installed - consider adding: npm install -g snyk" "$YELLOW"
fi

print_status "\n✅ Security audit complete!" "$GREEN"

# Generate security report
REPORT_FILE="security-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "Security Audit Report"
    echo "Generated: $(date)"
    echo ""
    echo "Environment: $NODE_ENV"
    echo "Node Version: $(node --version)"
    echo "pnpm Version: $(pnpm --version)"
    echo ""
    echo "Audit Summary:"
    pnpm audit --json | jq '.metadata' || echo "No vulnerability data"
} > "$REPORT_FILE"

print_status "\n📄 Report saved to: $REPORT_FILE" "$GREEN"
