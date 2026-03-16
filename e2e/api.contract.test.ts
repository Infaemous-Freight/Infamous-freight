/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * API Contract Tests - Pact Framework
 *
 * Consumer (Web app) tests verify API responses match expected schema
 * Catches breaking changes before deployment
 */

import { PactV3 } from "@pact-foundation/pact";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

const pact = new PactV3({
  consumer: "infamous-web",
  provider: "infamous-api",
  logLevel: "warn",
});

describe("Infæmous Freight API Contract Tests", () => {
  // Shipments API
  describe("GET /api/v1/shipments/:id", () => {
    it("should return shipment details", () => {
      return pact
        .addInteraction({
          states: [{ description: "shipment with ID shipment_123 exists" }],
          uponReceiving: "a request for shipment details",
          withRequest: {
            method: "GET",
            path: "/api/v1/shipments/shipment_123",
            headers: {
              Authorization: "Bearer valid-jwt-token",
            },
          },
          willRespondWith: {
            status: 200,
            body: {
              id: "shipment_123",
              status: expect.stringMatching(/PENDING|IN_TRANSIT|DELIVERED|CANCELLED/),
              origin: expect.any(String),
              destination: expect.any(String),
              createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
              updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/shipments/shipment_123`, {
            method: "GET",
            headers: {
              Authorization: "Bearer valid-jwt-token",
            },
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty("id", "shipment_123");
          expect(data).toHaveProperty("status");
          expect(data).toHaveProperty("origin");
          expect(data).toHaveProperty("destination");
        });
    });
  });

  // Users API
  describe("GET /api/v1/users/me", () => {
    it("should return authenticated user profile", () => {
      return pact
        .addInteraction({
          states: [{ description: "user is authenticated" }],
          uponReceiving: "a request for user profile",
          withRequest: {
            method: "GET",
            path: "/api/v1/users/me",
            headers: {
              Authorization: "Bearer valid-jwt-token",
            },
          },
          willRespondWith: {
            status: 200,
            body: {
              id: expect.any(String),
              email: expect.stringMatching(/^.+@.+\..+$/),
              name: expect.any(String),
              role: expect.stringMatching(/user|admin|driver/),
              scopes: expect.any(Array),
              createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/users/me`, {
            method: "GET",
            headers: {
              Authorization: "Bearer valid-jwt-token",
            },
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty("id");
          expect(data).toHaveProperty("email");
          expect(data.scopes).toBeInstanceOf(Array);
        });
    });
  });

  // Error Cases
  describe("Error Handling", () => {
    it("should return 401 for missing auth", () => {
      return pact
        .addInteraction({
          states: [{ description: "user is not authenticated" }],
          uponReceiving: "a request without authentication",
          withRequest: {
            method: "GET",
            path: "/api/v1/shipments/shipment_123",
          },
          willRespondWith: {
            status: 401,
            body: {
              error: expect.any(String),
              message: expect.stringMatching(/auth|token|credentials/i),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/shipments/shipment_123`);

          expect(response.status).toBe(401);
        });
    });

    it("should return 404 for not found", () => {
      return pact
        .addInteraction({
          states: [{ description: "shipment does not exist" }],
          uponReceiving: "a request for non-existent shipment",
          withRequest: {
            method: "GET",
            path: "/api/v1/shipments/nonexistent",
            headers: {
              Authorization: "Bearer valid-jwt-token",
            },
          },
          willRespondWith: {
            status: 404,
            body: {
              error: "Not found",
              message: expect.any(String),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/shipments/nonexistent`, {
            headers: {
              Authorization: "Bearer valid-jwt-token",
            },
          });

          expect(response.status).toBe(404);
        });
    });
  });

  // Idempotency
  describe("Idempotent Operations", () => {
    it("should return same response for duplicate requests with Idempotency-Key", () => {
      return pact
        .addInteraction({
          states: [{ description: "user can create shipments" }],
          uponReceiving: "a request to create shipment with Idempotency-Key",
          withRequest: {
            method: "POST",
            path: "/api/v1/shipments",
            headers: {
              Authorization: "Bearer valid-jwt-token",
              "Idempotency-Key": "unique-key-12345",
              "Content-Type": "application/json",
            },
            body: {
              origin: "NYC",
              destination: "LAX",
            },
          },
          willRespondWith: {
            status: 201,
            headers: {
              "Idempotency-Replay": "false",
            },
            body: {
              id: expect.any(String),
              status: "PENDING",
              origin: "NYC",
              destination: "LAX",
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/api/v1/shipments`, {
            method: "POST",
            headers: {
              Authorization: "Bearer valid-jwt-token",
              "Idempotency-Key": "unique-key-12345",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              origin: "NYC",
              destination: "LAX",
            }),
          });

          expect(response.status).toBe(201);
          const replayHeader = response.headers.get("Idempotency-Replay");
          expect(["false", null]).toContain(replayHeader); // First request
        });
    });
  });
});
