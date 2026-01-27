/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Application Constants
 */

/**
 * Rate Limiting Constants
 */
const RATE_LIMITS = {
  VOICE: {
    MAX_FILE_SIZE_MB: 10,
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 60,
  },
  TRACKING: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 60,
  },
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  AI: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 20,
  },
  BILLING: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 30,
  },
};

/**
 * Pagination Constants
 */
const PAGINATION = {
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: 100,
};

/**
 * Geographic Bounds
 */
const GEO_BOUNDS = {
  LATITUDE: {
    MIN: -90,
    MAX: 90,
  },
  LONGITUDE: {
    MIN: -180,
    MAX: 180,
  },
};

/**
 * Feedback System Constants
 */
const FEEDBACK = {
  ID_PREFIX: 'fb_',
  ID_SUBSTRING_START: 9,
  MAX_LENGTH: 5000,
  CRITICAL_RATING_THRESHOLD: 2, // Ratings <= 2 are critical
};

/**
 * Bonuses & Referrals
 */
const BONUSES = {
  REFERRAL_CODE_PREFIX: 'REF-',
  REFERRAL_EXPIRY_MS: 365 * 24 * 60 * 60 * 1000, // 1 year
};

/**
 * Analytics Constants
 */
const ANALYTICS = {
  DEFAULT_FORECAST_MONTHS: 3,
};

/**
 * Metrics & Caching
 */
const METRICS = {
  CACHE_TTL_MS: 60000, // 1 minute
};

/**
 * Shipment Priorities
 */
const SHIPMENT_PRIORITIES = ['low', 'standard', 'high', 'urgent'];

/**
 * Shipment Statuses
 */
const SHIPMENT_STATUSES = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 */
const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  INTERNAL_ERROR: 'An internal error occurred',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_COORDINATES: 'Invalid geographic coordinates',
};

/**
 * Validation Constants
 */
const VALIDATION = {
  EMAIL_MAX_LENGTH: 320, // RFC 5321
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

/**
 * File Upload Constants
 */
const FILE_UPLOAD = {
  VOICE: {
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
    ALLOWED_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  },
  DOCUMENT: {
    MAX_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  },
};

module.exports = {
  RATE_LIMITS,
  PAGINATION,
  GEO_BOUNDS,
  FEEDBACK,
  BONUSES,
  ANALYTICS,
  METRICS,
  SHIPMENT_PRIORITIES,
  SHIPMENT_STATUSES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  VALIDATION,
  FILE_UPLOAD,
};
