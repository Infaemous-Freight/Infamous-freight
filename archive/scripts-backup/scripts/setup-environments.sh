#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Proprietary and Confidential - See COPYRIGHT file for details.
# Script: Environment Setup Automation

set -euo pipefail

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

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        print_warning "Missing dependency: $cmd"
        return 1
    fi
    return 0
}

generate_secret_hex() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
        return 0
    fi

    if command -v hexdump >/dev/null 2>&1; then
        hexdump -n 32 -e '16/1 "%02x"' /dev/urandom
        return 0
    fi

    date +%s | sha256sum | awk '{print $1}'
}

ensure_env_file() {
    local target="$1"
    local source="$2"

    if [ -f "$target" ]; then
        print_warning "$target already exists, skipping"
        return 1
    fi

    if [ -f "$source" ]; then
        cp "$source" "$target"
        print_success "Created $target from $source"
        return 0
    fi

    print_warning "$source not found, skipping $target"
    return 1
}

replace_placeholder() {
    local file="$1"
    local key="$2"
    local placeholder="$3"
    local value="$4"

    if [ ! -f "$file" ]; then
        return 0
    fi

    if grep -q "^${key}=${placeholder}$" "$file"; then
        sed -i.bak "s|^${key}=${placeholder}$|${key}=${value}|" "$file"
        rm -f "${file}.bak" 2>/dev/null || true
        print_success "Updated ${key} in ${file}"
    fi
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

require_command "cp" || true
require_command "grep" || true
require_command "sed" || true

echo "Step 1: Setting up root environment files..."
ensure_env_file ".env" ".env.example" || true
ensure_env_file ".env.development" ".env.example" || true
ensure_env_file ".env.local" ".env.example" || true
ensure_env_file ".env.staging" ".env.example" || true
ensure_env_file ".env.test" ".env.example" || true

if [ -f ".env.production.example" ]; then
    ensure_env_file ".env.production" ".env.production.example" || true
else
    ensure_env_file ".env.production" ".env.example" || true
fi

if [ -f ".env.supabase" ]; then
    print_warning ".env.supabase already exists, skipping"
else
    ensure_env_file ".env.supabase" ".env.example" || true
fi

echo ""
echo "Step 2: Setting up API environment..."
ensure_env_file "apps/api/.env" "apps/api/.env.example" || true

echo ""
echo "Step 3: Setting up Web environment..."
ensure_env_file "apps/web/.env.local" "apps/web/.env.example" || true

echo ""
echo "Step 4: Setting up Mobile environment..."
ensure_env_file "apps/mobile/.env.development" "apps/mobile/.env.example" || true

echo ""
echo "Step 5: Setting up Supabase environment..."
ensure_env_file "supabase/.env" "supabase/.env.example" || true

echo ""
echo "Step 6: Setting up backend environment (legacy)..."
ensure_env_file "backend/.env" "backend/.env.example" || true

echo ""
echo "Step 7: Generating random secrets (only replacing placeholders)..."
JWT_SECRET=$(generate_secret_hex)
MASTER_KEY=$(generate_secret_hex)
AUDIT_LOG_SALT=$(generate_secret_hex)
OTP_HASH_SALT=$(generate_secret_hex)
NEXTAUTH_SECRET=$(generate_secret_hex)

for file in .env .env.development .env.local .env.staging .env.test .env.production; do
    replace_placeholder "$file" "JWT_SECRET" "replace_with_long_random_value_minimum_32_characters" "$JWT_SECRET"
    replace_placeholder "$file" "MASTER_KEY" "your_32_byte_hex_master_key_here" "$MASTER_KEY"
done

replace_placeholder "apps/api/.env" "JWT_SECRET" "replace_with_long_random_value_minimum_32_characters" "$JWT_SECRET"
replace_placeholder "apps/api/.env" "AUDIT_LOG_SALT" "change-me-to-random-salt" "$AUDIT_LOG_SALT"
replace_placeholder "apps/api/.env" "OTP_HASH_SALT" "change-me" "$OTP_HASH_SALT"

replace_placeholder "apps/web/.env.local" "NEXTAUTH_SECRET" "replace_with_long_random_value_minimum_32_characters" "$NEXTAUTH_SECRET"
replace_placeholder "apps/web/.env.local" "JWT_SECRET" "replace_with_long_random_value_minimum_32_characters" "$JWT_SECRET"

replace_placeholder "backend/.env" "JWT_SECRET" "replace-with-a-strong-secret" "$JWT_SECRET"

echo ""
echo "Step 8: Verifying environment files..."
FILES_CREATED=0
FILES_SKIPPED=0

for file in .env .env.development .env.local .env.staging .env.test .env.production .env.supabase apps/api/.env apps/web/.env.local apps/mobile/.env.development supabase/.env backend/.env; do
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
