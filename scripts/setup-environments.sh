#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Proprietary and Confidential - See COPYRIGHT file for details.
# Script: Environment Setup Automation

set -e

echo "🌍 Setting up Infamous Freight Environments..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Setting up root environment..."
if [ ! -f ".env.development" ]; then
    cp .env.example .env.development
    print_success "Created .env.development"
else
    print_warning ".env.development already exists, skipping"
fi

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    print_success "Created .env.local"
else
    print_warning ".env.local already exists, skipping"
fi

echo ""
echo "Step 2: Setting up API environment..."
if [ ! -f "apps/api/.env" ]; then
    if [ -f "apps/api/.env.example" ]; then
        cp apps/api/.env.example apps/api/.env
        print_success "Created apps/api/.env"
    else
        print_warning "apps/api/.env.example not found, skipping"
    fi
else
    print_warning "apps/api/.env already exists, skipping"
fi

echo ""
echo "Step 3: Setting up Web environment..."
if [ ! -f "apps/web/.env.local" ]; then
    if [ -f "apps/web/.env.example" ]; then
        cp apps/web/.env.example apps/web/.env.local
        print_success "Created apps/web/.env.local"
    else
        print_warning "apps/web/.env.example not found, skipping"
    fi
else
    print_warning "apps/web/.env.local already exists, skipping"
fi

echo ""
echo "Step 4: Setting up Mobile environment..."
if [ ! -f "apps/mobile/.env.development" ]; then
    if [ -f "apps/mobile/.env.example" ]; then
        cp apps/mobile/.env.example apps/mobile/.env.development
        print_success "Created apps/mobile/.env.development"
    else
        print_warning "apps/mobile/.env.example not found, skipping"
    fi
else
    print_warning "apps/mobile/.env.development already exists, skipping"
fi

echo ""
echo "Step 5: Generating random JWT secret..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_THIS_TO_A_RANDOM_32_CHAR_SECRET")

# Update JWT_SECRET in .env.development if it's still the default
if [ -f ".env.development" ]; then
    if grep -q "replace_with_long_random_value" .env.development; then
        sed -i.bak "s/JWT_SECRET=replace_with_long_random_value_minimum_32_characters/JWT_SECRET=$JWT_SECRET/" .env.development
        rm .env.development.bak 2>/dev/null || true
        print_success "Generated random JWT_SECRET for development"
    fi
fi

# Update JWT_SECRET in apps/api/.env if it exists and has default value
if [ -f "apps/api/.env" ]; then
    if grep -q "replace_with_long_random_value" apps/api/.env; then
        sed -i.bak "s/JWT_SECRET=replace_with_long_random_value_minimum_32_characters/JWT_SECRET=$JWT_SECRET/" apps/api/.env
        rm apps/api/.env.bak 2>/dev/null || true
        print_success "Generated random JWT_SECRET for API"
    fi
fi

echo ""
echo "Step 6: Verifying environment files..."
FILES_CREATED=0
FILES_SKIPPED=0

for file in .env.development .env.local apps/api/.env apps/web/.env.local apps/mobile/.env.development; do
    if [ -f "$file" ]; then
        print_success "$file exists"
        FILES_CREATED=$((FILES_CREATED + 1))
    else
        print_warning "$file not found"
        FILES_SKIPPED=$((FILES_SKIPPED + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Environment Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  ✅ Files created/verified: $FILES_CREATED"
echo "  ⚠️  Files skipped: $FILES_SKIPPED"
echo ""
echo "⚠️  IMPORTANT: Review and update the following in your .env files:"
echo "  1. DATABASE_URL - Update with your PostgreSQL credentials"
echo "  2. STRIPE_SECRET_KEY - Add your Stripe test key"
echo "  3. OPENAI_API_KEY - (Optional) Add if using OpenAI"
echo "  4. GOOGLE_MAPS_API_KEY - (Optional) Add for maps features"
echo ""
echo "📚 Next Steps:"
echo "  1. Review ENVIRONMENTS_100_COMPLETE.md for full documentation"
echo "  2. Run 'pnpm install' to install dependencies"
echo "  3. Run 'pnpm dev' to start development servers"
echo "  4. Visit http://localhost:3000 for the web app"
echo "  5. Visit http://localhost:4000/api/health for API health check"
echo ""
print_success "Setup complete! Happy coding! 🚀"
