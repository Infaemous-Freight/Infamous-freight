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

    expect([400, 409]).toContain(duplicateResponse.status);
    expect(duplicateResponse.body.success ?? false).toBe(false);
    expect(JSON.stringify(duplicateResponse.body).toLowerCase()).toMatch(/exist|duplicate|already|taken|error/);
  });

  test("logs in successfully and issues a JWT token", async () => {
    const payload = makeRegistrationPayload();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: payload.email,
      password: payload.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toEqual(expect.any(String));

    const decodedToken = jwt.decode(loginResponse.body.token);
    expect(decodedToken).toBeTruthy();
    expect(decodedToken.email).toBe(payload.email);
  });

  test("rejects login with invalid password", async () => {
    const payload = makeRegistrationPayload();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: payload.email,
      password: "WrongPassword!",
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body.success ?? false).toBe(false);
    expect(JSON.stringify(loginResponse.body).toLowerCase()).toMatch(/invalid|credential|unauthorized|error/);
  });
});
