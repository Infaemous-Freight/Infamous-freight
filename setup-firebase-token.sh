#!/bin/bash
# Setup Firebase CI Token for GitHub Actions
# Run this on your LOCAL MACHINE (not in dev container)

echo "🔐 Firebase CI Token Setup"
echo "=========================="
echo ""
echo "This script will help you:"
echo "  1. Login to Firebase"
echo "  2. Get a CI token"
echo "  3. Show you how to add it to GitHub"
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo "✅ Firebase CLI found"
echo ""

# Get Firebase token
echo "🔑 Getting Firebase CI token..."
echo ""
echo "A browser window will open. Please:"
echo "  1. Login to your Google account"
echo "  2. Grant Firebase CLI permissions"
echo "  3. Come back here to see your token"
echo ""
read -p "Press ENTER to continue..."

# Run firebase login:ci
firebase login:ci

echo ""
echo "========================================"
echo "✅ TOKEN GENERATED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "📋 COPY THE TOKEN ABOVE (starts with 1//...)"
echo ""
echo "📝 NOW ADD IT TO GITHUB:"
echo ""
echo "  1. Go to: https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions"
echo "  2. Click 'New repository secret'"
echo "  3. Name: FIREBASE_TOKEN"
echo "  4. Value: [Paste the token]"
echo "  5. Click 'Add secret'"
echo ""
echo "🚀 THEN TRIGGER DEPLOYMENT:"
echo ""
echo "  Option A - Push code:"
echo "    git add ."
echo "    git commit -m 'Deploy to Firebase'"
echo "    git push origin main"
echo ""
echo "  Option B - Manual trigger:"
echo "    https://github.com/MrMiless44/Infamous-freight/actions/workflows/deploy-firebase-hosting.yml"
echo "    Click 'Run workflow'"
echo ""
echo "✅ Done! Deployment will complete in ~3-5 minutes"
echo ""
