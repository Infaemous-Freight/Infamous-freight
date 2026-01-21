/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Request Validation Middleware
 */

const { body, param, query, validationResult } = require("express-validator");

function validateString(field, opts = {}) {
  return body(field)
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .notEmpty()
    .withMessage(`${field} must not be empty`)
    .trim()
    .isLength({ max: opts.maxLength || 1000 })
    .withMessage(`${field} too long`);
}

function validateEmail(field = "email") {
  return body(field).isEmail().withMessage("Invalid email").normalizeEmail();
}

function validatePhone(field = "phone") {
  return body(field).isMobilePhone("any").withMessage("Invalid phone number");
}

function validateUUID(field = "id") {
  return param(field).isUUID().withMessage("Invalid UUID");
}

// Validate UUID present in body payload
function validateUUIDBody(field = "id") {
  return body(field).isUUID().withMessage("Invalid UUID");
}

// Validate enum values against an allowed set (pass array from shared)
function validateEnum(field, allowed) {
  return body(field)
    .custom((value) => allowed.includes(value))
    .withMessage(`${field} must be one of: ${Array.isArray(allowed) ? allowed.join(", ") : allowed}`);
}

// Common pagination query validators
function validatePaginationQuery({ page = "page", pageSize = "pageSize", maxPageSize = 100 } = {}) {
  return [
    query(page)
      .optional()
      .isInt({ min: 1 })
      .withMessage(`${page} must be a positive integer`),
    query(pageSize)
      .optional()
      .isInt({ min: 1, max: maxPageSize })
      .withMessage(`${pageSize} must be between 1 and ${maxPageSize}`),
  ];
}

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    error: "Validation failed",
    details: errors
      .array()
      .map((e) => ({ field: e.path || e.param, msg: e.msg })),
  });
}

module.exports = {
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  validateUUIDBody,
  validateEnum,
  validatePaginationQuery,
  handleValidationErrors,
};
