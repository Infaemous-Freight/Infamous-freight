#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Proprietary and Confidential - See COPYRIGHT file for details.
# Script: Environment Validation

set -e

echo "🔍 Validating Environment Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

ERRORS=0
WARNINGS=0
CHECKS=0

# Required variables for API
API_REQUIRED=(
    "NODE_ENV"
    "DATABASE_URL"
    "JWT_SECRET"
)

# Required variables for Web
WEB_REQUIRED=(
    "NEXT_PUBLIC_API_URL"
    "NEXTAUTH_SECRET"
)

check_file() {
    local file=$1
    local required_vars=("${!2}")
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Checking: $file"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ ! -f "$file" ]; then
        print_error "File not found: $file"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    print_success "File exists: $file"
    CHECKS=$((CHECKS + 1))
    
    # Check required variables
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" "$file"; then
            local value=$(grep "^${var}=" "$file" | cut -d'=' -f2-)
            
            # Check if value is set (not empty and not placeholder)
            if [ -z "$value" ] || [[ "$value" == *"replace_with"* ]] || [[ "$value" == *"your_"* ]]; then
                print_warning "$var is set but needs configuration"
                WARNINGS=$((WARNINGS + 1))
            else
                print_success "$var is configured"
                CHECKS=$((CHECKS + 1))
            fi
        else
            print_error "$var is missing"
            ERRORS=$((ERRORS + 1))
        fi
    done
}

# Check root environment
if [ -f ".env.development" ] || [ -f ".env.local" ]; then
    check_file ".env.development" API_REQUIRED[@]
else
    print_error "No root environment file found (.env.development or .env.local)"
    ERRORS=$((ERRORS + 1))
fi

# Check API environment
check_file "apps/api/.env" API_REQUIRED[@]

# Check Web environment
if [ -f "apps/web/.env.local" ]; then
    check_file "apps/web/.env.local" WEB_REQUIRED[@]
elif [ -f "apps/web/.env" ]; then
    check_file "apps/web/.env" WEB_REQUIRED[@]
else
    print_warning "No web environment file found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check Mobile environment
if [ -f "apps/mobile/.env.development" ]; then
    print_success "Mobile environment file exists"
    CHECKS=$((CHECKS + 1))
else
    print_warning "No mobile environment file found"
    WARNINGS=$((WARNINGS + 1))
fi

# Security checks
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Security Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for secrets in git
if git ls-files --error-unmatch .env 2>/dev/null; then
    print_error ".env file is tracked by git (should be gitignored)"
    ERRORS=$((ERRORS + 1))
else
    print_success ".env files are properly gitignored"
    CHECKS=$((CHECKS + 1))
fi

# Check JWT secret strength
if [ -f "apps/api/.env" ]; then
    JWT_SECRET=$(grep "^JWT_SECRET=" apps/api/.env | cut -d'=' -f2-)
    JWT_LENGTH=${#JWT_SECRET}
    
    if [ $JWT_LENGTH -lt 32 ]; then
        print_error "JWT_SECRET is too short ($JWT_LENGTH chars, minimum 32)"
        ERRORS=$((ERRORS + 1))
    else
        print_success "JWT_SECRET length is adequate ($JWT_LENGTH chars)"
        CHECKS=$((CHECKS + 1))
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Total checks passed: $CHECKS"
print_warning "Total warnings: $WARNINGS"
print_error "Total errors: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        print_success "🎉 All environment validations passed!"
        echo ""
        echo "Your environment is ready for development."
        exit 0
    else
        print_warning "⚠️  Validation passed with warnings"
        echo ""
        echo "Review the warnings above and update your configuration."
        exit 0
    fi
else
    print_error "❌ Validation failed with $ERRORS error(s)"
    echo ""
    echo "Fix the errors above before proceeding."
    echo "Run './scripts/setup-environments.sh' to create missing files."
    exit 1
fi
