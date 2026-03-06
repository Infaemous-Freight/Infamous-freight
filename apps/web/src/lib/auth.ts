export function getDemoAuth() {
  return {
    token: process.env.NEXT_PUBLIC_DEMO_JWT ?? "PASTE_A_JWT_HERE",
    tenantId: process.env.NEXT_PUBLIC_DEMO_TENANT ?? "PASTE_TENANT_ID_HERE"
  };
}
