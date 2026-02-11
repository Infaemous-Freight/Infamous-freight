import express from "express";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";

const mockLoadFindMany = jest.fn();
const mockLoadCount = jest.fn();
const mockLoadCreate = jest.fn();

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    load: {
      findMany: mockLoadFindMany,
      count: mockLoadCount,
      create: mockLoadCreate,
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    driver: {
      findMany: jest.fn(),
    },
    vehicle: {
      findMany: jest.fn(),
    },
    aiDecision: {
      create: jest.fn(),
    },
  })),
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: jest.fn((token: string) => {
      if (token === "admin-token") {
        return {
          sub: "user-admin",
          organizationId: "org-1",
          role: "ADMIN",
        };
      }

      if (token === "driver-token") {
        return {
          sub: "user-driver",
          organizationId: "org-1",
          role: "DRIVER",
        };
      }

      throw new Error("invalid token");
    }),
  },
}));

import { dispatch } from "../../routes/dispatch";

describe("Dispatch loads routes", () => {
  const createValidPayload = () => ({
    customerId: "customer-1",
    pickupAddress: "100 A Street",
    pickupLat: 40.7128,
    pickupLng: -74.006,
    deliveryAddress: "200 B Street",
    deliveryLat: 41.8781,
    deliveryLng: -87.6298,
    pickupTime: "2026-01-10T08:00:00.000Z",
    deliveryTime: "2026-01-10T12:00:00.000Z",
    weight: 1200,
    rate: 2500,
    description: "Palletized goods",
  });

  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/api/dispatch", dispatch);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.status || 500).json({
        status: "error",
        message: err.message,
      });
    });
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists loads for authorized users", async () => {
    const app = buildApp();
    const mockLoads = [{ id: "load-1", organizationId: "org-1" }];
    mockLoadFindMany.mockResolvedValue(mockLoads);
    mockLoadCount.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/dispatch/loads?page=1&limit=5")
      .set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);
    expect(response.body.data.loads).toEqual(mockLoads);
    expect(mockLoadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1" }),
        skip: 0,
        take: 5,
      }),
    );
  });

  it("creates a load for ADMIN role", async () => {
    const app = buildApp();
    mockLoadCreate.mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: "load-created",
        ...data,
        customer: { id: data.customerId },
      }),
    );

    const response = await request(app)
      .post("/api/dispatch/loads")
      .set("Authorization", "Bearer admin-token")
      .send(createValidPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.load.id).toBe("load-created");
    expect(mockLoadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          customerId: "customer-1",
          pickupLat: 40.7128,
          pickupLng: -74.006,
          deliveryLat: 41.8781,
          deliveryLng: -87.6298,
          weight: 1200,
          rate: 2500,
          status: "PENDING",
        }),
      }),
    );
  });

  it("returns validation errors for invalid create payload", async () => {
    const app = buildApp();

    const response = await request(app)
      .post("/api/dispatch/loads")
      .set("Authorization", "Bearer admin-token")
      .send({
        pickupAddress: "Missing required fields",
        pickupLat: "not-a-number",
        pickupLng: -74,
        deliveryAddress: "200 B Street",
        deliveryLat: 41,
        deliveryLng: -87,
        pickupTime: "not-a-date",
        deliveryTime: "2026-01-10T07:00:00.000Z",
        weight: -10,
        rate: -20,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(mockLoadCreate).not.toHaveBeenCalled();
  });

  it("requires auth for listing loads", async () => {
    const app = buildApp();

    const response = await request(app).get("/api/dispatch/loads");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authorization header required");
  });

  it("rejects create for non-dispatch roles", async () => {
    const app = buildApp();

    const response = await request(app)
      .post("/api/dispatch/loads")
      .set("Authorization", "Bearer driver-token")
      .send(createValidPayload());

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden");
    expect(mockLoadCreate).not.toHaveBeenCalled();
  });
});
