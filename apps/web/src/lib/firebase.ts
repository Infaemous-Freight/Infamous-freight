import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const isBrowser = typeof window !== "undefined";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const hasFirebaseConfig =
  typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey.length > 0 &&
  typeof firebaseConfig.authDomain === "string" && firebaseConfig.authDomain.length > 0 &&
  typeof firebaseConfig.projectId === "string" && firebaseConfig.projectId.length > 0;

const app = isBrowser && hasFirebaseConfig ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export function requireAuth() {
  if (!auth) {
    throw new Error("Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  }
  return auth;
}

export function requireDb() {
  if (!db) {
    throw new Error("Firebase Firestore is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
  }
  return db;
}
