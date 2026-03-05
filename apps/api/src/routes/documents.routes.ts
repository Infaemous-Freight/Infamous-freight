import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { prisma } from '../lib/prisma.js';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

export const documentsRoutes = Router();
documentsRoutes.use(requireAuth, requireTenant);

documentsRoutes.post(
  '/upload',
  requireRole(['OWNER', 'ADMIN', 'BROKER', 'SHIPPER', 'CARRIER_ADMIN', 'DRIVER']),
  upload.single('file'),
  async (req, res) => {
    const orgId = req.orgId!;
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
