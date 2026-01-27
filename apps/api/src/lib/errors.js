/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Standardized Error Response Utilities
 */

const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

/**
 * Standard API Error class with proper structure
 */
class ApiError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Validation Error
 */
class ValidationError extends ApiError {
  constructor(message = ERROR_MESSAGES.VALIDATION_FAILED, details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error
 */
class AuthenticationError extends ApiError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
class AuthorizationError extends ApiError {
  constructor(message = ERROR_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends ApiError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND, resource = null) {
    super(message, HTTP_STATUS.NOT_FOUND, resource ? { resource } : null);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends ApiError {
  constructor(message = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, retryAfter = null) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, retryAfter ? { retryAfter } : null);
    this.name = 'RateLimitError';
  }
}

/**
 * Conflict Error
 */
class ConflictError extends ApiError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.CONFLICT, details);
    this.name = 'ConflictError';
  }
}

/**
 * Create standardized success response
 */
function createSuccessResponse(data = null, message = null, statusCode = HTTP_STATUS.OK) {
  return {
    success: true,
    ...(message && { message }),
    ...(data !== null && { data }),
    timestamp: new Date().toISOString(),
    statusCode,
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse(error, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
  // If error is already an ApiError, use its structure
  if (error instanceof ApiError) {
    return error.toJSON();
  }

  // Otherwise, create a generic error response
  return {
    error: {
      message: error.message || ERROR_MESSAGES.INTERNAL_ERROR,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Async handler wrapper to catch errors and pass to next()
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  // Error Classes
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ConflictError,
  
  // Response Utilities
  createSuccessResponse,
  createErrorResponse,
  asyncHandler,
};
