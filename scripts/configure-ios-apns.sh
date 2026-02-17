#!/bin/bash
# Configure iOS APNs (Apple Push Notification Service)
# Sets up APNs certificates for Firebase Cloud Messaging

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📱 iOS APNs Configuration for Firebase${NC}"
echo "=========================================="
echo ""

# Check Firebase project
if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}✗ .firebaserc not found${NC}"
    echo "Please run ./scripts/setup-firebase-production.sh first"
    exit 1
fi

PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
echo "Project: $PROJECT_ID"
echo ""

echo "iOS APNs Setup Guide"
echo "===================="
echo ""
echo "APNs (Apple Push Notification Service) is required for iOS push notifications."
echo "You need an Apple Developer account to complete this setup."
echo ""

# Step 1: Apple Developer Account
echo "Step 1: Apple Developer Account"
echo "--------------------------------"
echo ""
echo "Requirements:"
echo "  • Apple Developer account (\$99/year)"
echo "  • Admin access to developer.apple.com"
echo ""
read -p "Do you have an Apple Developer account? (y/n): " has_account

if [ "$has_account" != "y" ]; then
    echo ""
    echo "You need an Apple Developer account to continue."
    echo "Sign up at: https://developer.apple.com/programs/"
    echo ""
    exit 0
fi

# Step 2: Create APNs Key
echo ""
echo "Step 2: Create APNs Authentication Key"
echo "---------------------------------------"
echo ""
echo "1. Go to: https://developer.apple.com/account/resources/authkeys/list"
echo "2. Click the '+' button to create a new key"
echo "3. Name: 'Firebase Push Notifications' (or similar)"
echo "4. Check 'Apple Push Notifications service (APNs)'"
echo "5. Click 'Continue' and then 'Register'"
echo "6. Download the .p8 file"
echo "7. Note the Key ID (10-character string)"
echo ""
echo "IMPORTANT: The .p8 file can only be downloaded once. Store it securely!"
echo ""
read -p "Have you created and downloaded the APNs key? (y/n): " has_key

if [ "$has_key" != "y" ]; then
    echo ""
    echo "Please create the APNs key first and run this script again."
    exit 0
fi

# Get APNs details
echo ""
read -p "Enter your Apple Team ID (10-character string, found at https://developer.apple.com/account): " TEAM_ID
read -p "Enter the APNs Key ID (10-character string): " KEY_ID
read -p "Enter path to .p8 file (or drag and drop): " P8_FILE

# Validate inputs
if [ -z "$TEAM_ID" ] || [ -z "$KEY_ID" ] || [ ! -f "$P8_FILE" ]; then
    echo -e "${RED}✗ Missing required information or .p8 file not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ APNs credentials validated${NC}"

# Step 3: Upload to Firebase
echo ""
echo "Step 3: Upload APNs Key to Firebase"
echo "------------------------------------"
echo ""
echo "Opening Firebase Console..."
echo ""
echo "Manual steps:"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/cloudmessaging"
echo "2. Scroll to 'Apple app configuration'"
echo "3. Click 'Upload' under 'APNs Authentication Key'"
echo "4. Upload your .p8 file: $P8_FILE"
echo "5. Enter Key ID: $KEY_ID"
echo "6. Enter Team ID: $TEAM_ID"
echo "7. Click 'Upload'"
echo ""

# Open browser (if possible)
if command -v xdg-open &> /dev/null; then
    xdg-open "https://console.firebase.google.com/project/$PROJECT_ID/settings/cloudmessaging" 2>/dev/null || true
elif command -v open &> /dev/null; then
    open "https://console.firebase.google.com/project/$PROJECT_ID/settings/cloudmessaging" 2>/dev/null || true
fi

read -p "Have you uploaded the APNs key to Firebase? (y/n): " uploaded

if [ "$uploaded" != "y" ]; then
    echo ""
    echo "Please upload the APNs key and run this script again to continue."
    exit 0
fi

# Step 4: Configure iOS app
echo ""
echo "Step 4: Configure iOS App"
echo "-------------------------"
echo ""
echo "1. Open your iOS project in Xcode"
echo "2. Select your app target"
echo "3. Go to 'Signing & Capabilities'"
echo "4. Click '+ Capability'"
echo "5. Add 'Push Notifications'"
echo "6. Add 'Background Modes' and enable 'Remote notifications'"
echo ""
echo "App configuration:"
echo "  • Bundle Identifier: com.infamousfreight.app"
echo "  • Team: $TEAM_ID"
echo ""
read -p "Have you configured the iOS app in Xcode? (y/n): " configured

# Step 5: Update mobile app configuration
echo ""
echo "Step 5: Update Mobile App Configuration"
echo "----------------------------------------"
echo ""

if [ -f "apps/mobile/.env" ]; then
    echo "Adding APNs configuration to apps/mobile/.env..."
    
    if ! grep -q "^APNS_TEAM_ID=" apps/mobile/.env; then
        echo "" >> apps/mobile/.env
        echo "# iOS APNs Configuration" >> apps/mobile/.env
        echo "APNS_TEAM_ID=$TEAM_ID" >> apps/mobile/.env
        echo "APNS_KEY_ID=$KEY_ID" >> apps/mobile/.env
    fi
    
    echo -e "${GREEN}✓ Configuration updated${NC}"
fi

# Step 6: Test push notifications
echo ""
echo "Step 6: Test Push Notifications"
echo "--------------------------------"
echo ""
echo "To test push notifications on iOS:"
echo ""
echo "1. Build and run the app on a physical iOS device"
echo "   (Push notifications don't work on simulator)"
echo ""
echo "2. Grant push notification permissions when prompted"
echo ""
echo "3. The app will register for notifications and get an FCM token"
echo ""
echo "4. Send a test notification:"
echo "   ./scripts/test-firebase-notifications.sh"
echo ""
echo "5. You should see the notification on your device!"
echo ""

# Create iOS-specific test script
cat > scripts/test-ios-notifications.sh <<'TESTSCRIPT'
#!/bin/bash
# Test iOS push notifications specifically

echo "🍎 iOS Push Notification Test"
echo "=============================="
echo ""

read -p "Enter device FCM token (from app logs): " FCM_TOKEN

if [ -z "$FCM_TOKEN" ]; then
    echo "Error: FCM token required"
    exit 1
fi

read -p "Enter JWT token: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "Error: JWT token required"
    exit 1
fi

API_URL="${API_URL:-http://localhost:4000}"

echo ""
echo "Registering device token..."
curl -X POST "$API_URL/api/firebase/notifications/register-token" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$FCM_TOKEN\",
    \"platform\": \"ios\"
  }"

echo ""
echo ""
echo "Sending test notification..."
curl -X POST "$API_URL/api/firebase/notifications/send" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"test-user\"],
    \"title\": \"iOS Test\",
    \"body\": \"If you see this, iOS push notifications are working! 🎉\",
    \"data\": {
      \"type\": \"ios-test\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }"

echo ""
echo ""
echo "Check your iOS device for the notification!"
TESTSCRIPT

chmod +x scripts/test-ios-notifications.sh

echo -e "${GREEN}✓ iOS test script created: scripts/test-ios-notifications.sh${NC}"

# Summary
echo ""
echo "===================================="
echo -e "${GREEN}✓ iOS APNs Configuration Complete!${NC}"
echo "===================================="
echo ""
echo "Summary:"
echo "  • Team ID: $TEAM_ID"
echo "  • Key ID: $KEY_ID"
echo "  • APNs Key: $P8_FILE"
echo ""
echo "Next steps:"
echo "1. Test on a physical iOS device"
echo "2. Run: ./scripts/test-ios-notifications.sh"
echo "3. Check device for notification"
echo ""
echo "Troubleshooting:"
echo "  • Notifications require a physical device (not simulator)"
echo "  • App must be in foreground or background (not terminated)"
echo "  • Check Firebase Console → Cloud Messaging for delivery logs"
echo "  • Verify APNs certificate is active in Apple Developer Portal"
echo ""
echo "Documentation: FIREBASE_100_COMPLETE.md"
