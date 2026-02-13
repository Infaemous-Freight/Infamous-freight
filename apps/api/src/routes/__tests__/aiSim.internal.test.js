const express = require("express");
const request = require("supertest");

// Mock auditLog
jest.mock("../../middleware/security", () => ({
  auditLog: jest.fn((req, res, next) => next()),
}));

// Now require the router
const aiSimRouter = require("../aiSim.internal");

// Create test app
const app = express();
app.use(express.json());
app.use("/internal", aiSimRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ ok: false, error: err.message || "Internal Server Error" });
});

describe("AI Sim Internal Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /internal/ai/simulate", () => {
    it("should return synthetic AI response for valid prompt", async () => {
      const response = await request(app)
        .get("/internal/ai/simulate")
        .query({ prompt: "Test prompt" })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.prompt).toBe("Test prompt");
      expect(response.body.completion).toContain('Synthetic AI response to: "Test prompt"');
      expect(response.body.model).toBe("synthetic-v1");
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return 400 when prompt is missing", async () => {
      const response = await request(app).get("/internal/ai/simulate").expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Prompt is required");
    });

    it("should work without authentication (internal service)", async () => {
      await request(app)
        .get("/internal/ai/simulate")
        .query({ prompt: "No auth needed" })
        .expect(200);
    });

    it("should include ISO timestamp", async () => {
      const response = await request(app)
        .get("/internal/ai/simulate")
        .query({ prompt: "test" })
        .expect(200);

      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("POST /internal/ai/batch", () => {
    it("should process batch of prompts successfully", async () => {
      const prompts = ["First prompt", "Second prompt", "Third prompt"];
      const response = await request(app).post("/internal/ai/batch").send({ prompts }).expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.results).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.timestamp).toBeDefined();

      response.body.results.forEach((result, idx) => {
        expect(result.index).toBe(idx);
        expect(result.prompt).toBe(prompts[idx]);
        expect(result.completion).toContain(`Synthetic AI response to: "${prompts[idx]}"`);
        expect(result.model).toBe("synthetic-v1");
      });
    });

    it("should handle empty prompts array", async () => {
      const response = await request(app)
        .post("/internal/ai/batch")
        .send({ prompts: [] })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.results).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it("should return 400 when prompts is not an array", async () => {
      const response = await request(app)
        .post("/internal/ai/batch")
        .send({ prompts: "not an array" })
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Prompts must be an array");
    });

    it("should return 400 when prompts is missing", async () => {
      const response = await request(app).post("/internal/ai/batch").send({}).expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("Prompts must be an array");
    });

    it("should work without authentication (internal service)", async () => {
      await request(app)
        .post("/internal/ai/batch")
        .send({ prompts: ["test"] })
        .expect(200);
    });

    it("should handle large batch of prompts", async () => {
      const prompts = Array.from({ length: 50 }, (_, i) => `Prompt ${i}`);
      const response = await request(app).post("/internal/ai/batch").send({ prompts }).expect(200);

      expect(response.body.results).toHaveLength(50);
      expect(response.body.count).toBe(50);
    });
  });

  describe("Middleware Integration", () => {
    it("should apply audit logging", async () => {
      const { auditLog } = require("../../middleware/security");

      await request(app).get("/internal/ai/simulate").query({ prompt: "test" }).expect(200);

      expect(auditLog).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      // Force an error by sending invalid data
      await request(app)
        .post("/internal/ai/batch")
        .send("invalid json")
        .set("Content-Type", "application/json")
        .expect(400);
    });
  });
});
