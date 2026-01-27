/**
 * Avatar Routes - Phase 2 User Avatar System
 * Handles user avatar uploads, retrieval, and selection
 *
 * Endpoints:
 * - GET /v1/avatars/system - Get Phase 1 system avatars
 * - GET /v1/avatars/me - Get user's avatars
 * - POST /v1/avatars/me/upload - Upload new avatar
 * - POST /v1/avatars/me/select/:filename - Select avatar as active
 * - DELETE /v1/avatars/me/:filename - Delete avatar
 * - GET /v1/avatars/stats - Get store statistics (admin only)
 */

import * as express from "express";
import * as multer from "multer";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { z } from "zod";
import { authenticate, requireScope, limiters } from "../middleware/security";
import { getUserId } from "../auth/userId";
import {
  getUserAvatars,
  getSelectedAvatar,
  addAvatar,
  selectAvatar,
  deleteAvatar,
  getStoreStats,
  initializeStore,
} from "./store";
import { env } from "../config/env";
import { handlePresign } from "./presign";

const router = express.Router();
const storageMode = env.avatarStorage || "local";

function toResponseAvatar(avatar) {
  const baseUrl = avatar.url
    ? avatar.url
    : avatar.fileName.startsWith("http")
      ? avatar.fileName
      : `/uploads/${avatar.fileName}`;
  return {
    ...avatar,
    url: baseUrl,
  };
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = getUserId(req);
    if (!userId) {
      return cb(new Error("Unauthorized"));
    }

    const uploadDir = path.join(env.avatarUploadDir, userId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: timestamp-random.ext
    const ext = path.extname(file.originalname);
    const basename = `avatar-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}${ext}`;
    cb(null, basename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.avatarMaxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!env.avatarAllowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          `File type ${file.mimetype} not allowed. Allowed: ${env.avatarAllowedTypes.join(", ")}`,
        ),
      );
    }
    cb(null, true);
  },
});

/**
 * GET /v1/avatars/system
 * Get Phase 1 system avatars (no auth required)
 */
router.get("/system", (req, res) => {
  try {
    const manifestPath = path.join(
      __dirname,
      "../../..",
      "web/public/avatars/main/manifest.json",
    );

    if (!fs.existsSync(manifestPath)) {
      return res.status(404).json({
        error: "System avatars not configured",
        message: "Phase 1 avatar manifest not found",
      });
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    res.json({
      success: true,
      type: "system",
      avatars: manifest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading system avatars:", error);
    res.status(500).json({
      error: "Failed to retrieve system avatars",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /v1/avatars/me
 * Get user's uploaded avatars (requires auth)
 */
router.get("/me", limiters.general, authenticate, async (req, res) => {
  try {
    await initializeStore();
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const avatars = await getUserAvatars(userId);
    const selected = await getSelectedAvatar(userId);

    res.json({
      success: true,
      userId,
      avatars: avatars.map(toResponseAvatar),
      selected: selected ? toResponseAvatar(selected) : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error retrieving user avatars:", error);
    res.status(500).json({
      error: "Failed to retrieve avatars",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /v1/avatars/me/upload
 * Upload new avatar (requires auth + scope)
 */
router.post(
  "/me/upload",
  limiters.voice, // Reuse voice limiter for file uploads
  authenticate,
  requireScope("user:avatar"),
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (storageMode === "s3") {
        return res
          .status(400)
          .json({ error: "Direct upload disabled. Use /me/presign" });
      }
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
          message: "Avatar file is required",
        });
      }

      await initializeStore();

      // Store avatar metadata
      const fileName = `${userId}/${req.file.filename}`;
      const avatar = {
        userId,
        uploadedAt: new Date().toISOString(),
        fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        selected: false, // User must explicitly select
      };

      await addAvatar(avatar);

      res.json({
        success: true,
        message: "Avatar uploaded successfully",
        avatar: toResponseAvatar(avatar),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      console.error("Error uploading avatar:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = message.includes("not allowed") ? 400 : 500;

      res.status(statusCode).json({
        error: "Failed to upload avatar",
        message,
      });
    }
  },
);

/**
 * POST /v1/avatars/me/select/:filename
 * Select avatar as active (requires auth)
 */
router.post(
  "/me/select/:filename",
  limiters.general,
  authenticate,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await initializeStore();

      const selected = await selectAvatar(userId, req.params.filename);
      if (!selected) {
        return res.status(404).json({
          error: "Avatar not found",
          message: `Avatar '${req.params.filename}' not found for this user`,
        });
      }

      res.json({
        success: true,
        message: "Avatar selected",
        avatar: toResponseAvatar(selected),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error selecting avatar:", error);
      res.status(500).json({
        error: "Failed to select avatar",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * DELETE /v1/avatars/me/:filename
 * Delete uploaded avatar (requires auth)
 */
router.delete(
  "/me/:filename",
  limiters.general,
  authenticate,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await initializeStore();
      const avatars = await getUserAvatars(userId);
      const target = avatars.find((a) => a.fileName === req.params.filename);
      if (!target) {
        return res.status(404).json({
          error: "Avatar not found",
          message: `Avatar '${req.params.filename}' not found for this user`,
        });
      }

      const deleted = await deleteAvatar(userId, req.params.filename);

      // Delete file from disk for local storage
      if ((target.storage || "local") === "local") {
        const filePath = path.join(
          env.avatarUploadDir,
          userId,
          req.params.filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.json({
        success: true,
        message: "Avatar deleted",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting avatar:", error);
      res.status(500).json({
        error: "Failed to delete avatar",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * POST /v1/avatars/me/presign
 * Request presigned PUT URL for direct-to-object storage uploads (s3 mode)
 */
router.post(
  "/me/presign",
  limiters.general,
  authenticate,
  requireScope("user:avatar"),
  async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId)
        return res.status(401).json({ ok: false, error: "Unauthorized" });

      const out = await handlePresign(userId, req.body);
      if (!out.ok) return res.status(400).json(out);
      return res.json(out);
    } catch (error) {
      res
        .status(400)
        .json({
          ok: false,
          error: error instanceof Error ? error.message : "presign failed",
        });
    }
  },
);

/**
 * POST /v1/avatars/me/complete
 * Finalize S3 upload by storing avatar metadata
 */
router.post(
  "/me/complete",
  limiters.general,
  authenticate,
  requireScope("user:avatar"),
  async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId)
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      if (storageMode !== "s3") {
        return res
          .status(400)
          .json({ ok: false, error: "complete requires AVATAR_STORAGE=s3" });
      }

      await initializeStore();

      const Schema = z.object({
        name: z.string().min(1).max(120),
        publicUrl: z.string().url(),
        key: z.string().optional(),
      });

      const body = Schema.parse(req.body);

      const avatar = {
        userId,
        uploadedAt: new Date().toISOString(),
        fileName: body.key || body.publicUrl,
        fileSize: 0,
        mimeType: "remote",
        selected: false,
        storage: "s3" as const,
        url: body.publicUrl,
        name: body.name,
      };

      await addAvatar(avatar);

      return res.json({ ok: true, avatar: toResponseAvatar(avatar) });
    } catch (error) {
      res
        .status(400)
        .json({
          ok: false,
          error: error instanceof Error ? error.message : "complete failed",
        });
    }
  },
);

/**
 * GET /v1/avatars/stats
 * Get avatar store statistics (admin only)
 */
router.get(
  "/stats",
  limiters.general,
  authenticate,
  requireScope("admin"),
  async (req, res) => {
    try {
      await initializeStore();
      const stats = await getStoreStats();

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error retrieving stats:", error);
      res.status(500).json({
        error: "Failed to retrieve statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
