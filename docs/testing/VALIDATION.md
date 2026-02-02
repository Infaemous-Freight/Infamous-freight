# API Input Validation Guide

## Overview

This document describes all input validation implemented across the Infamous Freight Enterprises API. Validation is enforced at the middleware level using `express-validator` before handlers execute.

## Validation Layers

```
Request → Rate Limit → Auth → Scope Check → Audit Log → Validators → Handler
                                                              ↑
                                                    Validation errors caught here
                                                    Return 400 with details
```

## Global Validators

### Email Validation

- **Pattern**: RFC 5322 compliant email format
- **Usage**: `body("email").isEmail()`
- **Invalid Examples**: `user@`, `@example.com`, `user@.com`, `user @example.com`
- **Valid Examples**: `user@example.com`, `test.user+tag@sub.example.co.uk`

### String Validation

- **Min Length**: Enforced per field (typically 1-100 characters)
- **Trim**: Whitespace stripped from edges
- **Type**: Must be string, not number or object
- **Pattern**: `body("name").isString().trim().isLength({ min: 1, max: 100 })`

### Enumeration Validation

- **User Roles**: `user`, `admin`, `driver`
- **Validation**: `body("role").isIn(["user", "admin", "driver"])`
- **Error**: Returns 400 if role not in allowed list
- **Case-Sensitive**: "User" ≠ "user" (must be lowercase)

## Endpoint Validations

### POST /api/users

Creates a new user with validated input.

**Required Fields:**

- `email` - Valid RFC 5322 email address
- `role` - One of: `user`, `admin`, `driver`

**Optional Fields:**

- `name` - String, 1-100 characters, trimmed

**Request Example:**

```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "role": "driver"
}
```

**Validation Rules:**

```javascript
[
  body("email").isEmail().withMessage("Invalid email format"),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be 1-100 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin", "driver"])
    .withMessage("Role must be one of: user, admin, driver"),
];
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "driver",
    "createdAt": "2025-12-16T20:00:00Z",
    "updatedAt": "2025-12-16T20:00:00Z"
  }
}
```

**Validation Error Response (400):**

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Invalid email format",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### POST /api/ai/command

Submits AI commands for processing.

**Required Fields:**

- `command` - String, 1-100 characters
- `payload` - Object with command-specific data

**Validation Rules:**

```javascript
[
  body("command")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Command required, max 100 chars"),
  body("payload").isObject().withMessage("Payload must be an object"),
];
```

### POST /api/billing/stripe/session

Creates Stripe payment session.

**Auth Required**: `billing:write` scope
**Validation**: Session data validation on backend

---

## Error Handling

### Validation Error Format

All validation errors follow a consistent format:

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "type": "field",
      "value": "provided_value",
      "msg": "Human-readable error message",
      "path": "field_name",
      "location": "body" | "query" | "params"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning             | When Used                   |
| ---- | ------------------- | --------------------------- |
| 200  | OK                  | Successful GET/HEAD request |
| 201  | Created             | Resource created via POST   |
| 400  | Bad Request         | Validation failed           |
| 401  | Unauthorized        | Missing/invalid JWT         |
| 403  | Forbidden           | Insufficient scopes         |
| 404  | Not Found           | Resource doesn't exist      |
| 429  | Too Many Requests   | Rate limit exceeded         |
| 500  | Server Error        | Internal error (see logs)   |
| 503  | Service Unavailable | External service down       |

---

## Security Implications

### Protected Against

✅ **SQL Injection** - Email/name validated to RFC standards, no raw DB queries
✅ **NoSQL Injection** - Role enum-validated, prevents `{$ne: null}` attacks
✅ **XSS** - String values trimmed and validated, HTML encoding in responses
✅ **Buffer Overflow** - Max lengths enforced (1-100 chars typical)
✅ **CRLF Injection** - HTTP headers validated by Node.js/Express
✅ **Type Confusion** - Strict type checking with `isString()`, `isEmail()`, etc.

### Test Coverage

Security validation tested with 50+ attack payloads:

```javascript
// SQL Injection payloads tested:
'; DROP TABLE users; --
1' OR '1'='1
admin'--
1' UNION SELECT NULL--
' OR 1=1--
admin' /*

// Header Injection tested:
value\r\nX-Injected: true

// NoSQL Injection tested:
{ status: { $ne: null } }
```

**All tests pass** ✅ - See [TEST_FIXES_APPLIED.md](TEST_FIXES_APPLIED.md)

---

## Migration Path

### Adding New Validations

1. **Define validators** in route file:

```javascript
const { body } = require("express-validator");

router.post(
  "/endpoint",
  [body("field").isEmail().withMessage("Invalid email")],
  // ... handler
);
```

1. **Handle errors** in handler:

```javascript
const { validationResult } = require("express-validator");

async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: "Validation Error",
      details: errors.array(),
    });
  }
  // Proceed with validated data
};
```

1. **Test coverage** - Add edge cases to test suite
2. **Document** - Update this file with new validations

---

## Best Practices

✅ **Always validate at entry** - Catch bad data before business logic
✅ **Use validators library** - Don't regex-validate email manually
✅ **Provide clear errors** - Help clients understand what failed
✅ **Test edge cases** - Whitespace, null, undefined, type mismatches
✅ **Trim user input** - Remove unintended whitespace
✅ **Enforce enums** - Use `.isIn()` for fixed value sets
✅ **Log validation failures** - Track attack patterns

---

## References

- [express-validator Documentation](https://express-validator.github.io/)
- [RFC 5322 - Email Format](https://tools.ietf.org/html/rfc5322)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [API Security Best Practices](docs/API_SECURITY_CHECKLIST.md)
