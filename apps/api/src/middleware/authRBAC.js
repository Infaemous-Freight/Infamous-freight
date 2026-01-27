/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Enhanced Auth Middleware with RBAC + JWT Claims
 */

const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { ROLE_PERMISSIONS, UserRole } = require("@infamous-freight/shared");

/**
 * Enhanced authenticate middleware with RBAC claims
 * Attaches user + permissions to req.user
 */
function authenticateWithRBAC(req, res, next) {
    try {
        const header = req.headers.authorization || req.headers.Authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing bearer token" });
        }

        const token = header.replace("Bearer ", "");
        const secret = env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({ error: "Server auth misconfiguration" });
        }

        const payload = jwt.verify(token, secret);

        // Extract role and resolve permissions
        const role = payload.role || UserRole.VIEWER;
        const permissions = ROLE_PERMISSIONS[role] || [];

        // Attach to request
        req.user = {
            sub: payload.sub,
            email: payload.email,
            role,
            permissions,
            org_id: payload.org_id,
            iat: payload.iat,
            exp: payload.exp
        };

        // Inject Prisma if available (for downstream middleware/routes)
        if (global.prisma) {
            req.prisma = global.prisma;
        }

        // Inject agent engine if available
        if (global.agentEngine) {
            req.agentEngine = global.agentEngine;
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/**
 * Create JWT token with RBAC claims
 */
function createToken(userId, email, role = UserRole.VIEWER) {
    const secret = env.JWT_SECRET;
    const permissions = ROLE_PERMISSIONS[role] || [];

    const claims = {
        sub: userId,
        email,
        role,
        permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
    };

    return jwt.sign(claims, secret);
}

/**
 * Verify token and return claims
 */
function verifyToken(token) {
    const secret = env.JWT_SECRET;
    return jwt.verify(token, secret);
}

module.exports = {
    authenticateWithRBAC,
    createToken,
    verifyToken
};
