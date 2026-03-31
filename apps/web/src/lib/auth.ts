export function getDemoAuth() {
  return {
    token: process.env.NEXT_PUBLIC_DEMO_JWT ?? "PASTE_A_JWT_HERE",
    tenantId: process.env.NEXT_PUBLIC_DEMO_TENANT ?? "PASTE_TENANT_ID_HERE",
  };
}

type DemoUser = { uid: string; email?: string | null };

export async function loginWithEmail(email: string, _password: string): Promise<DemoUser> {
  if (!email) {
    throw new Error("Email is required");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("if_demo_user", email);
  }

  return { uid: email, email };
}

export async function registerWithEmail(email: string, password: string): Promise<DemoUser> {
  return loginWithEmail(email, password);
}

export function observeAuthState(callback: (user: DemoUser | null) => void): () => void {
  if (typeof window === "undefined") {
    callback(null);
    return () => {};
  }

  const email = localStorage.getItem("if_demo_user");
  callback(email ? { uid: email, email } : null);
  return () => {};
}
