/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Zod Validation Schemas
 */

const { z } = require('zod');
const { VALIDATION, GEO_BOUNDS, SHIPMENT_PRIORITIES, SHIPMENT_STATUSES } = require('../config/constants');

/**
 * Common Validation Schemas
 */

// UUID validation
const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(VALIDATION.EMAIL_MAX_LENGTH, `Email must not exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`);

// Phone validation
const phoneSchema = z
  .string()
  .min(VALIDATION.PHONE_MIN_LENGTH, `Phone must be at least ${VALIDATION.PHONE_MIN_LENGTH} characters`)
  .max(VALIDATION.PHONE_MAX_LENGTH, `Phone must not exceed ${VALIDATION.PHONE_MAX_LENGTH} characters`)
  .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone format');

// Coordinate validation
const latitudeSchema = z
  .number()
  .min(GEO_BOUNDS.LATITUDE.MIN, `Latitude must be >= ${GEO_BOUNDS.LATITUDE.MIN}`)
  .max(GEO_BOUNDS.LATITUDE.MAX, `Latitude must be <= ${GEO_BOUNDS.LATITUDE.MAX}`);

const longitudeSchema = z
  .number()
  .min(GEO_BOUNDS.LONGITUDE.MIN, `Longitude must be >= ${GEO_BOUNDS.LONGITUDE.MIN}`)
  .max(GEO_BOUNDS.LONGITUDE.MAX, `Longitude must be <= ${GEO_BOUNDS.LONGITUDE.MAX}`);

const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

// Date validation
const dateSchema = z.coerce.date();

// Pagination validation
const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Shipment Validation Schemas
 */

const shipmentStatusSchema = z.enum([
  SHIPMENT_STATUSES.PENDING,
  SHIPMENT_STATUSES.IN_TRANSIT,
  SHIPMENT_STATUSES.DELIVERED,
  SHIPMENT_STATUSES.CANCELLED,
  SHIPMENT_STATUSES.FAILED,
]);

/** @type {[string, ...string[]]} */
const SHIPMENT_PRIORITY_VALUES = SHIPMENT_PRIORITIES;

const shipmentPrioritySchema = z.enum(SHIPMENT_PRIORITY_VALUES);
const createShipmentSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number required'),
  origin: coordinatesSchema.optional(),
  destination: coordinatesSchema.optional(),
  weight: z.number().positive('Weight must be positive').optional(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  priority: shipmentPrioritySchema.default('standard'),
  description: z.string().max(1000).optional(),
});

const updateShipmentSchema = z.object({
  status: shipmentStatusSchema.optional(),
  priority: shipmentPrioritySchema.optional(),
  currentLocation: coordinatesSchema.optional(),
  estimatedDelivery: dateSchema.optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * User Validation Schemas
 */

const createUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  phone: phoneSchema.optional(),
  role: z.enum(['user', 'admin', 'driver']).default('user'),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

/**
 * Billing Validation Schemas
 */

const paymentMethodSchema = z.enum(['card', 'bank_transfer', 'paypal', 'stripe']);

const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);

const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: currencySchema.default('USD'),
  paymentMethod: paymentMethodSchema,
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
});

const refundSchema = z.object({
  paymentId: uuidSchema,
  amount: z.number().positive('Refund amount must be positive').optional(), // Optional for full refund
  reason: z.string().min(1, 'Refund reason required').max(500),
});

/**
 * Tracking Validation Schemas
 */

const updateLocationSchema = z.object({
  shipmentId: uuidSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  timestamp: dateSchema.optional(),
  accuracy: z.number().positive().optional(),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
});

/**
 * Voice Command Validation Schema
 */

const voiceCommandSchema = z.object({
  audioFormat: z.enum(['mp3', 'wav', 'ogg', 'webm']),
  duration: z.number().positive().max(300, 'Audio must be less than 5 minutes'),
  transcript: z.string().max(5000).optional(),
});

/**
 * Feedback Validation Schema
 */

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(5000, 'Comment must not exceed 5000 characters').optional(),
  category: z.enum(['service', 'delivery', 'product', 'support', 'other']).default('other'),
  shipmentId: uuidSchema.optional(),
});

/**
 * Admin Feature Flag Schema
 */

const featureFlagSchema = z.object({
  name: z.string().min(1, 'Feature flag name required').max(100),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  targetUsers: z.array(uuidSchema).optional(),
});

/**
 * Validation middleware factory
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

module.exports = {
  // Common schemas
  uuidSchema,
  emailSchema,
  phoneSchema,
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  dateSchema,
  paginationSchema,

  // Domain-specific schemas
  createShipmentSchema,
  updateShipmentSchema,
  createUserSchema,
  updateUserSchema,
  createPaymentSchema,
  refundSchema,
  updateLocationSchema,
  voiceCommandSchema,
  feedbackSchema,
  featureFlagSchema,

  // Validation middleware
  validateRequest,
};
