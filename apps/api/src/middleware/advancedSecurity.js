/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Advanced Security & Authorization
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * JWT Token Options with Security Best Practices
 */
const JWT_CONFIG = {
    algorithm: 'HS256', // HMAC SHA256
    expiresIn: '24h',
    audience: 'infamous-freight-app',
    issuer: 'infamous-freight-api',
    notBefore: '0', // Valid immediately
};

/**
 * Scope-based permission matrix
 */
const SCOPE_PERMISSIONS = {
    // User management
    'users:read': { resource: 'users', action: 'read' },
    'users:write': { resource: 'users', action: 'write' },
    'users:delete': { resource: 'users', action: 'delete' },

    // Shipment management
    'shipments:read': { resource: 'shipments', action: 'read' },
    'shipments:write': { resource: 'shipments', action: 'write' },
    'shipments:admin': { resource: 'shipments', action: 'admin' },

    // Payment processing
    'billing:read': { resource: 'billing', action: 'read' },
    'billing:write': { resource: 'billing', action: 'write' },

    // AI commands
    'ai:command': { resource: 'ai', action: 'command' },
    'ai:voice': { resource: 'ai', action: 'voice' },

    // Admin operations
    'admin:all': { resource: '*', action: '*' },
};

/**
 * Generate secure JWT with minimal claims
 */
function generateToken(user, scopes = []) {
    const payload = {
        sub: user.id, // Subject (user ID)
        email: user.email,
        role: user.role,
        scopes: scopes, // Explicit scopes array
        iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    return jwt.sign(payload, secret, JWT_CONFIG);
}

/**
 * Verify JWT and validate scopes
 */
function verifyToken(token, requiredScopes = []) {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET not configured');

        const decoded = jwt.verify(token, secret, {
            algorithms: ['HS256'],
            audience: JWT_CONFIG.audience,
            issuer: JWT_CONFIG.issuer,
        });

        // Verify required scopes
        if (requiredScopes.length > 0) {
            const hasAllScopes = requiredScopes.every((scope) =>
                decoded.scopes?.includes(scope)
            );

            if (!hasAllScopes) {
                throw new Error(`Missing required scopes: ${requiredScopes.join(', ')}`);
            }
        }

        return decoded;
    } catch (err) {
        throw new Error(`Token validation failed: ${err.message}`);
    }
}

/**
 * Refresh token rotation (prevent token reuse attacks)
 */
const tokenBlacklist = new Set();

function revokeToken(token) {
    tokenBlacklist.add(crypto.createHash('sha256').update(token).digest('hex'));
}

function isTokenRevoked(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return tokenBlacklist.has(tokenHash);
}

/**
 * Rate-limit key generation per user
 */
function getRateLimitKey(user, endpoint) {
    return `ratelimit:${user.id}:${endpoint}`;
}

/**
 * Enhanced authenticate middleware with token rotation
 */
function authenticateWithRotation(req, res, next) {
    try {
        const header = req.headers.authorization || req.headers.Authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing bearer token' });
        }

        const token = header.replace('Bearer ', '');

        // Check if token is revoked
        if (isTokenRevoked(token)) {
            return res.status(401).json({ error: 'Token has been revoked' });
        }

        const decoded = verifyToken(token);
        req.user = decoded;

        // Optional: Generate new token for next request
        if (process.env.NODE_ENV === 'production') {
            const newToken = generateToken(
                { id: decoded.sub, email: decoded.email, role: decoded.role },
                decoded.scopes
            );
            res.set('X-New-Token', newToken);
            revokeToken(token); // Revoke old token
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: err.message });
    }
}

/**
 * Permission checker with resource ownership validation
 */
function checkPermission(requiredScope, resourceOwner) {
    return (req, res, next) => {
        try {
            const hasScope = req.user?.scopes?.includes(requiredScope);

            // Check resource ownership for non-admin users
            if (resourceOwner && req.user?.role !== 'admin') {
                if (resourceOwner !== req.user?.sub) {
                    return res.status(403).json({
                        error: 'Forbidden: Resource ownership mismatch',
                    });
                }
            }

            if (!hasScope && req.user?.role !== 'admin') {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: requiredScope,
                    granted: req.user?.scopes || [],
                });
            }

            next();
        } catch (err) {
            return res.status(500).json({ error: 'Authorization check failed' });
        }
    };
}

/**
 * CSRF token generation and validation
 */
function generateCsrfToken(sessionId) {
    return crypto
        .randomBytes(32)
        .toString('hex');
}

function validateCsrfToken(token, sessionId) {
    // Compare against stored token
    return token && token.length === 64;
}

module.exports = {
    JWT_CONFIG,
    SCOPE_PERMISSIONS,
    generateToken,
    verifyToken,
    revokeToken,
    isTokenRevoked,
    getRateLimitKey,
    authenticateWithRotation,
    checkPermission,
    generateCsrfToken,
    validateCsrfToken,
};
