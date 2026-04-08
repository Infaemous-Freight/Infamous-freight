import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export function getDemoAuth() {
  return {
    token: process.env.NEXT_PUBLIC_DEMO_JWT ?? "PASTE_A_JWT_HERE",
    tenantId: process.env.NEXT_PUBLIC_DEMO_TENANT ?? "PASTE_TENANT_ID_HERE",
  };
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!auth) {
    throw new Error("Firebase auth is not configured");
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  if (!auth) {
    throw new Error("Firebase auth is not configured");
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export function observeAuthState(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
