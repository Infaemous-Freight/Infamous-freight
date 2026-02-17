#!/bin/bash

# Setup GitHub Pages for Analytics Dashboard
# This script provides instructions and automation for GitHub Pages setup

echo "📄 GitHub Pages Setup for Analytics Dashboard"
echo "=============================================="
echo ""

REPO_OWNER="MrMiless44"
REPO_NAME="Infamous-freight-enterprises"
PAGES_URL="https://${REPO_OWNER}.github.io/${REPO_NAME}/workflows-dashboard.html"

echo "🎯 This will help you set up GitHub Pages to host the analytics dashboard."
echo ""

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "📊 Checking current repository settings..."
    
    # Check if Pages is already enabled
    PAGES_STATUS=$(gh api repos/${REPO_OWNER}/${REPO_NAME}/pages 2>&1)
    
    if echo "$PAGES_STATUS" | grep -q "Not Found"; then
        echo "ℹ️  GitHub Pages is not currently enabled."
        echo ""
        echo "To enable GitHub Pages via CLI:"
        echo ""
        echo "gh api --method POST repos/${REPO_OWNER}/${REPO_NAME}/pages \\"
        echo "  -f source[branch]=main \\"
        echo "  -f source[path]=/docs \\"
        echo "  -f build_type=legacy"
        echo ""
    else
        echo "✅ GitHub Pages is already enabled!"
        echo ""
        echo "📊 Dashboard URL: ${PAGES_URL}"
        echo ""
        echo "Note: It may take a few minutes for changes to deploy."
    fi
else
    echo "ℹ️  GitHub CLI not found. Manual setup instructions below."
fi

echo ""
echo "📋 Manual Setup Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to Repository Settings:"
echo "   https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/pages"
echo ""
echo "2. Under 'Build and deployment':"
echo "   - Source: Deploy from a branch"
echo "   - Branch: main"
echo "   - Folder: /docs"
echo "   - Click 'Save'"
echo ""
echo "3. Wait 1-2 minutes for deployment"
echo ""
echo "4. Visit your dashboard:"
echo "   ${PAGES_URL}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Features after setup:"
echo "   ✓ Public analytics dashboard"
echo "   ✓ Real-time workflow metrics"
echo "   ✓ Shareable with stakeholders"
echo "   ✓ Auto-updates with metrics collection"
echo ""

# Check if docs directory exists
if [ -d "docs" ]; then
    echo "✅ docs/ directory exists"
    
    if [ -f "docs/workflows-dashboard.html" ]; then
        echo "✅ Dashboard file exists"
    else
        echo "❌ Dashboard file not found: docs/workflows-dashboard.html"
    fi
    
    if [ -d "docs/metrics" ]; then
        echo "✅ metrics/ directory exists"
        
        if [ -f "docs/metrics/workflow-data.json" ]; then
            echo "✅ Metrics data file exists"
            echo ""
            echo "📊 Current metrics file size: $(du -h docs/metrics/workflow-data.json | cut -f1)"
        else
            echo "ℹ️  Metrics data not yet collected"
            echo "   Run: ./scripts/trigger-metrics-collection.sh"
        fi
    else
        echo "ℹ️  metrics/ directory will be created by metrics collection workflow"
    fi
else
    echo "❌ docs/ directory not found"
    exit 1
fi

echo ""
echo "🔗 Quick Links:"
echo "   Repository Settings: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings"
echo "   Pages Settings: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/pages"
echo "   Actions: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
echo "   Expected Dashboard URL: ${PAGES_URL}"
echo ""
