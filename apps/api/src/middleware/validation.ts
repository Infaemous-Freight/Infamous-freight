import type { Request, RequestHandler, Response, NextFunction } from "express";
import { body, param, query, validationResult, type ValidationChain } from "express-validator";

export function validateString(field: string, opts: { maxLength?: number } = {}): ValidationChain {
  return body(field)
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .notEmpty()
    .withMessage(`${field} must not be empty`)
    .trim()
    .isLength({ max: opts.maxLength ?? 1000 })
    .withMessage(`${field} too long`);
}

export function validateEmail(field = "email"): ValidationChain {
  return body(field).trim().isEmail().withMessage("Invalid email").normalizeEmail();
}

export function validatePhone(field = "phone"): ValidationChain {
  return body(field)
    .trim()
    .custom((value) => {
      const normalized = String(value || "").replace(/[^\d]/g, "");
      if (normalized.length < 7 || normalized.length > 15) {
        throw new Error("Invalid phone number");
      }
      return true;
    });
}

export function validateUUID(field = "id"): ValidationChain {
  return param(field).isUUID().withMessage("Invalid UUID");
}

export function validateUUIDBody(field = "id"): ValidationChain {
  return body(field).isUUID().withMessage("Invalid UUID");
}

export function validateEnum(field: string, allowed: string[]): ValidationChain {
  return body(field)
    .custom((value) => allowed.includes(value))
    .withMessage(`${field} must be one of: ${Array.isArray(allowed) ? allowed.join(", ") : allowed}`);
}

export function validateEnumQuery(field: string, allowed: string[]): ValidationChain {
  return query(field)
    .custom((value) => allowed.includes(value))
    .withMessage(`${field} must be one of: ${Array.isArray(allowed) ? allowed.join(", ") : allowed}`);
}

export function validatePaginationQuery(
  { page = "page", pageSize = "pageSize", maxPageSize = 100 } = {},
): ValidationChain[] {
  return [
    query(page).optional().isInt({ min: 1 }).withMessage(`${page} must be a positive integer`),
    query(pageSize)
      .optional()
      .isInt({ min: 1, max: maxPageSize })
      .withMessage(`${pageSize} must be between 1 and ${maxPageSize}`),
  ];
}

export const handleValidationErrors: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: "Validation failed",
    details: errors.array().map((e) => {
      const field = "path" in e ? e.path : "param" in e ? e.param : undefined;
      return { field, msg: e.msg };
    }),
  });
};

const validation: {
  validateString: typeof validateString;
  validateEmail: typeof validateEmail;
  validatePhone: typeof validatePhone;
  validateUUID: typeof validateUUID;
  validateUUIDBody: typeof validateUUIDBody;
  validateEnum: typeof validateEnum;
  validateEnumQuery: typeof validateEnumQuery;
  validatePaginationQuery: typeof validatePaginationQuery;
  handleValidationErrors: typeof handleValidationErrors;
} = {
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  validateUUIDBody,
  validateEnum,
  validateEnumQuery,
  validatePaginationQuery,
  handleValidationErrors,
};

export default validation;
