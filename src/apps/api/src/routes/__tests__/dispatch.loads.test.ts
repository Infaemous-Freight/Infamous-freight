import { jest } from "@jest/globals";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

const getLoads = jest.fn((req: Request, res: Response) => {
  return res.json({
    status: "success",
    data: { loads: [{ id: "load-1" }], org: req.user?.organizationId },
  });
});

const createLoad = jest.fn((_req: Request, res: Response) => {
  return res.status(201).json({
    status: "success",
    data: { load: { id: "load-created" } },
  });
});

describe("Dispatch loads routes", () => {
  let app: express.Application;

  const authToken = (role = "DISPATCHER", organizationId = "org-1") =>
    jwt.sign({ sub: "user-1", role, organizationId }, process.env.JWT_SECRET!);

  beforeAll(async () => {
    await jest.unstable_mockModule("../../controllers/dispatch.controller", () => ({
      getLoads,
      createLoad,
      getLoadById: jest.fn(),
      assignLoad: jest.fn(),
      optimizeRoutes: jest.fn(),
    }));

    const { dispatch } = await import("../dispatch");

    app = express();
    app.use(express.json());
    app.use("/api/dispatch", dispatch);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err?.status) {
        return res.status(err.status).json({
          status: "error",
          message: err.message,
        });
      }

      return res.status(500).json({ status: "error", message: "Unexpected error" });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("supports list loads for authenticated users", async () => {
    const response = await request(app)
      .get("/api/dispatch/loads")
      .set("Authorization", `Bearer ${authToken("DRIVER", "org-xyz")}`);

    expect(response.status).toBe(200);
    expect(response.body.data.loads).toHaveLength(1);
    expect(getLoads).toHaveBeenCalledTimes(1);
  });

  it("allows ADMIN and DISPATCHER to create loads", async () => {
    const payload = {
      customerId: "customer-1",
      pickupAddress: "123 A St",
      pickupLat: 40.7128,
      pickupLng: -74.006,
      deliveryAddress: "456 B Ave",
      deliveryLat: 34.0522,
      deliveryLng: -118.2437,
      pickupTime: "2026-02-10T10:00:00.000Z",
      deliveryTime: "2026-02-11T10:00:00.000Z",
      weight: 1200,
      rate: 2500,
    };

    const response = await request(app)
      .post("/api/dispatch/loads")
      .set("Authorization", `Bearer ${authToken("DISPATCHER")}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(createLoad).toHaveBeenCalledTimes(1);
  });

  it("returns validation errors for invalid create payloads", async () => {
    const response = await request(app)
      .post("/api/dispatch/loads")
      .set("Authorization", `Bearer ${authToken("DISPATCHER")}`)
      .send({
        customerId: "customer-1",
        pickupAddress: "123 A St",
        pickupLat: "invalid",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(createLoad).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated load requests", async () => {
    const response = await request(app).get("/api/dispatch/loads");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization header required");
    expect(getLoads).not.toHaveBeenCalled();
  });

  it("rejects create load for unauthorized roles", async () => {
    const response = await request(app)
      .post("/api/dispatch/loads")
      .set("Authorization", `Bearer ${authToken("DRIVER")}`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden");
    expect(createLoad).not.toHaveBeenCalled();
  });
});
