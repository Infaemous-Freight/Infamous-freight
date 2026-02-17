#!/bin/bash
# Final Deployment Script for Option B
# Run this on your LOCAL MACHINE (not in dev container)

echo "🚀 Infamous Freight - Final Deployment"
echo "======================================"
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Login to Firebase
echo "🔐 Step 1: Authenticate with Firebase"
firebase login

# Use the correct project
echo ""
echo "📦 Step 2: Set Firebase project"
firebase use infamous-freight-prod

# Deploy to hosting
echo ""
echo "🚀 Step 3: Deploy to Firebase Hosting"
firebase deploy --only hosting

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "Next steps:"
echo "  1. Visit: https://infamousfreight.web.app"
echo "  2. Configure DNS (see OPTION_B_95_PERCENT_COMPLETE.md)"
echo "  3. Connect custom domain in Firebase Console"
echo "  4. Wait 1-2 hours for SSL certificate"
echo ""
echo "Then visit: https://infamousfreight.com"
echo ""
