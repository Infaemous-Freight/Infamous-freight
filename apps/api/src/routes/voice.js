const express = require("express");
const multer = require("multer");
const { asyncHandler } = require("../lib/errors");
const { limiters, authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const aiVoiceService = require("../services/aiVoiceService");
const { logger } = require("../middleware/logger");

const router = express.Router();

// Configure Multer for audio uploads
const VOICE_MAX_FILE_SIZE_MB = parseInt(process.env.VOICE_MAX_FILE_SIZE_MB || "10", 10);
const upload = multer({
  limits: {
    fileSize: VOICE_MAX_FILE_SIZE_MB * 1024 * 1024, // MB to bytes
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid audio format. Allowed: MP3, WAV, OGG, WEBM"));
    }
  },
});

/**
 * POST /api/voice/ingest
 * Upload and process voice audio file
 * Scope: voice:ingest
 * Feature flag: ENABLE_VOICE_PROCESSING
 */
router.post(
  "/voice/ingest",
  limiters.voice,
  authenticate,
  requireScope("voice:ingest"),
  auditLog,
  upload.single("audio"),
  asyncHandler(async (req, res) => {
      // Feature flag check
      if (process.env.ENABLE_VOICE_PROCESSING === "false") {
        return res.status(503).json({
          ok: false,
          error: "Voice processing is currently disabled",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          ok: false,
          error: "No audio file uploaded",
        });
      }

      const startTime = Date.now();

      // Validate file size
      if (req.file.size > VOICE_MAX_FILE_SIZE_MB * 1024 * 1024) {
        return res.status(413).json({
          ok: false,
          error: `File too large. Maximum size: ${VOICE_MAX_FILE_SIZE_MB}MB`,
        });
      }

      // Speech-to-text processing
      const language = req.body.language || "en";
      const transcription = await aiVoiceService.speechToText(req.file.buffer, language);

      logger.info("Voice transcribed", {
        userId: req.user.sub,
        text: transcription.text.substring(0, 50),
        confidence: transcription.confidence,
      });

      // Analyze command
      const context = {
        userId: req.user.sub,
        timestamp: new Date().toISOString(),
      };
      const command = await aiVoiceService.analyzeCommand(
        transcription.text,
        req.user.sub,
        context,
      );

      // Execute command
      const executionResult = await aiVoiceService.executeCommand(command);

      // Generate voice response (optional)
      let audioResponse = null;
      if (req.body.generateVoiceResponse === "true" && executionResult.message) {
        logger.info("Generating voice response", { userId: req.user.sub });
        audioResponse = await aiVoiceService.textToSpeech(
          executionResult.message,
          req.body.voiceType || "alloy",
          language,
        );
      }

      const result = {
        ok: true,
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        transcription: {
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
        },
        command: {
          intent: command.intent,
          confidence: command.confidence,
          entities: command.entities,
        },
        execution: executionResult,
        audioResponse: audioResponse
          ? {
              available: true,
              format: "mp3",
              size: audioResponse.length,
            }
          : null,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };

      // If audio response generated, send as attachment
      if (audioResponse) {
        res.set({
          "Content-Type": "application/json",
          "X-Audio-Response": "true",
        });
        result.audioResponseBase64 = audioResponse.toString("base64");
      }

      res.json(result);
  }),
);

/**
 * POST /api/voice/command
 * Process voice command from text
 * Scope: voice:command
 */
router.post(
  "/voice/command",
  limiters.voice,
  authenticate,
  requireScope("voice:command"),
  auditLog,
  validateString("text", { maxLength: 500 }),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
      const { text } = req.body;

      logger.info("Processing voice command", {
        userId: req.user.sub,
        command: text.substring(0, 50),
      });

      // Analyze command intent and entities
      const context = {
        userId: req.user.sub,
        timestamp: new Date().toISOString(),
      };
      const command = await aiVoiceService.analyzeCommand(text, req.user.sub, context);

      // Execute the command
      const executionResult = await aiVoiceService.executeCommand(command);

      logger.info("Voice command executed", {
        userId: req.user.sub,
        intent: command.intent,
        success: executionResult.success,
      });

      // Generate voice response if requested
      let audioResponse = null;
      if (req.body.generateVoiceResponse === "true" && executionResult.message) {
        const language = req.body.language || "en";
        const voice = req.body.voiceType || "alloy";
        audioResponse = await aiVoiceService.textToSpeech(executionResult.message, voice, language);
      }

      const result = {
        ok: true,
        command: {
          originalText: text,
          intent: command.intent,
          confidence: command.confidence,
          entities: command.entities,
        },
        execution: executionResult,
        audioResponse: audioResponse
          ? {
              available: true,
              format: "mp3",
              size: audioResponse.length,
              base64: audioResponse.toString("base64"),
            }
          : null,
        timestamp: new Date().toISOString(),
      };

      res.json(result);
  }),
);

module.exports = router;
