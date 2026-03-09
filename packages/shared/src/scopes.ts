/**
 * Scope Validation System
 * Defines and validates JWT scopes for authorization
 *
 * Usage:
 * import { VALID_SCOPES, validateScope } from '@infamous/shared';
 *
 * In route:
 * router.get('/admin/stats', requireScope('admin:read'), handler);
 */

// Core scope categories
export const SCOPE_CATEGORIES = {
  // User scopes (personal data access)
  USER: {
    PROFILE_READ: "user:profile:read",
    PROFILE_WRITE: "user:profile:write",
    AVATAR_READ: "user:avatar:read",
    AVATAR_WRITE: "user:avatar:write",
    SETTINGS_READ: "user:settings:read",
    SETTINGS_WRITE: "user:settings:write",
  },

  // Shipment scopes (core business logic)
  SHIPMENT: {
    READ: "shipment:read",
    CREATE: "shipment:create",
    UPDATE: "shipment:update",
    DELETE: "shipment:delete",
    TRACK: "shipment:track",
    EXPORT: "shipment:export",
    RATE: "shipment:rate",
  },

  // Shipments scopes (plural form - used in some routes)
  SHIPMENTS: {
    READ: "shipments:read",
    WRITE: "shipments:write",
  },

  // Billing & Payment scopes
  BILLING: {
    READ: "billing:read",
    WRITE: "billing:write",
    CHARGE: "billing:charge",
    REFUND: "billing:refund",
    INVOICE_READ: "billing:invoice:read",
    INVOICE_WRITE: "billing:invoice:write",
    PAYMENT: "billing:payment",
    ADMIN: "billing:admin",
    SUBSCRIBE: "billing:subscribe",
  },

  // AI & ML features
  AI: {
    COMMAND: "ai:command",
    PREDICT: "ai:predict",
    TRAIN: "ai:train",
    HISTORY: "ai:history",
    VIEW: "ai:view",
    ADVANCED_ML: "ai:advanced_ml",
    PREDICTION: "ai:prediction",
    FORECASTING: "ai:forecasting",
    FRAUD: "ai:fraud",
  },

  // Analytics & Intelligence (Phase 11)
  ANALYTICS: {
    READ: "analytics:read",
    WRITE: "analytics:write",
    COHORT: "analytics:cohort",
    PREDICT: "analytics:predict",
    REPORTS: "analytics:reports",
    REPORTS_SCHEDULE: "analytics:reports:schedule",
  },

  // Voice & Communication
  VOICE: {
    INGEST: "voice:ingest",
    COMMAND: "voice:command",
    TRANSCRIBE: "voice:transcribe",
  },

  // Organization management
  ORGANIZATION: {
    READ: "organization:read",
    WRITE: "organization:write",
    MEMBERS_READ: "organization:members:read",
    MEMBERS_WRITE: "organization:members:write",
    BILLING_READ: "organization:billing:read",
    BILLING_WRITE: "organization:billing:write",
    AUDIT_READ: "organization:audit:read",
  },

  // Admin scopes (superuser)
  ADMIN: {
    READ: "admin:read",
    WRITE: "admin:write",
    USERS_MANAGE: "admin:users:manage",
    FEATURES_MANAGE: "admin:features:manage",
    AUDIT_READ: "admin:audit:read",
    SYSTEM_READ: "admin:system:read",
    COMPLIANCE: "admin:compliance",
    REFERRALS: "admin:referrals",
    BLOCKCHAIN: "admin:blockchain",
    GEOFENCING: "admin:geofencing",
    RISK_ASSESSMENT: "admin:risk_assessment",
    ML_TRAINING: "admin:ml_training",
    WEBHOOKS: "admin:webhooks",
    DASHBOARD: "admin:dashboard",
    USERS: "admin:users",
    VIEW_ANALYTICS: "admin:view_analytics",
    RATINGS: "admin:ratings",
    MANAGE_PAYMENTS: "admin:manage_payments",
    OPS: "admin:ops",
  },

  // Role-based scopes (single word)
  ROLES: {
    ADMIN: "admin",
    DRIVER: "driver",
    SHIPPER: "shipper",
    SALES: "sales",
    MARKETING: "marketing",
  },

  // API token management
  TOKEN: {
    CREATE: "token:create",
    REVOKE: "token:revoke",
    LIST: "token:list",
  },

  // Integration & Webhooks
  INTEGRATION: {
    READ: "integration:read",
    WRITE: "integration:write",
    WEBHOOK_MANAGE: "integration:webhook:manage",
  },

  // Tracking scopes
  TRACKING: {
    UPDATE: "tracking:update",
    VIEW: "tracking:view",
    GEOFENCE: "tracking:geofence",
  },

  // Signoff/Digital signature scopes
  SIGNOFF: {
    CREATE: "signoff:create",
    READ: "signoff:read",
    SIGN: "signoff:sign",
    MANAGE: "signoff:manage",
  },

  // Recommendations & Route optimization
  RECOMMENDATIONS: {
    VIEW: "recommendations:view",
    UPDATE: "recommendations:update",
  },

  // Insurance & Claims
  INSURANCE: {
    CLAIMS: "insurance:claims",
    READ: "insurance:read",
  },

  // Driver scopes
  DRIVER: {
    DOCUMENTS: "driver:documents",
    LOCATION: "driver:location",
    MANAGE_PAYMENTS: "driver:manage_payments",
    VIEW_PARTNERSHIPS: "driver:view_partnerships",
    MANAGE_PARTNERSHIPS: "driver:manage_partnerships",
    VIEW_PAYMENTS: "driver:view_payments",
    STATUS: "driver:status",
  },

  // Compliance scopes
  COMPLIANCE: {
    WRITE: "compliance:write",
    READ: "compliance:read",
  },

  // Loadboard scopes
  LOADS: {
    SEARCH: "loads:search",
    READ: "loads:read",
    BID: "loads:bid",
  },

  // Bonus & Rewards scopes
  BONUS: {
    REFERRAL: "bonus:referral",
    LOYALTY: "bonus:loyalty",
    POINTS: "bonus:points",
    REDEEM: "bonus:redeem",
    MILESTONES: "bonus:milestones",
    PERFORMANCE: "bonus:performance",
    REPORT: "bonus:report",
  },

  // Geofencing scopes
  GEOFENCING: {
    READ: "geofencing:read",
  },

  // Location scopes
  LOCATION: {
    READ: "location:read",
  },

  // Fraud detection
  FRAUD: {
    DETECTION: "fraud:detection",
  },

  // Marketplace scopes
  MARKETPLACE: {
    READ: "marketplace:read",
    WRITE: "marketplace:write",
    OFFER: "marketplace:offer",
    MANAGE: "marketplace:manage",
  },

  // Dispatch scopes
  DISPATCH: {
    NOTIFICATIONS: "dispatch:notifications",
  },

  // Cryptocurrency & BNPL payments
  PAYMENTS: {
    CRYPTOCURRENCY: "payments:cryptocurrency",
    BNPL: "payments:bnpl",
  },

  // Webhooks management
  WEBHOOKS: {
    MANAGE: "webhooks:manage",
  },

  // User management scopes
  USERS: {
    READ: "users:read",
    WRITE: "users:write",
  },

  // Document processing scopes
  DOCUMENTS: {
    PROCESS: "documents:process",
    READ: "documents:read",
  },

  // Payment processing scopes
  PAYMENT: {
    PAYOUT: "payment:payout",
    BONUS: "payment:bonus",
    VIEW: "payment:view",
  },

  // Blockchain scopes
  BLOCKCHAIN: {
    WRITE: "blockchain:write",
    CONTRACTS: "blockchain:contracts",
    READ: "blockchain:read",
  },
};

// Flatten all scopes for validation
export const VALID_SCOPES = Object.values(SCOPE_CATEGORIES).reduce<string[]>(
  (acc, category) => [...acc, ...Object.values(category)],
  [],
);

/**
 * Validate scope exists in VALID_SCOPES
 * @param {string} scope - Scope to validate
 * @returns {boolean} True if scope is valid
 */
export function validateScope(scope: string): boolean {
  if (!scope || typeof scope !== "string") {
    return false;
  }

  return VALID_SCOPES.includes(scope);
}

/**
 * Validate multiple scopes
 * @param {string[]} scopes - Array of scopes to validate
 * @returns {{valid: boolean, invalid: string[]}}
 */
export function validateScopes(scopes: string[]): {
  valid: boolean;
  invalid: string[];
} {
  if (!Array.isArray(scopes)) {
    return { valid: false, invalid: [] };
  }

  const invalid = scopes.filter((scope) => !validateScope(scope));

  return {
    valid: invalid.length === 0,
    invalid,
  };
}

/**
 * Check if user has required scope
 * @param {string[]} userScopes - Array of scopes from JWT
 * @param {string | string[]} requiredScopes - Scope(s) required
 * @returns {boolean} True if user has at least one required scope
 */
export function hasScope(userScopes: string[], requiredScopes: string | string[]): boolean {
  if (!Array.isArray(userScopes)) {
    return false;
  }

  const required = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];

  return required.some((scope) => userScopes.includes(scope));
}

/**
 * Check if user has all required scopes
 * @param {string[]} userScopes - Array of scopes from JWT
 * @param {string[]} requiredScopes - Scopes all required
 * @returns {boolean} True if user has all required scopes
 */
export function hasAllScopes(userScopes: string[], requiredScopes: string[]): boolean {
  if (!Array.isArray(userScopes) || !Array.isArray(requiredScopes)) {
    return false;
  }

  return requiredScopes.every((scope) => userScopes.includes(scope));
}

/**
 * Get human-readable scope descriptions
 */
export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "user:profile:read": "Read your profile information",
  "user:profile:write": "Update your profile information",
  "user:avatar:read": "Read your avatar",
  "user:avatar:write": "Update your avatar",
  "shipment:read": "View shipments",
  "shipment:create": "Create shipments",
  "shipment:update": "Update shipments",
  "shipment:delete": "Delete shipments",
  "shipment:track": "Track shipments in real-time",
  "shipment:export": "Export shipment data",
  "billing:read": "View billing information",
  "billing:write": "Manage billing settings",
  "billing:charge": "Process charges",
  "analytics:read": "Read analytics data",
  "analytics:write": "Create or update analytics assets",
  "analytics:cohort": "Run cohort analysis",
  "analytics:predict": "Run predictive analytics",
  "analytics:reports": "Generate BI reports",
  "analytics:reports:schedule": "Schedule BI reports",
  "organization:members:write": "Manage organization members",
  "admin:write": "Administrative access (DANGEROUS)",
  "admin:users:manage": "Manage all users (DANGEROUS)",
};

/**
 * Get description for scope
 */
export function getScopeDescription(scope: string): string {
  return SCOPE_DESCRIPTIONS[scope] || scope;
}

/**
 * Define scope requirements for routes
 */
export const ROUTE_SCOPES: Record<string, string[]> = {
  // User routes
  "GET /api/users/me": ["user:profile:read"],
  "PATCH /api/users/me": ["user:profile:write"],
  "GET /api/users/me/shipments": ["shipment:read"],

  // Shipment routes
  "GET /api/shipments": ["shipment:read"],
  "GET /api/shipments/:id": ["shipment:read"],
  "POST /api/shipments": ["shipment:create"],
  "PATCH /api/shipments/:id": ["shipment:update"],
  "DELETE /api/shipments/:id": ["shipment:delete"],
  "POST /api/shipments/:id/track": ["shipment:track"],
  "POST /api/shipments/export": ["shipment:export"],

  // Billing routes
  "GET /api/billing/invoices": ["billing:read"],
  "POST /api/billing/charge": ["billing:charge"],

  // Admin routes
  "GET /api/admin/users": ["admin:read"],
  "POST /api/admin/features": ["admin:features:manage"],
};

/**
 * Check if route requires scope
 */
export function getRequiredScopes(method: string, path: string): string[] {
  const route = `${method} ${path}`;

  // Direct match
  if (ROUTE_SCOPES[route]) {
    return ROUTE_SCOPES[route];
  }

  // Wildcard match
  for (const [pattern, scopes] of Object.entries(ROUTE_SCOPES)) {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}$`);
    if (regex.test(route)) {
      return scopes;
    }
  }

  return [];
}
