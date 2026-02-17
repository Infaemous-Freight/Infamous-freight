#!/bin/bash

# Monitor GitHub Actions build status for all platforms
# Usage: ./scripts/monitor-build-status.sh

REPO="MrMiless44/Infamous-freight-enterprises"
API_URL="https://api.github.com/repos/$REPO/actions/runs"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Monitoring Build Status for $REPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fetch latest workflow runs
RESPONSE=$(curl -s "$API_URL?branch=main&per_page=5")

# Parse and display workflow status
echo "Recent Workflow Runs:"
echo "$RESPONSE" | grep -E '"name"|"status"|"conclusion"' | head -30

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Quick Links:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔌 API Deployment:        https://github.com/$REPO/actions/workflows/deploy-api-fly.yml"
echo "🌐 Web Deployment:        https://github.com/$REPO/actions/workflows/vercel-deploy.yml"
echo "📱 Mobile Deployment:     https://github.com/$REPO/actions/workflows/mobile-deploy.yml"
echo ""
echo "🎯 All Actions:           https://github.com/$REPO/actions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
