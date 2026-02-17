#!/bin/bash
# Complete Firebase Setup Script
# Runs all setup steps in sequence

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║          🔥 Firebase Complete Setup Automation 🔥              ║"
echo "║                                                                ║"
echo "║            Infamous Freight Enterprises                        ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
echo "========================"
echo ""

MISSING=0

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    ((MISSING++))
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    ((MISSING++))
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ git not found${NC}"
    ((MISSING++))
else
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓ git found: $GIT_VERSION${NC}"
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ curl not found${NC}"
    ((MISSING++))
else
    echo -e "${GREEN}✓ curl found${NC}"
fi

if [ $MISSING -gt 0 ]; then
    echo ""
    echo -e "${RED}Missing $MISSING required tool(s). Please install and try again.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All prerequisites met!${NC}"
echo ""

# Setup menu
echo "Firebase Setup Options"
echo "======================"
echo ""
echo "Select what you want to set up:"
echo ""
echo "  1) Complete setup (runs all steps)"
echo "  2) Firebase project setup"
echo "  3) Test notifications"
echo "  4) Configure monitoring"
echo "  5) Configure iOS APNs"
echo "  6) Start Firebase emulators"
echo "  7) Verify installation"
echo "  8) Run all tests"
echo "  9) Exit"
echo ""
read -p "Enter choice (1-9): " CHOICE

case $CHOICE in
  1)
    echo ""
    echo -e "${BLUE}Running complete Firebase setup...${NC}"
    echo ""
    
    # Step 1: Verify installation
    echo "Step 1: Verifying installation..."
    ./scripts/verify-firebase.sh
    echo ""
    
    # Step 2: Production setup
    echo "Step 2: Setting up Firebase project..."
    ./scripts/setup-firebase-production.sh
    echo ""
    
    # Step 3: Monitoring
    echo "Step 3: Setting up monitoring..."
    ./scripts/setup-firebase-monitoring.sh
    echo ""
    
    # Step 4: iOS APNs (optional)
    read -p "Do you want to configure iOS push notifications now? (y/n): " setup_ios
    if [ "$setup_ios" == "y" ]; then
        echo ""
        ./scripts/configure-ios-apns.sh
    fi
    
    echo ""
    echo -e "${GREEN}✓ Complete setup finished!${NC}"
    ;;
    
  2)
    echo ""
    ./scripts/setup-firebase-production.sh
    ;;
    
  3)
    echo ""
    ./scripts/test-firebase-notifications.sh
    ;;
    
  4)
    echo ""
    ./scripts/setup-firebase-monitoring.sh
    ;;
    
  5)
    echo ""
    ./scripts/configure-ios-apns.sh
    ;;
    
  6)
    echo ""
    echo "Starting Firebase emulators..."
    echo ""
    echo "This will start:"
    echo "  • Firestore (port 8080)"
    echo "  • Authentication (port 9099)"
    echo "  • Storage (port 9199)"
    echo "  • Hosting (port 5000)"
    echo "  • Emulator UI (port 4000)"
    echo ""
    echo "Access the UI at: http://localhost:4000"
    echo ""
    read -p "Press Enter to start emulators (Ctrl+C to stop)..."
    firebase emulators:start
    ;;
    
  7)
    echo ""
    ./scripts/verify-firebase.sh
    ;;
    
  8)
    echo ""
    echo "Running all tests..."
    echo ""
    
    # Verify installation
    echo "1. Verifying installation..."
    ./scripts/verify-firebase.sh
    echo ""
    
    # Start API server in background
    echo "2. Starting API server..."
    cd apps/api
    npm run dev > /tmp/firebase-api.log 2>&1 &
    API_PID=$!
    cd ../..
    
    # Wait for server to start
    echo "Waiting for API server to start..."
    sleep 5
    
    # Run notification tests
    echo ""
    echo "3. Testing notifications..."
    ./scripts/test-firebase-notifications.sh
    
    # Kill API server
    kill $API_PID 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}✓ All tests completed!${NC}"
    ;;
    
  9)
    echo "Exiting..."
    exit 0
    ;;
    
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

# Final summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Firebase Setup Summary${NC}"
echo ""
echo "Documentation:"
echo "  📖 Complete guide: FIREBASE_100_COMPLETE.md"
echo "  ⚡ Quick reference: FIREBASE_QUICK_REFERENCE.md"
echo "  📋 Summary: FIREBASE_IMPLEMENTATION_SUMMARY.md"
echo "  📝 README: FIREBASE_README.md"
echo ""
echo "Useful commands:"
echo "  ./scripts/firebase-setup.sh - Run this script again"
echo "  ./scripts/verify-firebase.sh - Verify installation"
echo "  ./scripts/test-firebase-notifications.sh - Test notifications"
echo "  ./scripts/monitor-firebase.sh - Monitor metrics"
echo "  firebase emulators:start - Start local testing environment"
echo ""
echo "Support:"
echo "  • Firebase Console: https://console.firebase.google.com"
echo "  • Documentation: https://firebase.google.com/docs"
echo "  • GitHub Issues: https://github.com/MrMiless44/Infamous-freight/issues"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🎉 Firebase is ready to use!${NC}"
echo ""
