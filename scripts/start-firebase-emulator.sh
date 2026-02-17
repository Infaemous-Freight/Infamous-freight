#!/bin/bash
# Firebase Emulator for Local Development
# Starts all Firebase services locally for testing

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔥 Starting Firebase Emulators${NC}"
echo "================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Create emulator data directory
mkdir -p .firebase/emulator-data

# Check if emulators are already running
if lsof -i:4000 &> /dev/null; then
    echo -e "${YELLOW}⚠ Emulators already running on port 4000${NC}"
    read -p "Kill existing emulators and restart? (y/n): " kill_existing
    
    if [ "$kill_existing" == "y" ]; then
        echo "Killing existing emulators..."
        lsof -ti:4000 | xargs kill -9 2>/dev/null || true
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
        lsof -ti:9099 | xargs kill -9 2>/dev/null || true
        lsof -ti:9199 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        exit 0
    fi
fi

# Configuration
echo "Emulator Configuration:"
echo "  • Firestore: http://localhost:8080"
echo "  • Authentication: http://localhost:9099"
echo "  • Storage: http://localhost:9199"
echo "  • Hosting: http://localhost:5000"
echo "  • Emulator UI: http://localhost:4000"
echo ""

# Export emulator environment variables
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
export FIREBASE_STORAGE_EMULATOR_HOST="localhost:9199"

# Create demo data script
cat > /tmp/firebase-demo-data.js <<'EOF'
// Demo data for Firebase emulator
const admin = require('firebase-admin');

// Initialize with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({ projectId: 'demo-project' });

const db = admin.firestore();
const auth = admin.auth();

async function seedData() {
  console.log('Seeding demo data...');
  
  // Create demo users
  const users = [
    { email: 'driver@test.com', password: 'test123', role: 'driver' },
    { email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { email: 'operator@test.com', password: 'operator123', role: 'operator' }
  ];
  
  for (const user of users) {
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        emailVerified: true
      });
      
      await db.collection('users').doc(userRecord.uid).set({
        email: user.email,
        role: user.role,
        createdAt: new Date()
      });
      
      console.log(`✓ Created user: ${user.email}`);
    } catch (error) {
      console.log(`User ${user.email} already exists`);
    }
  }
  
  // Create demo shipments
  const shipments = [
    {
      origin: 'Los Angeles, CA',
      destination: 'New York, NY',
      status: 'pending',
      driverId: null,
      createdAt: new Date()
    },
    {
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      status: 'in_transit',
      driverId: 'demo-driver-1',
      createdAt: new Date()
    }
  ];
  
  for (const shipment of shipments) {
    await db.collection('shipments').add(shipment);
  }
  console.log('✓ Created demo shipments');
  
  // Create demo notifications
  await db.collection('notifications').add({
    userId: 'demo-user',
    title: 'Welcome to Firebase',
    body: 'This is a demo notification',
    read: false,
    createdAt: new Date()
  });
  console.log('✓ Created demo notifications');
  
  console.log('\nDemo data seeding complete!');
  process.exit(0);
}

seedData().catch(console.error);
EOF

# Start emulators
echo -e "${GREEN}Starting emulators...${NC}"
echo ""
echo "Emulator UI will open at: http://localhost:4000"
echo ""
echo "To use with your app, set these environment variables:"
echo "  export FIRESTORE_EMULATOR_HOST='localhost:8080'"
echo "  export FIREBASE_AUTH_EMULATOR_HOST='localhost:9099'"
echo "  export FIREBASE_STORAGE_EMULATOR_HOST='localhost:9199'"
echo ""
echo "Press Ctrl+C to stop emulators"
echo ""

# Option to seed demo data
read -p "Seed demo data? (y/n): " seed_data

if [ "$seed_data" == "y" ]; then
    # Start emulators in background
    firebase emulators:start --import=.firebase/emulator-data &
    EMULATOR_PID=$!
    
    # Wait for emulators to start
    echo "Waiting for emulators to start..."
    sleep 10
    
    # Seed data
    cd apps/api && node /tmp/firebase-demo-data.js
    cd ../..
    
    # Bring emulators to foreground
    fg
else
    # Start emulators with data import
    if [ -d ".firebase/emulator-data" ] && [ "$(ls -A .firebase/emulator-data)" ]; then
        firebase emulators:start --import=.firebase/emulator-data --export-on-exit
    else
        firebase emulators:start --export-on-exit=.firebase/emulator-data
    fi
fi

# Cleanup
rm -f /tmp/firebase-demo-data.js
