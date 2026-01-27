const express = require("express");
const multer = require("multer");
const {
  limiters,
  authenticate,
  requireScope,
  auditLog,
} = require("../middleware/security");
const {
  validateString,
  handleValidationErrors,
} = require("../middleware/validation");

const router = express.Router();

// Configure Multer for audio uploads
const VOICE_MAX_FILE_SIZE_MB = parseInt(
  process.env.VOICE_MAX_FILE_SIZE_MB || "10",
  10,
);
const upload = multer({
  limits: {
    fileSize: VOICE_MAX_FILE_SIZE_MB * 1024 * 1024, // MB to bytes
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
    ];
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
  async (req, res, next) => {
    try {
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

      // Process audio transcription (Whisper API integration ready)
      const transcription = {
        text: "Voice transcription would be processed here",
        confidence: 0.95,
        duration: duration,
        language: "en",
        // TODO: Integrate Whisper API when API key is available
        // const result = await openai.audio.transcriptions.create({
        //   file: req.file,
        //   model: "whisper-1",
        // });
      };
      const result = {
        ok: true,
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        transcription: "Audio transcription not yet implemented",
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
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
  async (req, res, next) => {
    try {
      const { text } = req.body;

      // Process voice command through AI pipeline
      const command = {
        action: "status_check",
        parameters: {},
        // TODO: Integrate AI command processing pipeline
        // const aiResponse = await processAICommand(transcription.text, req.user);
      };
      const result = {
        ok: true,
        command: text,
        result: "Voice command processing not yet implemented",
        timestamp: new Date().toISOString(),
      };

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
