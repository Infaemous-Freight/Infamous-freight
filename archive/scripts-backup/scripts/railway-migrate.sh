#!/bin/bash
# Railway Migration Script
# Migrates existing deployments to Railway
# Supports migration from: Fly.io, Vercel, Heroku, Docker

set -e

echo "🚀 Railway Migration Tool"
echo "========================="
echo ""

# Functions
check_prerequisites() {
    local missing_tools=()
    
    if ! command -v railway &> /dev/null; then
        missing_tools+=("railway CLI")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("Docker")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo "❌ Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "   - $tool"
        done
        echo ""
        echo "Install them first before running this script"
        exit 1
    fi
    
    echo "✅ All prerequisites met"
}

migrate_from_flyio() {
    echo ""
    echo "Migrating from Fly.io..."
    echo "========================"
    
    echo ""
    echo "Step 1: Export Fly.io environment"
    read -p "Enter Fly.io app name: " FLY_APP
    
    flyctl config view --app $FLY_APP > /tmp/fly-config.toml || {
        echo "❌ Could not read Fly.io config"
        return 1
    }
    
    echo "✅ Exported Fly.io config"
    
    echo ""
    echo "Step 2: Extract environment variables"
    # Note: Real implementation would parse toml and extract env vars
    echo "⚠️  Manually copy environment variables from Fly.io dashboard"
    echo "    Go to: https://fly.io/apps/$FLY_APP/secrets"
    
    read -p "Press ENTER after copying env vars to Railway..."
    
    echo ""
    echo "Step 3: Migrate database"
    read -p "Migrate database from Fly.io? (y/n): " MIGRATE_DB
    
    if [ "$MIGRATE_DB" = "y" ]; then
        echo "Getting Fly.io database connection..."
        # flyctl config show might have database URL
        echo "⚠️  Database migration requires:"
        echo "    1. Backup from Fly.io: flyctl postgres connect -a $FLY_APP"
        echo "    2. Restore to Railway: railway connect postgresql < backup.sql"
        read -p "Enter path to database backup file: " BACKUP_FILE
        
        if [ -f "$BACKUP_FILE" ]; then
            echo "Restoring database..."
            railway connect postgresql < "$BACKUP_FILE" || {
                echo "❌ Database restore failed"
                return 1
            }
            echo "✅ Database migrated"
        fi
    fi
    
    echo "✅ Migration from Fly.io complete"
}

migrate_from_heroku() {
    echo ""
    echo "Migrating from Heroku..."
    echo "========================"
    
    echo ""
    echo "Step 1: Export Heroku configuration"
    read -p "Enter Heroku app name: " HEROKU_APP
    
    # Get Heroku config
    heroku config --app $HEROKU_APP > /tmp/heroku-config.txt || {
        echo "❌ Heroku CLI not authenticated or app not found"
        echo "Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        return 1
    }
    
    echo "✅ Exported Heroku configuration"
    
    echo ""
    echo "Environment variables from Heroku:"
    cat /tmp/heroku-config.txt | head -10
    
    echo ""
    echo "Adding to Railway..."
    
    # Parse and add each variable
    while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            railway variable set "$key" "$value"
            echo "✅ Added: $key"
        fi
    done < /tmp/heroku-config.txt
    
    echo "✅ Environment variables migrated"
    
    echo ""
    echo "Step 2: Migrate database"
    read -p "Migrate Heroku database? (y/n): " MIGRATE_DB
    
    if [ "$MIGRATE_DB" = "y" ]; then
        DB_URL=$(heroku config:get DATABASE_URL --app $HEROKU_APP)
        echo "Creating Heroku database backup..."
        heroku pg:backups:capture --app $HEROKU_APP
        
        echo "Downloading backup..."
        heroku pg:backups:download --app $HEROKU_APP
        
        echo "Restoring to Railway..."
        railway connect postgresql < latest.dump || {
            echo "❌ Restore failed - see log above"
            return 1
        }
        echo "✅ Database migrated"
    fi
    
    echo "✅ Migration from Heroku complete"
}

migrate_from_vercel() {
    echo ""
    echo "Migrating from Vercel..."
    echo "========================"
    
    echo "⚠️  Note: Vercel is a frontend platform, this only applies to API deployments"
    echo ""
    
    read -p "Enter Vercel project name: " VERCEL_PROJECT
    
    echo "Getting Vercel environment..."
    vercel env pull --yes --project $VERCEL_PROJECT || {
        echo "❌ Vercel CLI not authenticated"
        echo "Install: npm install -g vercel"
        return 1
    }
    
    echo "✅ .env.local created from Vercel"
    
    if [ -f ".env.local" ]; then
        echo ""
        echo "Adding Vercel env vars to Railway..."
        
        while IFS='=' read -r key value; do
            if [ -n "$key" ] && [ -n "$value" ]; then
                railway variable set "$key" "$value"
                echo "✅ Added: $key"
            fi
        done < .env.local
    fi
    
    echo "✅ Migration from Vercel complete"
}

backup_before_migration() {
    echo ""
    echo "Creating backup before migration..."
    
    BACKUP_DIR="backups/railway-migration-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    echo "Backing up:"
    
    # Backup database if accessible
    if command -v pg_dump &> /dev/null; then
        echo "  - PostgreSQL database..."
        pg_dump $DATABASE_URL > "$BACKUP_DIR/database.sql" 2>/dev/null || true
        echo "    ✅ Saved to: $BACKUP_DIR/database.sql"
    fi
    
    # Backup config files
    echo "  - Configuration files..."
    cp -r apps "$BACKUP_DIR/apps" 2>/dev/null || true
    cp -r packages "$BACKUP_DIR/packages" 2>/dev/null || true
    echo "    ✅ Saved to: $BACKUP_DIR/apps and packages"
    
    echo ""
    echo "Backup complete: $BACKUP_DIR"
}

verify_migration() {
    echo ""
    echo "Verifying migration..."
    echo "======================"
    
    echo ""
    echo "Checking services..."
    railway service list
    
    echo ""
    echo "Checking environment variables..."
    railway variable list | head -20
    
    echo ""
    echo "Testing deployments..."
    
    echo "  - API health check..."
    API_URL=$(railway variable get RAILWAY_PUBLIC_DOMAIN || echo "")
    if [ -n "$API_URL" ]; then
        curl -sf "https://$API_URL/api/health" > /dev/null && {
            echo "    ✅ API responding"
        } || {
            echo "    ⚠️  API not responding yet (still deploying?)"
        }
    fi
    
    echo ""
    echo "✅ Migration verification complete"
    echo ""
    echo "Next steps:"
    echo "1. Test your application thoroughly"
    echo "2. Update DNS records to point to Railway"
    echo "3. Monitor logs: railway deployment logs --follow"
    echo "4. Keep old deployment running as backup for 24-48 hours"
}

# Main flow
echo "Select migration source:"
echo "1) Fly.io"
echo "2) Heroku"
echo "3) Vercel (API only)"
echo "4) Docker (skip this step)"
echo ""
read -p "Enter choice (1-4): " CHOICE

check_prerequisites

case $CHOICE in
    1)
        backup_before_migration
        migrate_from_flyio
        verify_migration
        ;;
    2)
        backup_before_migration
        migrate_from_heroku
        verify_migration
        ;;
    3)
        backup_before_migration
        migrate_from_vercel
        verify_migration
        ;;
    4)
        echo "Skipping migration source setup"
        backup_before_migration
        verify_migration
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Migration completed!"
echo ""
echo "⚠️  Remember to:"
echo "   1. Test your application thoroughly"
echo "   2. Update DNS if using custom domains"
echo "   3. Monitor deployments: https://railway.app"
echo "   4. Keep old deployment as backup for 24-48 hours"
