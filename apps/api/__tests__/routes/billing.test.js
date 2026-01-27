const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const billingRoutes = require("../../src/routes/billing");

describe("Billing Routes", () => {
  let app, validToken;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/billing", billingRoutes);

    validToken = jwt.sign(
      { sub: "user-123", scopes: ["billing:read", "billing:write"] },
      process.env.JWT_SECRET,
    );

    jest.clearAllMocks();
  });

  describe.skip("POST /billing/create-subscription", () => {
    it("should create subscription with valid data", async () => {
      const response = await request(app)
        .post("/api/billing/create-subscription")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          tier: "premium",
          email: "test@example.com",
        });

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
      expect(response.body.subscription).toMatchObject({
        tier: "premium",
        email: "test@example.com",
        status: "active",
      });
    });

    it("should require billing:write scope", async () => {
      const readOnlyToken = jwt.sign(
        { sub: "user-123", scopes: ["billing:read"] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .post("/api/billing/create-subscription")
        .set("Authorization", `Bearer ${readOnlyToken}`)
        .send({ tier: "basic", email: "test@example.com" });

      expect(response.status).toBe(403);
    });

    it("should validate tier field", async () => {
      const response = await request(app)
        .post("/api/billing/create-subscription")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/billing/create-subscription")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ tier: "basic", email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe.skip("GET /billing/subscriptions", () => {
    it("should return subscriptions list", async () => {
      const response = await request(app)
        .get("/api/billing/subscriptions")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.subscriptions)).toBe(true);
    });

    it("should require billing:read scope", async () => {
      const noScopeToken = jwt.sign(
        { sub: "user-123", scopes: [] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/billing/subscriptions")
        .set("Authorization", `Bearer ${noScopeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe.skip("POST /billing/cancel-subscription/:id", () => {
    it("should cancel subscription", async () => {
      const response = await request(app)
        .post("/api/billing/cancel-subscription/sub_123")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.message).toContain("cancelled");
    });

    it("should require billing:write scope", async () => {
      const readOnlyToken = jwt.sign(
        { sub: "user-123", scopes: ["billing:read"] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .post("/api/billing/cancel-subscription/sub_123")
        .set("Authorization", `Bearer ${readOnlyToken}`);

      expect(response.status).toBe(403);
    });
  });
});
