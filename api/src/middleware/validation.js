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
  handleValidationErrors,
};
