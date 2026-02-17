#!/bin/bash
# Firebase Production Setup Script
# Automates Firebase project setup and configuration

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔥 Firebase Production Setup${NC}"
echo "=================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}✗ Firebase CLI not found${NC}"
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
    echo -e "${GREEN}✓ Firebase CLI installed${NC}"
else
    echo -e "${GREEN}✓ Firebase CLI found${NC}"
fi

# Check if user is logged in
echo ""
echo "Checking Firebase authentication..."
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✓ Already logged in to Firebase${NC}"
else
    echo -e "${YELLOW}⚠ Not logged in to Firebase${NC}"
    echo "Opening browser for authentication..."
    firebase login
fi

# Prompt for project creation or selection
echo ""
echo "=================================="
echo "Firebase Project Setup"
echo "=================================="
echo ""
echo "Choose an option:"
echo "1) Create new Firebase project"
echo "2) Use existing Firebase project"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    read -p "Enter project ID (e.g., infamous-freight-prod): " PROJECT_ID
    read -p "Enter project display name (e.g., Infamous Freight Production): " PROJECT_NAME
    
    echo ""
    echo "Creating Firebase project: $PROJECT_ID..."
    
    # Note: Firebase project creation via CLI is limited
    # User must create project in console first
    echo -e "${YELLOW}⚠ Please create the project in Firebase Console first:${NC}"
    echo "   https://console.firebase.google.com/"
    echo ""
    echo "Steps:"
    echo "1. Click 'Add Project'"
    echo "2. Name: $PROJECT_NAME"
    echo "3. Project ID: $PROJECT_ID"
    echo "4. Enable Google Analytics (optional)"
    echo ""
    read -p "Press Enter when project is created..."
    
elif [ "$choice" == "2" ]; then
    echo ""
    echo "Available projects:"
    firebase projects:list
    echo ""
    read -p "Enter project ID: " PROJECT_ID
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

# Set active project
echo ""
echo "Setting active project to: $PROJECT_ID"
firebase use "$PROJECT_ID"
echo -e "${GREEN}✓ Active project set${NC}"

# Update .firebaserc with project
echo ""
echo "Updating .firebaserc..."
cat > .firebaserc <<EOF
{
  "projects": {
    "default": "$PROJECT_ID",
    "production": "$PROJECT_ID"
  }
}
EOF
echo -e "${GREEN}✓ .firebaserc updated${NC}"

# Enable required Firebase services
echo ""
echo "=================================="
echo "Enabling Firebase Services"
echo "=================================="
echo ""
echo "Please enable the following services in Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "Required Services:"
echo "  ✓ Authentication (Email/Password, Google)"
echo "  ✓ Cloud Firestore (Production mode)"
echo "  ✓ Cloud Storage"
echo "  ✓ Cloud Messaging"
echo ""
read -p "Press Enter when services are enabled..."

# Deploy security rules
echo ""
echo "=================================="
echo "Deploying Security Rules"
echo "=================================="
echo ""
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules --project "$PROJECT_ID"
echo ""
echo "Deploying Storage rules..."
firebase deploy --only storage:rules --project "$PROJECT_ID"
echo ""
echo "Deploying Firestore indexes..."
firebase deploy --only firestore:indexes --project "$PROJECT_ID"
echo ""
echo -e "${GREEN}✓ Security rules deployed${NC}"

# Download service account key
echo ""
echo "=================================="
echo "Service Account Setup"
echo "=================================="
echo ""
echo "To download service account key:"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/serviceaccounts/adminsdk"
echo "2. Click 'Generate New Private Key'"
echo "3. Save as: firebase-service-account.json"
echo "4. Move to project root directory"
echo ""
read -p "Have you downloaded the service account key? (y/n): " downloaded

if [ "$downloaded" == "y" ]; then
    if [ -f "firebase-service-account.json" ]; then
        echo -e "${GREEN}✓ Service account key found${NC}"
        
        # Update .env
        if [ -f ".env" ]; then
            echo ""
            echo "Updating .env with Firebase configuration..."
            
            # Add Firebase project ID
            if ! grep -q "^FIREBASE_PROJECT_ID=" .env; then
                echo "FIREBASE_PROJECT_ID=$PROJECT_ID" >> .env
            else
                sed -i "s/^FIREBASE_PROJECT_ID=.*/FIREBASE_PROJECT_ID=$PROJECT_ID/" .env
            fi
            
            # Add service account path
            if ! grep -q "^FIREBASE_SERVICE_ACCOUNT_PATH=" .env; then
                echo "FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json" >> .env
            fi
            
            echo -e "${GREEN}✓ .env updated${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Service account key not found in project root${NC}"
    fi
fi

# Setup mobile app configuration
echo ""
echo "=================================="
echo "Mobile App Configuration"
echo "=================================="
echo ""
echo "iOS Setup:"
echo "----------"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
echo "2. Click 'Add app' → iOS"
echo "3. Bundle ID: com.infamousfreight.app"
echo "4. Download GoogleService-Info.plist"
echo "5. Save to: apps/mobile/GoogleService-Info.plist"
echo ""
read -p "Is iOS configured? (y/n): " ios_done

if [ "$ios_done" == "y" ]; then
    if [ -f "apps/mobile/GoogleService-Info.plist" ]; then
        echo -e "${GREEN}✓ iOS configuration found${NC}"
    else
        echo -e "${YELLOW}⚠ GoogleService-Info.plist not found${NC}"
    fi
fi

echo ""
echo "Android Setup:"
echo "--------------"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
echo "2. Click 'Add app' → Android"
echo "3. Package name: com.infamousfreight.app"
echo "4. Download google-services.json"
echo "5. Save to: apps/mobile/google-services.json"
echo ""
read -p "Is Android configured? (y/n): " android_done

if [ "$android_done" == "y" ]; then
    if [ -f "apps/mobile/google-services.json" ]; then
        echo -e "${GREEN}✓ Android configuration found${NC}"
    else
        echo -e "${YELLOW}⚠ google-services.json not found${NC}"
    fi
fi

# Web Push (VAPID) setup
echo ""
echo "Web Push Configuration:"
echo "----------------------"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/cloudmessaging"
echo "2. Scroll to 'Web Push certificates'"
echo "3. Click 'Generate Key Pair'"
echo "4. Copy the key"
echo ""
read -p "Enter VAPID key (or press Enter to skip): " vapid_key

if [ -n "$vapid_key" ]; then
    if [ -f "apps/mobile/.env" ]; then
        echo "FIREBASE_VAPID_KEY=$vapid_key" >> apps/mobile/.env
        echo -e "${GREEN}✓ VAPID key added to apps/mobile/.env${NC}"
    fi
fi

# Test Firebase connection
echo ""
echo "=================================="
echo "Testing Firebase Connection"
echo "=================================="
echo ""
echo "Running connection test..."

# Create a simple test script
cat > /tmp/firebase-test.js <<'EOF'
const admin = require('firebase-admin');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.collection('_test').add({ test: true, timestamp: new Date() })
  .then(() => {
    console.log('✓ Firestore connection successful');
    return db.collection('_test').limit(1).get();
  })
  .then(() => {
    console.log('✓ Firestore read successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  });
EOF

if [ -f "firebase-service-account.json" ]; then
    cd apps/api && node /tmp/firebase-test.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Firebase connection test passed${NC}"
    else
        echo -e "${RED}✗ Firebase connection test failed${NC}"
    fi
    cd ../..
fi

rm -f /tmp/firebase-test.js

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✓ Firebase Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Project: $PROJECT_ID"
echo ""
echo "Next steps:"
echo "1. Configure iOS APNs certificates (for iOS push notifications)"
echo "2. Test push notifications: ./scripts/test-firebase-notifications.sh"
echo "3. Set up monitoring: ./scripts/setup-firebase-monitoring.sh"
echo "4. Deploy your application"
echo ""
echo "Documentation:"
echo "- Complete guide: FIREBASE_100_COMPLETE.md"
echo "- Quick reference: FIREBASE_QUICK_REFERENCE.md"
echo ""
echo -e "${GREEN}🚀 Ready for production deployment!${NC}"
