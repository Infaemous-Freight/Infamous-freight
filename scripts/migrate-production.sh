#!/bin/bash
# Production database migration script
# Run this after deploying schema changes to production

set -e

echo "🚀 Running production database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Set it with: export DATABASE_URL='your_production_database_url'"
    exit 1
fi

echo "📊 Database: ${DATABASE_URL%%\?*}"  # Hide credentials
echo ""

# Navigate to API directory
cd "$(dirname "$0")/../apps/api" || exit 1

echo "1️⃣  Checking migration status..."
pnpm prisma migrate status || true
echo ""

echo "2️⃣  Running pending migrations..."
pnpm prisma migrate deploy

echo ""
echo "3️⃣  Generating Prisma Client..."
pnpm prisma generate

echo ""
echo "✅ Migrations complete!"
echo ""
echo "📝 To create a new migration:"
echo "   cd apps/api && pnpm prisma migrate dev --name your_migration_name"
echo ""
echo "🔍 To check migration status:"
echo "   cd apps/api && pnpm prisma migrate status"
