const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../../app");

describe("Auth Registration/Login", () => {
  const makeRegistrationPayload = () => ({
    email: `auth-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: "SecurePass123!",
    name: "Auth Test User",
  });

  test("registers a user successfully", async () => {
    const payload = makeRegistrationPayload();

    const response = await request(app).post("/api/auth/register").send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test("rejects duplicate registration attempts", async () => {
    const payload = makeRegistrationPayload();

    const firstResponse = await request(app).post("/api/auth/register").send(payload);
    expect(firstResponse.status).toBe(201);

    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.success ?? false).toBe(false);
    expect(JSON.stringify(duplicateResponse.body).toLowerCase()).toMatch(/exist|duplicate|already|taken|error/);
  });

  test("logs in successfully and issues a JWT token", async () => {
    const payload = makeRegistrationPayload();
});
