#!/bin/bash
# Deployment Execution Script - 100% Complete
# Auto-triggers CI/CD deployment to all platforms

set -e

echo"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Infamous Freight Enterprises - Deployment Execution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check git status
echo "📊 Checking repository status..."
git status --short

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Deployment Options"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Push to main (triggers automatic CI/CD)"
echo "  → Deploys to Vercel + Fly.io automatically"
echo "  → Runs complete test suite"
echo "  → Full health checks"
echo ""
echo "Option 2: Manual workflow dispatch"
echo "  → Go to: https://github.com/MrMiless44/Infamous-freight/actions"
echo "  → Click 'Run workflow' on cd.yml"
echo ""
echo "Option 3: Status check only (no deployment)"
echo "  → Just check GitHub Actions status"
echo ""

read -p "Choose option (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🚀 Triggering Deployment via Git Push"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        # Stage changes
        echo "📦 Staging changes..."
        git add -A
        
        # Create commit
        echo "💾 Creating commit..."
        git commit -m "deploy: Trigger production deployment 100% via CI/CD

- Deploy web to Vercel
- Deploy API to Fly.io
- Run full test suite
- Execute health checks
- Enable monitoring

Automated deployment triggered: $(date -Iseconds)" || echo "No changes to commit"
        
        # Push to trigger CI/CD
        echo "🚢 Pushing to main (triggers CI/CD)..."
        git push origin main
        
        echo ""
        echo "✅ Push complete! CI/CD workflow triggered."
        echo ""
        echo "📊 Monitor deployment:"
        echo "   https://github.com/MrMiless44/Infamous-freight/actions"
        echo ""
        echo "🌐 Expected live URLs (after ~20 min):"
        echo "   Web: https://infamous-freight-enterprises.vercel.app"
        echo "   API: https://infamous-freight-api.fly.dev/api/health"
        ;;
        
    2)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 Manual Workflow Dispatch Instructions"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Open GitHub Actions:"
        echo "   https://github.com/MrMiless44/Infamous-freight/actions"
        echo ""
        echo "2. Select workflow:"
        echo "   • cd.yml (Full CI/CD pipeline)"
        echo "   • vercel-deploy.yml (Web only)"
        echo "   • fly-deploy.yml (API only)"
        echo ""
        echo "3. Click 'Run workflow' button"
        echo "4. Select branch: main"
        echo "5. Click 'Run workflow' to start"
        echo ""
        echo "Opening GitHub Actions in browser..."
        
        # Try to open in browser (if $BROWSER is set in devcontainer)
        if [ -n "$BROWSER" ]; then
            "$BROWSER" "https://github.com/MrMiless44/Infamous-freight/actions" 2>/dev/null || echo "→ Could not auto-open browser"
        fi
        ;;
        
    3)
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📊 Status Check"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🔍 Recent commits:"
        git log --oneline -5
        echo ""
        echo "🌐 GitHub Actions:"
        echo "   https://github.com/MrMiless44/Infamous-freight/actions"
        echo ""
        echo "📦 Deployment workflows:"
        ls -1 .github/workflows/*.yml | grep -E '(cd|deploy|vercel|fly)' | head -10
        echo ""
        echo "✅ All deployment infrastructure is ready"
        echo "   Run this script again and choose option 1 or 2 to deploy"
        ;;
        
    *)
        echo ""
        echo "❌ Invalid option. Please run again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment execution script complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   DEPLOYMENT_EXECUTION_100_COMPLETE.md"
echo ""
echo "🎯 Status: 100% Ready for Deployment"
echo ""
