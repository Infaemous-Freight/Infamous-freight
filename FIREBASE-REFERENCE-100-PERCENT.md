# 🔥 Firebase Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (select Firestore, Storage, Hosting, Functions)
firebase init

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting

# Start local emulators
firebase emulators:start

# Use specific project
firebase use infamous-freight-prod
firebase use infamous-freight-dev
firebase use infamous-freight-staging
```

## 📱 Mobile App Setup

### iOS
1. Add app in Firebase Console → iOS
2. Download `GoogleService-Info.plist`
3. Place in: `apps/mobile/GoogleService-Info.plist`
4. Update `ios` section in `apps/mobile/app.json`:
   ```json
   "googleServicesFile": "./GoogleService-Info.plist"
   ```

### Android
1. Add app in Firebase Console → Android
2. Download `google-services.json`
3. Place in: `apps/mobile/google-services.json`
4. Update `android` section in `apps/mobile/app.json`:
   ```json
   "googleServicesFile": "./google-services.json"
   ```

## 🔑 Environment Variables

### Backend (.env)
```bash
FIREBASE_PROJECT_ID=infamous-freight-prod
FIREBASE_STORAGE_BUCKET=infamous-freight-prod.appspot.com
FIREBASE_DATABASE_URL=https://infamous-freight-prod-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
# OR use file path:
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Mobile (apps/mobile/.env)
```bash
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=infamous-freight-prod.firebaseapp.com
FIREBASE_PROJECT_ID=infamous-freight-prod
FIREBASE_STORAGE_BUCKET=infamous-freight-prod.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
FIREBASE_VAPID_KEY=BNXXXXXXXXxxxxxx...
EXPO_PROJECT_ID=your-expo-project-id-here
```

## 🔥 API Endpoints

**Base URL**: `/api/firebase/notifications`

### Register Device Token
```bash
POST /register-token
Headers: Authorization: Bearer <JWT>
Body: {
  "token": "fcm-device-token",
  "platform": "ios" | "android" | "web"
}
```

### Send Notification
```bash
POST /send
Headers: Authorization: Bearer <JWT>
Body: {
  "userIds": ["user-uuid-1", "user-uuid-2"],
  "title": "Shipment Update",
  "body": "Your shipment has arrived",
  "data": { "shipmentId": "123", "type": "delivery" }
}
```

### Send to Topic
```bash
POST /send-to-topic
Headers: Authorization: Bearer <JWT>
Body: {
  "topic": "drivers",
  "title": "New Load Available",
  "body": "High-paying load in your area",
  "data": { "loadId": "456" }
}
```

### Subscribe to Topic
```bash
POST /subscribe-topic
Headers: Authorization: Bearer <JWT>
Body: {
  "tokens": ["token1", "token2"],
  "topic": "drivers"
}
```

### Get Notifications
```bash
GET /
Headers: Authorization: Bearer <JWT>
Query: ?limit=50
```

### Mark as Read
```bash
PATCH /:id/read
Headers: Authorization: Bearer <JWT>
```

## 📦 Code Snippets

### Backend: Send Push Notification
```javascript
const firebaseAdmin = require('./services/firebaseAdmin');

// Send to single device
await firebaseAdmin.sendPushNotification(
  'device-token',
  {
    title: 'Shipment Update',
    body: 'Your package has been delivered'
  },
  { shipmentId: '123', action: 'delivered' }
);

// Send to multiple devices
await firebaseAdmin.sendMulticastNotification(
  ['token1', 'token2', 'token3'],
  {
    title: 'New Feature Available',
    body: 'Check out our latest update'
  }
);

// Send to topic
await firebaseAdmin.sendToTopic(
  'drivers',
  {
    title: 'New Load Available',
    body: 'High-paying load in your area'
  }
);
```

### Backend: Firestore Operations
```javascript
const db = firebaseAdmin.getFirestore();

// Create document
await db.collection('shipments').add({
  origin: 'Los Angeles',
  destination: 'New York',
  status: 'pending',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});

// Read document
const doc = await db.collection('shipments').doc('shipment-id').get();
const data = doc.data();

// Update document
await db.collection('shipments').doc('shipment-id').update({
  status: 'in_transit',
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});

// Query collection
const snapshot = await db.collection('shipments')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

const shipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Mobile: Initialize Firebase
```typescript
import { pushNotifications } from './services/pushNotifications';
import app from './services/firebase';

// Initialize push notifications
const tokens = await pushNotifications.initialize();
console.log('Expo Token:', tokens.expoPushToken);
console.log('FCM Token:', tokens.fcmToken);

// Register with backend
await pushNotifications.registerToken(apiClient);

// Setup notification listener
pushNotifications.setupNotificationListener((notification) => {
  console.log('Notification received:', notification);
});

// Setup tap handler
pushNotifications.setupNotificationResponseListener((response) => {
  console.log('Notification tapped:', response);
  // Navigate to specific screen based on notification data
});
```

### Mobile: Manual Firebase Usage
```typescript
import { firestore, storage, auth } from './services/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firestore: Add document
const docRef = await addDoc(collection(firestore, 'shipments'), {
  origin: 'Los Angeles',
  destination: 'New York',
  createdAt: new Date()
});

// Firestore: Query
const q = query(
  collection(firestore, 'shipments'),
  where('status', '==', 'pending')
);
const snapshot = await getDocs(q);
const shipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Storage: Upload file
const storageRef = ref(storage, 'images/profile.jpg');
await uploadBytes(storageRef, fileBlob);
const url = await getDownloadURL(storageRef);
```

## 🔒 Security Rules Examples

### Firestore Rules
```javascript
// Allow read if authenticated
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// Role-based access
match /shipments/{shipmentId} {
  allow read: if request.auth != null;
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Storage Rules
```javascript
// User-specific uploads
match /users/{userId}/profile/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId 
              && request.resource.size < 5 * 1024 * 1024
              && request.resource.contentType.matches('image/.*');
}
```

## 🧪 Testing

### Test with cURL
```bash
# Test notification endpoint
curl -X POST http://localhost:4000/api/firebase/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["test-user-id"],
    "title": "Test",
    "body": "Test notification",
    "data": { "test": true }
  }'
```

### Test with Firebase Emulator
```bash
# Start emulator
firebase emulators:start

# Emulator UI at http://localhost:4000
# Firestore: http://localhost:8080
# Functions: http://localhost:5001
```

## 📊 Monitoring

### Firebase Console URLs
- **Project Overview**: https://console.firebase.google.com/project/infamous-freight-prod
- **Authentication**: .../authentication/users
- **Firestore**: .../firestore/data
- **Storage**: .../storage
- **Cloud Messaging**: .../notification
- **Analytics**: .../analytics

### Check Quotas
```bash
firebase projects:list
firebase apps:list
```

## 🐛 Troubleshooting

### Common Commands
```bash
# Clear emulator data
firebase emulators:export ./emulator-data
firebase emulators:start --import=./emulator-data

# Test security rules
firebase emulators:start --only firestore
# Then use Rules Playground in Emulator UI

# Debug authentication
firebase auth:export users.json
firebase auth:import users.json
```

### Reset Token
```javascript
// Mobile app
import { pushNotifications } from './services/pushNotifications';

// Get fresh token
await pushNotifications.getExpoPushToken();
await pushNotifications.getFCMToken();
```

## 💡 Pro Tips

1. **Use Emulators for Development**
   - Free, instant, no quota limits
   - Test offline
   - Fast iteration

2. **Batch Firestore Operations**
   ```javascript
   const batch = db.batch();
   batch.set(doc1, data1);
   batch.update(doc2, data2);
   batch.delete(doc3);
   await batch.commit(); // Single operation
   ```

3. **Cache Firestore Reads**
   ```javascript
   // Enable persistence
   firebase.firestore().enablePersistence();
   ```

4. **Compress Images Before Upload**
   ```javascript
   import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
   
   const compressed = await manipulateAsync(
     uri,
     [{ resize: { width: 800 } }],
     { compress: 0.7, format: SaveFormat.JPEG }
   );
   ```

5. **Use Topics Instead of Individual Tokens**
   - More efficient for broadcasting
   - No need to manage token lists
   - Automatic retry logic

---

**Quick Links**:
- [Full Documentation](FIREBASE_100_COMPLETE.md)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Docs](https://firebase.google.com/docs)
