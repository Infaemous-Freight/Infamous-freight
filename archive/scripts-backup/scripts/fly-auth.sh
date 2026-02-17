#!/bin/bash
# Quick Fly.io Authentication Script

export PATH="/home/vscode/.fly/bin:$PATH"

echo "🔐 Fly.io Authentication"
echo "========================"
echo ""
echo "Opening browser for Fly.io authentication..."
echo ""
echo "This will open a browser window where you can:"
echo "  1. Sign in to your existing Fly.io account"
echo "  2. Create a new Fly.io account (free tier available)"
echo ""
echo "After authenticating, you can run the deployment:"
echo "  ./scripts/complete-fly-deploy.sh"
echo ""

flyctl auth login
