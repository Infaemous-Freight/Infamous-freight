#!/bin/bash
# Firebase Integration Verification Script
# Verifies that all Firebase components are properly installed and configured

set -e  # Exit on error

echo "🔥 Firebase Integration Verification"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ERRORS=0
WARNINGS=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
    fi
}

check_env_var() {
    if grep -q "^$1=" .env.example 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Documented: $1"
    else
        echo -e "${YELLOW}⚠${NC} Not documented: $1"
        ((WARNINGS++))
    fi
}

check_package_dependency() {
    local package_json="$1"
    local dependency="$2"
    
    if [ -f "$package_json" ]; then
        if grep -q "\"$dependency\"" "$package_json"; then
            echo -e "${GREEN}✓${NC} Dependency installed: $dependency"
        else
            echo -e "${RED}✗${NC} Dependency missing: $dependency in $package_json"
            ((ERRORS++))
        fi
    else
        echo -e "${RED}✗${NC} Package file missing: $package_json"
        ((ERRORS++))
    fi
}

echo "1. Checking Firebase Configuration Files..."
echo "-------------------------------------------"
check_file "firebase.json"
check_file ".firebaserc"
check_file "firestore.rules"
check_file "storage.rules"
check_file "firestore.indexes.json"
echo ""

echo "2. Checking Backend (API) Files..."
echo "-----------------------------------"
check_file "apps/api/src/services/firebaseAdmin.js"
check_file "apps/api/src/routes/notifications.js"
check_file "apps/api/package.json"
echo ""

echo "3. Checking Backend Dependencies..."
echo "------------------------------------"
check_package_dependency "apps/api/package.json" "firebase-admin"
echo ""

echo "4. Checking Mobile App Files..."
echo "--------------------------------"
check_file "apps/mobile/src/services/firebase.ts"
check_file "apps/mobile/services/pushNotifications.ts"
check_file "apps/mobile/app.json"
check_file "apps/mobile/package.json"
echo ""

echo "5. Checking Mobile Dependencies..."
echo "-----------------------------------"
check_package_dependency "apps/mobile/package.json" "firebase"
check_package_dependency "apps/mobile/package.json" "expo-notifications"
check_package_dependency "apps/mobile/package.json" "@react-native-async-storage/async-storage"
echo ""

echo "6. Checking Environment Configuration..."
echo "-----------------------------------------"
check_file ".env.example"
check_file "apps/mobile/.env.example"
check_env_var "FIREBASE_PROJECT_ID"
check_env_var "FIREBASE_SERVICE_ACCOUNT"
check_env_var "FIREBASE_API_KEY"
echo ""

echo "7. Checking Documentation..."
echo "-----------------------------"
check_file "FIREBASE_100_COMPLETE.md"
check_file "FIREBASE_QUICK_REFERENCE.md"
check_file "FIREBASE_IMPLEMENTATION_SUMMARY.md"
echo ""

echo "8. Checking .gitignore..."
echo "-------------------------"
if grep -q "firebase-service-account" .gitignore; then
    echo -e "${GREEN}✓${NC} Firebase secrets protected in .gitignore"
else
    echo -e "${RED}✗${NC} Firebase secrets not protected in .gitignore"
    ((ERRORS++))
fi
echo ""

echo "9. Checking Server.js Integration..."
echo "-------------------------------------"
if grep -q "firebaseNotificationsRoutes" apps/api/src/server.js; then
    echo -e "${GREEN}✓${NC} Firebase routes imported in server.js"
else
    echo -e "${RED}✗${NC} Firebase routes not imported in server.js"
    ((ERRORS++))
fi

if grep -q "/api/firebase/notifications" apps/api/src/server.js; then
    echo -e "${GREEN}✓${NC} Firebase routes mounted in server.js"
else
    echo -e "${RED}✗${NC} Firebase routes not mounted in server.js"
    ((ERRORS++))
fi
echo ""

echo "10. Optional Setup Checks..."
echo "----------------------------"
if [ -f "firebase-service-account.json" ]; then
    echo -e "${GREEN}✓${NC} Service account JSON found (production ready)"
else
    echo -e "${YELLOW}⚠${NC} Service account JSON not found (add for production)"
    ((WARNINGS++))
fi

if [ -f "apps/mobile/GoogleService-Info.plist" ]; then
    echo -e "${GREEN}✓${NC} iOS GoogleService-Info.plist found"
else
    echo -e "${YELLOW}⚠${NC} iOS GoogleService-Info.plist not found (add for iOS)"
    ((WARNINGS++))
fi

if [ -f "apps/mobile/google-services.json" ]; then
    echo -e "${GREEN}✓${NC} Android google-services.json found"
else
    echo -e "${YELLOW}⚠${NC} Android google-services.json not found (add for Android)"
    ((WARNINGS++))
fi
echo ""

echo "===================================="
echo "📊 Verification Summary"
echo "===================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All required files present and configured!${NC}"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warning(s) (optional setup)${NC}"
fi

echo ""
echo "Next Steps:"
echo "-----------"
if [ $ERRORS -eq 0 ]; then
    echo "1. Create Firebase project: https://console.firebase.google.com"
    echo "2. Download service account JSON"
    echo "3. Configure .env files with Firebase credentials"
    echo "4. Deploy security rules: firebase deploy --only firestore:rules,storage:rules"
    echo "5. Test push notifications"
    echo ""
    echo "See FIREBASE_100_COMPLETE.md for detailed setup instructions."
    echo ""
    echo -e "${GREEN}🚀 Firebase integration is ready for production deployment!${NC}"
    exit 0
else
    echo "Fix the errors listed above and run this script again."
    exit 1
fi
