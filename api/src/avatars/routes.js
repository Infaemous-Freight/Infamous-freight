/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Avatar API Routes
 * Purpose: System avatar retrieval, user avatar upload/management, and avatar selection
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { body, param } = require('express-validator');
const {
    listUserAvatars,
    createUserAvatar,
    deleteUserAvatar,
    getSelection,
    setSelection,
} = require('./store');
const { getUserId } = require('../auth/user');
const { authenticate, requireScope, limiters, auditLog } = require('../middleware/security');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// ==================== SYSTEM AVATARS ====================

/**
 * GET /api/avatars/system
 * Retrieve all featured system avatars (shipped defaults)
 */
router.get('/system', limiters.general, (req, res) => {
    const featured = [
        {
            id: 'main-01',
            name: 'Infinity Operator',
            imageUrl: '/avatars/main/main-01.png',
            type: 'system',
        },
        {
            id: 'main-02',
            name: 'Crimson Neural',
            imageUrl: '/avatars/main/main-02.png',
            type: 'system',
        },
        {
            id: 'main-03',
            name: 'Golden Sphinx Core',
            imageUrl: '/avatars/main/main-03.png',
            type: 'system',
        },
        {
            id: 'main-04',
            name: 'Pharaoh Circuit',
            imageUrl: '/avatars/main/main-04.png',
            type: 'system',
        },
    ];

    res.status(200).json({
        success: true,
        data: {
            featured,
        },
    });
});

// ==================== USER AVATARS ====================

// Configure multer for avatar uploads
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const name = `${crypto.randomBytes(16).toString('hex')}${ext}`;
            cb(null, name);
        },
    }),
    limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`), false);
        }
    },
});

/**
 * GET /api/avatars/user
 * List all user-uploaded avatars for the authenticated user
 */
router.get(
    '/user',
    limiters.general,
    authenticate,
    auditLog,
    (req, res) => {
        const userId = getUserId(req);
        const avatars = listUserAvatars(userId);

        res.status(200).json({
            success: true,
            data: {
                avatars,
                count: avatars.length,
            },
        });
    }
);

/**
 * POST /api/avatars/user/upload
 * Upload a new personal avatar
 */
router.post(
    '/user/upload',
    limiters.general,
    authenticate,
    auditLog,
    upload.single('avatar'),
    [
        body('name')
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Avatar name required (1-100 chars)'),
    ],
    handleValidationErrors,
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
            });
        }

        const userId = getUserId(req);
        const { name } = req.body;

        // Construct URL relative to public folder
        const imageUrl = `/uploads/avatars/${req.file.filename}`;

        const avatar = createUserAvatar({
            id: uuidv4(),
            ownerUserId: userId,
            name: name || 'Untitled Avatar',
            imageUrl,
        });

        res.status(201).json({
            success: true,
            data: {
                avatar,
                message: 'Avatar uploaded successfully',
            },
        });
    }
);

/**
 * DELETE /api/avatars/user/:avatarId
 * Delete a user-uploaded avatar
 */
router.delete(
    '/user/:avatarId',
    limiters.general,
    authenticate,
    auditLog,
    [param('avatarId').isUUID().withMessage('Invalid avatar ID')],
    handleValidationErrors,
    (req, res) => {
        const userId = getUserId(req);
        const { avatarId } = req.params;

        const deleted = deleteUserAvatar(avatarId, userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Avatar not found or not owned by this user',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Avatar deleted successfully',
        });
    }
);

// ==================== AVATAR SELECTION ====================

/**
 * GET /api/avatars/selection
 * Get the authenticated user's current avatar selection
 */
router.get(
    '/selection',
    limiters.general,
    authenticate,
    auditLog,
    (req, res) => {
        const userId = getUserId(req);
        const selection = getSelection(userId);

        res.status(200).json({
            success: true,
            data: {
                selection: selection || { type: 'system', id: 'main-01' },
            },
        });
    }
);

/**
 * POST /api/avatars/selection
 * Set the authenticated user's avatar selection
 */
router.post(
    '/selection',
    limiters.general,
    authenticate,
    auditLog,
    [
        body('type')
            .isIn(['system', 'user'])
            .withMessage('Type must be "system" or "user"'),
        body('id')
            .isString()
            .trim()
            .notEmpty()
            .withMessage('Avatar ID required'),
    ],
    handleValidationErrors,
    (req, res) => {
        const userId = getUserId(req);
        const { type, id } = req.body;

        // Validate ownership for user avatars
        if (type === 'user') {
            const avatars = listUserAvatars(userId);
            if (!avatars.find(a => a.id === id)) {
                return res.status(403).json({
                    success: false,
                    error: 'Avatar not owned by this user',
                });
            }
        }

        const selection = setSelection(userId, { type, id });

        res.status(200).json({
            success: true,
            data: {
                selection,
                message: 'Avatar selection updated',
            },
        });
    }
);

// ==================== ERROR HANDLING ====================

// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                success: false,
                error: 'File size exceeds 6 MB limit',
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message || 'File upload error',
        });
    }
    if (err && err.message) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }
    next(err);
});

module.exports = router;
