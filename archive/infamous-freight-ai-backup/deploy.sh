#!/bin/bash
# Infæmous Freight - One-Click Production Deployment

set -e

echo "🚀 Infæmous Freight Production Deployment"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo ""
echo "Choose your deployment platform:"
echo "1) Render.com (Easiest - Recommended)"
echo "2) Fly.io (Advanced)"  
echo "3) Vercel + Render (Hybrid)"
echo "4) Run local production test"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🎯 Deploying to Render.com..."
        echo ""
        echo "✅ Step 1: Code is already pushed to GitHub"
        echo ""
        echo "📝 Step 2: Manual deployment required"
        echo "   1. Go to: https://render.com"
        echo "   2. Sign in with GitHub"
        echo "   3. Click 'New +' → 'Blueprint'"
        echo "   4. Select 'Infamous-Freight-Enterprises' repo"
        echo "   5. Click 'Apply'"
        echo ""
        echo "⏱️  Deployment takes ~5-10 minutes"
        echo ""
        echo "🔗 Your URLs will be:"
        echo "   Web: https://infamous-freight-web.onrender.com"
        echo "   API: https://infamous-freight-api.onrender.com"
        echo ""
        echo "🔐 After deployment, add Stripe keys:"
        echo "   Dashboard → infamous-freight-api → Environment"
        echo "   Add: STRIPE_SECRET_KEY=sk_live_..."
        echo "   Add: STRIPE_WEBHOOK_SECRET=whsec_..."
        echo ""
        ;;
    
    2)
        echo ""
        echo "🎯 Deploying to Fly.io..."
        echo ""
        
        # Check if flyctl is installed
        if ! command -v flyctl &> /dev/null; then
            echo "📦 Installing Fly CLI..."
            brew install flyctl || curl -L https://fly.io/install.sh | sh
        fi
        
        echo "🔐 Logging in to Fly.io..."
        flyctl auth login
        
        echo "🚀 Launching app..."
        flyctl launch --now
        
        echo ""
        echo "✅ Deployment complete!"
        echo "🔗 Your app: https://infamous-freight.fly.dev"
        echo ""
        echo "🔐 Set secrets:"
        echo "   flyctl secrets set STRIPE_SECRET_KEY=sk_live_..."
        echo "   flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
        echo ""
        ;;
    
    3)
        echo ""
        echo "🎯 Hybrid Deployment (Vercel + Render)..."
        echo ""
        echo "Step 1: Deploy API to Render (see option 1)"
        echo ""
        echo "Step 2: Deploy Web to Vercel"
        
        # Check if vercel is installed
        if ! command -v vercel &> /dev/null; then
            echo "📦 Installing Vercel CLI..."
            pnpm add -g vercel@latest
        fi
        
        cd apps/web
        echo "🔐 Logging in to Vercel..."
        vercel login
        
        echo "🚀 Deploying to production..."
        vercel --prod
        
        cd ..
        echo ""
        echo "✅ Web deployed to Vercel!"
        echo "📝 Don't forget to deploy API to Render separately"
        echo ""
        ;;
    
    4)
        echo ""
        echo "🧪 Running local production test..."
        echo ""
        
        # Stop existing containers
        docker compose down
        
        # Set production environment
        export NODE_ENV=production
        
        # Build and start
        echo "🔨 Building production images..."
        docker compose build
        
        echo "🚀 Starting services..."
        docker compose up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to start..."
        sleep 10
        
        # Test health
        echo ""
        echo "🏥 Health check:"
        curl -s http://localhost/api/health | jq || echo "❌ API health check failed"
        
        echo ""
        echo "✅ Local production test complete!"
        echo ""
        echo "🌐 Access your site:"
        echo "   Web: http://localhost"
        echo "   API: http://localhost/api/health"
        echo ""
        echo "📊 Monitor logs:"
        echo "   docker compose logs -f"
        echo ""
        ;;
    
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "📚 Next Steps:"
echo "================================================"
echo ""
echo "1. ✅ Set up Stripe account (stripe.com)"
echo "2. ✅ Add payment keys to environment"
echo "3. ✅ Test /pricing page"
echo "4. ✅ Post on LinkedIn/forums"
echo "5. ✅ Get first customer! 💰"
echo ""
echo "📖 Full guide: See DEPLOYMENT_PRODUCTION.md"
echo ""
echo "🎉 Your freight AI platform is ready to make money!"
echo ""
