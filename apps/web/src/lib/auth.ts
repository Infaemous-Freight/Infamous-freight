import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export function getDemoAuth() {
  return {
    token: process.env.NEXT_PUBLIC_DEMO_JWT ?? "PASTE_A_JWT_HERE",
    tenantId: process.env.NEXT_PUBLIC_DEMO_TENANT ?? "PASTE_TENANT_ID_HERE"
  };
}

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
