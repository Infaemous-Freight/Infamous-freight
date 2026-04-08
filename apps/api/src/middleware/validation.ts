import type { NextFunction, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";

type ValidationRule = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    error: "Validation failed",
    details: errors.array().map((err) => ({
      field: "path" in err ? err.path : "unknown",
      message: err.msg,
      value: "value" in err ? err.value : undefined,
    })),
  });
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  const sanitize = (obj: unknown): unknown => {
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (!obj || typeof obj !== "object") return obj;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === "string") {
        out[k] = v.trim().replace(/[<>]/g, "");
      } else {
        out[k] = sanitize(v);
      }
    }
    return out;
  };

  if (req.body) req.body = sanitize(req.body) as any;
  return next();
};

export const validate = (rules: ValidationRule[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const rule of rules) {
      await rule(req, res, () => undefined);
    }
    return handleValidationErrors(req, res, next);
  };
};

export const validateString = (field: string, min = 1, max = 255) =>
  body(field)
    .isString()
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be ${min}-${max} chars`);

export const validateEmail = (field = "email") =>
  body(field).isEmail().normalizeEmail().withMessage(`Invalid ${field}`);

export const validatePhone = (field = "phone") =>
  body(field)
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage(`Invalid ${field}`);

export const validateUUID = (field = "id") => param(field).isUUID().withMessage(`Invalid ${field}`);

export const validateUUIDBody = (field: string) =>
  body(field).isUUID().withMessage(`Invalid ${field}`);

export const validateEnum = (field: string, values: string[]) =>
  body(field)
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(", ")}`);

export const validateEnumQuery = (field: string, values: string[]) =>
  query(field)
    .optional()
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(", ")}`);

export const validatePaginationQuery = () => [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const commonValidations = {
  id: param("id").isUUID().withMessage("Invalid ID format"),
  email: body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
  password: body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase and number"),
  pagination: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100"),
  ],
};

export const schemas = {
  user: {
    create: [
      body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
      body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain uppercase, lowercase and number"),
      body("firstName")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("First name required (max 50)"),
      body("lastName")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("Last name required (max 50)"),
      body("role").optional().isIn(["admin", "manager", "dispatcher", "driver", "customer"]),
    ],
    update: [
      commonValidations.id,
      body("email").optional().isEmail().normalizeEmail(),
      body("firstName").optional().trim().isLength({ min: 1, max: 50 }),
      body("lastName").optional().trim().isLength({ min: 1, max: 50 }),
      body("role").optional().isIn(["admin", "manager", "dispatcher", "driver", "customer"]),
    ],
  },
};

export default {
  schemas,
  validate,
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  validateUUIDBody,
  validateEnum,
  validateEnumQuery,
  validatePaginationQuery,
  commonValidations,
  sanitizeInput,
  handleValidationErrors,
};
