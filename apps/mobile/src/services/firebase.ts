/**
 * Firebase Configuration for Mobile App
 * Provides Firebase SDK initialization and services
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import Constants from "expo-constants";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebase?.apiKey || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebase?.authDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebase?.projectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket:
    Constants.expoConfig?.extra?.firebase?.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    Constants.expoConfig?.extra?.firebase?.messagingSenderId ||
    process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebase?.appId || process.env.FIREBASE_APP_ID,
  measurementId:
    Constants.expoConfig?.extra?.firebase?.measurementId || process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (only once)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} else {
  app = getApps()[0];
  console.log("Firebase already initialized");
}

// Get Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Cloud Messaging (web only, for push notifications)
export const getMessagingInstance = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  console.log("Firebase Messaging not supported in this environment");
  return null;
};

export default app;
