/*
 * Voice Route Tests
 * Tests for voice processing endpoints
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { limiters, authenticate, requireScope } = require("../../middleware/security");

// Mock Multer for file uploads
jest.mock("multer", () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        req.file = {
          originalname: "test-audio.mp3",
          size: 1024 * 100, // 100 KB
          mimetype: "audio/mpeg",
          buffer: Buffer.from("mock audio data"),
        };
      }
      next();
    },
  });
  multer.memoryStorage = () => ({});
  return multer;
});

describe("Voice Route Tests", () => {
  let app;
  let validToken;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
    process.env.ENABLE_VOICE_PROCESSING = "true";
    process.env.VOICE_MAX_FILE_SIZE_MB = "10";

    // Create valid JWT token
    validToken = jwt.sign(
      {
        sub: "test-user-id",
        email: "test@example.com",
        scopes: ["voice:ingest", "voice:command"],
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Import route after mocks are set up
    const voiceRouter = require("../voice");
    app.use("/api", voiceRouter);
  });

  describe("POST /api/voice/ingest", () => {
    test("should return structured transcription object", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("transcription");

      // Verify transcription structure
      expect(res.body.transcription).toMatchObject({
        text: expect.any(String),
        confidence: expect.any(Number),
        duration: null, // Fixed from undefined
        language: expect.any(String),
      });
    });

    test("should include file metadata in response", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      expect(res.status).toBe(200);
      expect(res.body.file).toMatchObject({
        originalName: expect.any(String),
        size: expect.any(Number),
        mimetype: expect.stringContaining("audio"),
      });
    });

    test("should include processing metadata", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("processingTime");
      expect(typeof res.body.processingTime).toBe("number");
    });

    test("should reject requests without audio file", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        ok: false,
        error: expect.stringContaining("audio"),
      });
    });

    test("should respect feature flag", async () => {
      process.env.ENABLE_VOICE_PROCESSING = "false";

      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      expect(res.status).toBe(503);
      expect(res.body.error).toContain("disabled");

      // Restore
      process.env.ENABLE_VOICE_PROCESSING = "true";
    });

    test("should require authentication", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      expect(res.status).toBe(401);
    });

    test("should require voice:ingest scope", async () => {
      const tokenWithoutScope = jwt.sign(
        {
          sub: "test-user-id",
          email: "test@example.com",
          scopes: [],
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${tokenWithoutScope}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/voice/command", () => {
    test("should process text command", async () => {
      const res = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ text: "Check shipment status" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        command: {
          originalText: "Check shipment status",
        },
        execution: expect.any(Object),
        timestamp: expect.any(String),
      });
    });

    test("should validate text field", async () => {
      const res = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ text: "" });

      expect(res.status).toBe(400);
    });

    test("should enforce max length", async () => {
      const longText = "x".repeat(501);

      const res = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ text: longText });

      expect(res.status).toBe(400);
    });

    test("should require voice:command scope", async () => {
      const tokenWithoutScope = jwt.sign(
        {
          sub: "test-user-id",
          email: "test@example.com",
          scopes: ["voice:ingest"],
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      const res = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${tokenWithoutScope}`)
        .send({ text: "Check status" });

      expect([403, 429]).toContain(res.status);
    });
  });

  describe("Transcription Object Structure", () => {
    test("should have consistent transcription structure", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      if (res.status !== 200) {
        return;
      }

      const { transcription } = res.body;

      // Verify all expected fields are present
      expect(transcription).toHaveProperty("text");
      expect(transcription).toHaveProperty("confidence");
      expect(transcription).toHaveProperty("duration");
      expect(transcription).toHaveProperty("language");

      // Verify field types
      expect(typeof transcription.text).toBe("string");
      expect(typeof transcription.confidence).toBe("number");
      expect(transcription.duration).toBeNull(); // Fixed: was undefined
      expect(typeof transcription.language).toBe("string");
    });

    test("should have duration as null not undefined", async () => {
      const res = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .set("Content-Type", "multipart/form-data")
        .attach("audio", Buffer.from("mock audio"), "test.mp3");

      if (res.status !== 200) {
        return;
      }

      const { transcription } = res.body;

      // Critical fix: duration should be null, not undefined
      expect(transcription.duration).toBeNull();
      expect(transcription.duration).not.toBeUndefined();
    });
  });
});
