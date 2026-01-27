const {
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  handleValidationErrors,
} = require("../../src/middleware/validation");
const { validationResult } = require("express-validator");

describe("Validation Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("validateString", () => {
    it("should validate valid string", async () => {
      req.body.field = "valid string";
      const validator = validateString("field");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject empty string", async () => {
      req.body.field = "";
      const validator = validateString("field");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "field",
            }),
          ]),
        }),
      );
    });

    it("should reject string exceeding max length", async () => {
      req.body.field = "a".repeat(1001);
      const validator = validateString("field", { maxLength: 1000 });

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should trim whitespace from string", async () => {
      req.body.field = "  valid string  ";
      const validator = validateString("field");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(req.body.field).toBe("valid string");
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("validateEmail", () => {
    it("should validate valid email", async () => {
      req.body.email = "test@example.com";
      const validator = validateEmail("email");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should reject invalid email format", async () => {
      req.body.email = "invalid-email";
      const validator = validateEmail("email");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "email",
              msg: "Invalid email",
            }),
          ]),
        }),
      );
    });

    it("should normalize email address", async () => {
      req.body.email = "Test@Example.COM";
      const validator = validateEmail("email");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(req.body.email).toBe("test@example.com");
    });
  });

  describe("validatePhone", () => {
    it("should validate valid phone number", async () => {
      req.body.phone = "+15555555555"; // Valid US format
      const validator = validatePhone("phone");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should reject invalid phone number", async () => {
      req.body.phone = "not-a-phone";
      const validator = validatePhone("phone");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("validateUUID", () => {
    it("should validate valid UUID", async () => {
      req.params.id = "123e4567-e89b-12d3-a456-426614174000";
      const validator = validateUUID("id");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should reject invalid UUID", async () => {
      req.params.id = "not-a-uuid";
      const validator = validateUUID("id");

      await validator.run(req);
      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "id",
              msg: "Invalid UUID",
            }),
          ]),
        }),
      );
    });
  });

  describe("handleValidationErrors", () => {
    it("should call next when no validation errors", () => {
      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
