/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Token Rotation per Request
 *
 * Implements automatic JWT token rotation on each response to enhance security.
 * Prevents token compromise from being usable for extended periods.
 */

const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

/**
 * Token rotation middleware
 *
 * Automatically generates a new token on each successful response
 * and sends it via custom header for client to use on next request
 */
function tokenRotationMiddleware(req, res, next) {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to inject token rotation
    res.json = function (data) {
        // Only rotate in production and if we have a user authenticated
        if (req.user && process.env.NODE_ENV === 'production') {
            try {
                const newToken = generateNewToken(req.user);
                res.set('X-New-Token', newToken);

                if (process.env.ENABLE_QUERY_LOGGING === 'true') {
                    logger.debug({
                        userId: req.user.sub,
                        oldTokenExp: req.user.exp,
                    }, 'Token rotated');
                }
            } catch (err) {
                logger.error({
                    error: err.message,
                    userId: req.user?.sub,
                }, 'Failed to rotate token');
                // Don't fail the request if token rotation fails
            }
        }

        // Call original json method
        return originalJson(data);
    };

    next();
}

/**
 * Generate new JWT token with preserved claims
 */
function generateNewToken(userPayload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }

    const payload = {
        sub: userPayload.sub,
        email: userPayload.email,
        role: userPayload.role,
        scopes: userPayload.scopes,
        org_id: userPayload.org_id,
    };

    const expiresIn = process.env.JWT_EXPIRY || '1h';

    return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'infamous-freight-api',
        audience: 'infamous-freight-clients',
    });
}

/**
 * Extract new token from response headers
 *
 * Client-side helper to automatically use rotated tokens
 */
function extractNewToken(response) {
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
        // Store in localStorage for use on next request
        if (typeof window !== 'undefined') {
            localStorage.setItem('jwt_token', newToken);
        }
    }
    return newToken;
}

/**
 * Fetch wrapper for automatic token rotation on client
 */
async function fetchWithTokenRotation(url, options = {}) {
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('jwt_token')
        : null;

    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Extract and store rotated token
    extractNewToken(response);

    return response;
}

module.exports = {
    tokenRotationMiddleware,
    generateNewToken,
    extractNewToken,
    fetchWithTokenRotation,
};
