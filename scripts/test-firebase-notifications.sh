#!/bin/bash
# Test Firebase Push Notifications
# Sends test notifications to verify Firebase is working

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔥 Firebase Notification Testing${NC}"
echo "===================================="
echo ""

# Check if API is running
echo "Checking if API server is running..."
if curl -s http://localhost:4000/api/health > /dev/null; then
    echo -e "${GREEN}✓ API server is running${NC}"
else
    echo -e "${RED}✗ API server is not running${NC}"
    echo "Please start the API server first:"
    echo "  cd apps/api && npm run dev"
    exit 1
fi

# Get JWT token
echo ""
echo "JWT Token Setup"
echo "---------------"
read -p "Enter JWT token (or press Enter to generate test token): " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "Generating test JWT token..."
    
    # Create a test token generation script
    cat > /tmp/generate-jwt.js <<'EOF'
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'test-secret';

const token = jwt.sign(
  {
    sub: 'test-user-id',
    email: 'test@example.com',
    scopes: ['notifications:register', 'notifications:send', 'notifications:read']
  },
  secret,
  { expiresIn: '1h' }
);

console.log(token);
EOF
    
    JWT_TOKEN=$(cd apps/api && node /tmp/generate-jwt.js)
    rm -f /tmp/generate-jwt.js
    
    if [ -n "$JWT_TOKEN" ]; then
        echo -e "${GREEN}✓ Test JWT token generated${NC}"
    else
        echo -e "${RED}✗ Failed to generate JWT token${NC}"
        exit 1
    fi
fi

API_URL="${API_URL:-http://localhost:4000}"

# Test 1: Register device token
echo ""
echo "Test 1: Register Device Token"
echo "------------------------------"
TEST_TOKEN="test-fcm-token-$(date +%s)"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$API_URL/api/firebase/notifications/register-token" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TEST_TOKEN\",
    \"platform\": \"android\"
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Device token registered successfully${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Failed to register device token (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

# Test 2: Send notification
echo ""
echo "Test 2: Send Push Notification"
echo "-------------------------------"
read -p "Enter user ID to send notification to (default: test-user-id): " USER_ID
USER_ID=${USER_ID:-test-user-id}

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$API_URL/api/firebase/notifications/send" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userIds\": [\"$USER_ID\"],
    \"title\": \"Test Notification\",
    \"body\": \"Firebase integration is working! Sent at $(date)\",
    \"data\": {
      \"type\": \"test\",
      \"timestamp\": \"$(date -Iseconds)\"
    }
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Notification sent successfully${NC}"
    echo "Response: $body"
else
    echo -e "${YELLOW}⚠ Notification may have failed (HTTP $http_code)${NC}"
    echo "Response: $body"
    echo ""
    echo "Note: This might fail if no valid device tokens are registered for this user"
fi

# Test 3: Subscribe to topic
echo ""
echo "Test 3: Subscribe to Topic"
echo "--------------------------"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$API_URL/api/firebase/notifications/subscribe-topic" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tokens\": [\"$TEST_TOKEN\"],
    \"topic\": \"test-topic\"
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Subscribed to topic successfully${NC}"
    echo "Response: $body"
else
    echo -e "${YELLOW}⚠ Topic subscription may have failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

# Test 4: Send to topic
echo ""
echo "Test 4: Send to Topic"
echo "---------------------"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$API_URL/api/firebase/notifications/send-to-topic" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"topic\": \"test-topic\",
    \"title\": \"Topic Notification\",
    \"body\": \"This is a test topic notification\",
    \"data\": {
      \"type\": \"topic-test\"
    }
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Topic notification sent successfully${NC}"
    echo "Response: $body"
else
    echo -e "${YELLOW}⚠ Topic notification may have failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

# Test 5: Get notifications
echo ""
echo "Test 5: Get User Notifications"
echo "-------------------------------"

response=$(curl -s -w "\n%{http_code}" -X GET \
  "$API_URL/api/firebase/notifications?limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Retrieved notifications successfully${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Failed to get notifications (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

# Summary
echo ""
echo "===================================="
echo "Test Summary"
echo "===================================="
echo ""
echo "Tests completed. Check the responses above for details."
echo ""
echo "To test on a real device:"
echo "1. Install the mobile app on your device"
echo "2. Register for push permissions"
echo "3. The app will register its FCM token"
echo "4. Use this script to send notifications"
echo ""
echo "For more testing options, see:"
echo "  FIREBASE_QUICK_REFERENCE.md"
