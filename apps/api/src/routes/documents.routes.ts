import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'node:module';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { prisma } from '../db/prisma.js';

const require = createRequire(import.meta.url);
const { requireRole } = require('../middleware/rbac.cjs');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const ALLOWED_EXTENSIONS = new Set<string>([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.txt',
  '.doc',
  '.docx'
]);

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
    const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);

    if (isMimeAllowed && isExtAllowed) {
      return cb(null, true);
    }

    return cb(new Error('Invalid file type'));
  }
});

export const documentsRoutes: Router = Router();
documentsRoutes.use(requireAuth, requireTenant);

documentsRoutes.post(
  '/upload',
  requireRole(['OWNER', 'ADMIN', 'BROKER', 'SHIPPER', 'CARRIER_ADMIN', 'DRIVER']),
  upload.single('file'),
  async (req, res) => {
    const orgId =
      // Prefer organization context set by auth middleware, fall back to any legacy `req.orgId`
      ((req as any).auth && (req as any).auth.organizationId) || (req as any).orgId;

    if (!orgId) {
      return res.status(400).json({ error: 'Missing organization context' });
    }
    const shipmentId = String(req.body.shipmentId || '');
    const type = String(req.body.type || 'OTHER');

    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    // dev URL (served by /uploads static)
    const fileUrl = `/uploads/${path.basename(req.file.path)}`;

    const doc = await prisma.document.create({
      data: {
        orgId,
        shipmentId: shipmentId || null,
        type: type as any,
        fileUrl
      }
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: 'DOCUMENT_UPLOADED',
        entity: 'Document',
        entityId: doc.id,
        metaJson: JSON.stringify({ shipmentId, type, fileUrl })
      }
    });

    res.json(doc);
  }
);
