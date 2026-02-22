/**
 * Type Safety Utilities
 * Helper functions and type guards for improved type safety
 *
 * @module lib/typeUtils
 */

/**
 * Type guard for Express Request with user context
 */
export interface AuthenticatedRequest {
  user?: {
    sub: string;
    email?: string;
    role?: string;
  };
  auth?: {
    organizationId?: string;
    scopes?: string[];
  };
  correlationId?: string;
}

/**
 * Type guard: Check if user is authenticated
 */
export function isAuthenticated(req: AuthenticatedRequest): req is AuthenticatedRequest & {
  user: { sub: string };
} {
  return !!req.user?.sub;
}

/**
 * Type guard: Check if user has scope
 */
export function hasScope(req: AuthenticatedRequest, scope: string): boolean {
  return (req.auth?.scopes || []).includes(scope);
}

/**
 * Type guard for API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  errorCode?: string;
}

/**
 * Type guard: Check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}

/**
 * Type guard for pagination query
 */
export interface PaginationQuery {
  skip?: number;
  take?: number;
  page?: number;
  perPage?: number;
}

/**
 * Parse pagination from query
 */
export function parsePaginationQuery(query: Record<string, any>): {
  skip: number;
  take: number;
} {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const perPage = Math.min(Math.max(parseInt(query.perPage || "20", 10), 1), 100);

  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

/**
 * Type guard for sorting options
 */
export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Parse sort from query
 */
export function parseSortQuery(query: Record<string, any>): SortOption | null {
  const sortBy = query.sortBy as string;
  const sortOrder = (query.sortOrder as string)?.toLowerCase();

  if (!sortBy) return null;

  return {
    field: sortBy,
    direction: sortOrder === "desc" ? "desc" : "asc",
  };
}

/**
 * Type-safe shipment status validation
 */
export const VALID_SHIPMENT_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;

export type ShipmentStatus = (typeof VALID_SHIPMENT_STATUSES)[number];

export function isValidShipmentStatus(status: string): status is ShipmentStatus {
  return VALID_SHIPMENT_STATUSES.includes(status as ShipmentStatus);
}

/**
 * Type-safe driver status validation
 */
export const VALID_DRIVER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "OFFLINE",
  "ONLINE",
] as const;

export type DriverStatus = (typeof VALID_DRIVER_STATUSES)[number];

export function isValidDriverStatus(status: string): status is DriverStatus {
  return VALID_DRIVER_STATUSES.includes(status as DriverStatus);
}

/**
 * Type-safe optional field handler
 * Safely handle optional fields that might be undefined
 */
export function getOptionalField<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K],
): T[K] | undefined {
  return obj?.[key] ?? defaultValue;
}

/**
 * Type-safe object getter with nested access
 * Safely access nested properties with type checking
 */
export function safeGet<T = any>(
  obj: Record<string, any> | null | undefined,
  path: string,
  defaultValue?: T,
): T | undefined {
  if (!obj) return defaultValue;

  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    current = current?.[key];
    if (current === null || current === undefined) {
      return defaultValue;
    }
  }

  return current as T;
}

/**
 * Type-safe object pick
 * Select specific keys from object with type safety
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Type-safe object omit
 * Exclude specific keys from object with type safety
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * Coerce value to expected type
 * Helper for converting incoming request data to typed values
 */
export function coerce<T>(value: any, type: "string" | "number" | "boolean"): T {
  switch (type) {
    case "string":
      return String(value) as T;
    case "number":
      return Number(value) as T;
    case "boolean":
      return (value === "true" || value === true || value === 1) as T;
    default:
      return value as T;
  }
}

/**
 * Validate required fields in object
 */
export function validateRequired<T extends Record<string, any>>(
  obj: T,
  ...fields: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing = fields.filter((field) => !obj[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
}
