#!/bin/bash
# Railway Deployment Setup Script
# Automates Railway deployment and configuration for Infamous Freight monorepo

set -e

echo "🚀 Railway Deployment Setup Started"
echo "===================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI installed"
railway --version

# Check authentication
echo ""
echo "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway"
    railway login
fi

RAILWAY_USER=$(railway whoami | head -1)
echo "✅ Logged in as: $RAILWAY_USER"

# Project selection/creation
echo ""
echo "Railway Projects:"
railway list

echo ""
read -p "Enter project ID or name (create new with 'new'): " PROJECT_INPUT

if [ "$PROJECT_INPUT" = "new" ]; then
    read -p "Enter new project name: " PROJECT_NAME
    PROJECT_ID=$(railway create $PROJECT_NAME | grep -oP 'ID: \K[^ ]*' || echo "")
    echo "✅ Created project: $PROJECT_NAME ($PROJECT_ID)"
else
    PROJECT_ID=$PROJECT_INPUT
    railway project $PROJECT_ID || {
        echo "❌ Invalid project ID"
        exit 1
    }
fi

# Set current project
railway project $PROJECT_ID

# Environment selection
echo ""
echo "Creating environments..."

# Production environment
railway env production || echo "⚠️  Production environment already exists"

# Staging environment  
railway env staging || echo "⚠️  Staging environment already exists"

# List environments
echo ""
echo "Environments:"
railway env list

# Check if services exist
echo ""
echo "Current services:"
railway service list || echo "No services yet"

# PostgreSQL setup
echo ""
read -p "Add PostgreSQL database? (y/n): " ADD_DB

if [ "$ADD_DB" = "y" ]; then
    echo "Adding PostgreSQL service..."
    railway add --name postgres postgresql
    echo "✅ PostgreSQL added"
fi

# Redis setup
echo ""
read -p "Add Redis cache? (y/n): " ADD_REDIS

if [ "$ADD_REDIS" = "y" ]; then
    echo "Adding Redis service..."
    railway add --name redis redis
    echo "✅ Redis added"
fi

# API deployment
echo ""
read -p "Deploy API service? (y/n): " DEPLOY_API

if [ "$DEPLOY_API" = "y" ]; then
    echo "Deploying API service..."
    railway add --name api .
    echo "✅ API service added"
fi

# Web deployment
echo ""
read -p "Deploy Web frontend? (y/n): " DEPLOY_WEB

if [ "$DEPLOY_WEB" = "y" ]; then
    echo "Deploying Web frontend..."
    # Note: Railway requires separate services for different directories
    railway add --name web .
    echo "✅ Web service added"
fi

# Environment variables
echo ""
echo "Environment variables need to be configured manually at:"
echo "https://railway.app/project/$PROJECT_ID/settings"
echo ""
echo "Required variables for API:"
cat << 'EOF'
- DATABASE_URL (from PostgreSQL service)
- REDIS_URL (from Redis service)
- JWT_SECRET
- NODE_ENV=production
- PORT=3001
EOF

echo ""
echo "Required variables for Web:"
cat << 'EOF'
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_ENV=production
- NODE_ENV=production
- PORT=3000
EOF

# Display deployment status
echo ""
echo "🎉 Railway deployment configured!"
echo ""
echo "Next steps:"
echo "1. Go to: https://railway.app/project/$PROJECT_ID"
echo "2. Configure environment variables for each service"
echo "3. Deploy services with: railway up"
echo "4. Monitor deployments at: https://railway.app/project/$PROJECT_ID/deployments"
echo ""
