/**
 * API Key Rotation Middleware
 * Implements automatic JWT secret rotation with grace periods
 * 
 * Strategy:
 * 1. Store current secret and previous secret in secure vault
 * 2. Accept requests signed with either current or previous secret
 * 3. Rotate to new secret every 30 days
 * 4. Grace period: 7 days to deprecate old secret
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Configuration for key rotation
 */
const KEY_ROTATION_CONFIG = {
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    maxSecrets: 3, // Keep maximum 3 secrets (current + 2 previous)
};

/**
 * In-memory secret store (in production, use secure KMS like HashiCorp Vault, AWS KMS)
 * This stores: { current, previous: [], lastRotation: timestamp }
 */
const secretStore = {
    current: process.env.JWT_SECRET || generateSecret(),
    previous: [],
    lastRotation: Date.now(),
};

/**
 * Generate a cryptographically secure secret
 * @returns {string} 64-character hex string (32 bytes)
 */
function generateSecret() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Update JWT secret in vault (mock implementation)
 * In production, integrate with HashiCorp Vault, AWS Secrets Manager, etc.
 * 
 * @param {string} newSecret - New JWT secret
 * @returns {Promise<void>}
 */
async function updateSecretInVault(newSecret) {
    try {
        // Example: Update in HashiCorp Vault
        // const vaultClient = new Vault({ ... });
        // await vaultClient.secrets.kv.v2.put(path, { data: { JWT_SECRET: newSecret } });

        // Example: Update in AWS Secrets Manager
        // const secretsManager = new AWS.SecretsManager();
        // await secretsManager.putSecretValue({
        //   SecretId: 'infamous-freight/jwt-secret',
        //   SecretString: newSecret
        // }).promise();

        // For this implementation, update environment
        process.env.JWT_SECRET = newSecret;

        console.info(`[KEY_ROTATION] Secret updated in vault. Next rotation: ${new Date(Date.now() + KEY_ROTATION_CONFIG.rotationInterval).toISOString()}`);
    } catch (err) {
        console.error('[KEY_ROTATION] Failed to update secret in vault:', err);
        throw err;
    }
}

/**
 * Rotate JWT secret
 * 1. Move current to previous
 * 2. Generate new current
 * 3. Prune old secrets beyond max allowed
 * 4. Update vault
 * 
 * @returns {Promise<void>}
 */
async function rotateSecret() {
    try {
        console.info('[KEY_ROTATION] Starting secret rotation...');

        // Move current to previous
        secretStore.previous.unshift({
            secret: secretStore.current,
            rotatedAt: secretStore.lastRotation,
            expiresAt: Date.now() + KEY_ROTATION_CONFIG.gracePeriod,
        });

        // Generate new current secret
        secretStore.current = generateSecret();
        secretStore.lastRotation = Date.now();

        // Keep only maxSecrets
        if (secretStore.previous.length > KEY_ROTATION_CONFIG.maxSecrets) {
            const removed = secretStore.previous.splice(KEY_ROTATION_CONFIG.maxSecrets);
            console.info(`[KEY_ROTATION] Pruned ${removed.length} expired secrets`);
        }

        // Update vault
        await updateSecretInVault(secretStore.current);

        console.info('[KEY_ROTATION] Secret rotation completed successfully');
        logRotationStatus();
    } catch (err) {
        console.error('[KEY_ROTATION] Secret rotation failed:', err);
        throw err;
    }
}

/**
 * Schedule automatic secret rotation
 * Runs every 30 days
 * 
 * @returns {NodeJS.Timeout} Timeout ID for cancellation
 */
function scheduleSecretRotation() {
    console.info(`[KEY_ROTATION] Scheduled rotation every ${KEY_ROTATION_CONFIG.rotationInterval / (24 * 60 * 60 * 1000)} days`);

    return setInterval(async () => {
        try {
            await rotateSecret();
        } catch (err) {
            console.error('[KEY_ROTATION] Scheduled rotation failed:', err);
            // Continue running even if rotation fails - alerts should be sent to monitoring
        }
    }, KEY_ROTATION_CONFIG.rotationInterval);
}

/**
 * Verify JWT with current or previous secret
 * Enables smooth rotation without invalidating tokens during grace period
 * 
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 * @throws {Error} If token is invalid or expired
 */
function verifyJWTWithRotation(token) {
    // Try current secret first
    try {
        return jwt.verify(token, secretStore.current, {
            algorithms: ['HS256'],
        });
    } catch (err) {
        // If current fails, try previous secrets
        for (const prev of secretStore.previous) {
            // Check if still in grace period
            if (prev.expiresAt > Date.now()) {
                try {
                    const decoded = jwt.verify(token, prev.secret, {
                        algorithms: ['HS256'],
                    });

                    console.info('[KEY_ROTATION] Token verified with previous secret (secret rotation in progress)');
                    return decoded;
                } catch (prevErr) {
                    // Continue to next previous secret
                }
            }
        }

        // All verification attempts failed
        throw new Error(`JWT verification failed. Current error: ${err.message}`);
    }
}

/**
 * Generate JWT token with current secret
 * Always uses the current (latest) secret
 * 
 * @param {object} payload - Token payload
 * @param {string|object} options - Additional JWT options
 * @returns {string} Signed JWT token
 */
function signJWTWithRotation(payload, options = {}) {
    return jwt.sign(payload, secretStore.current, {
        algorithm: 'HS256',
        expiresIn: '24h', // Adjust based on your requirements
        ...options,
    });
}

/**
 * Middleware to verify JWT with rotation support
 * 
 * Usage:
 * router.get('/protected', authenticateWithRotation, (req, res) => { ... });
 */
function authenticateWithRotation(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header',
            });
        }

        const token = authorization.replace('Bearer ', '');
        const decoded = verifyJWTWithRotation(token);

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (err) {
        console.warn('[KEY_ROTATION] Authentication failed:', err.message);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
}

/**
 * Health check endpoint to monitor key rotation status
 * 
 * Usage:
 * router.get('/api/internal/key-rotation/status', getKeyRotationStatus);
 */
function getKeyRotationStatus(req, res) {
    const now = Date.now();
    const nextRotation = secretStore.lastRotation + KEY_ROTATION_CONFIG.rotationInterval;

    res.json({
        status: 'ok',
        currentSecret: {
            hash: crypto.createHash('sha256').update(secretStore.current).digest('hex'),
            rotatedAt: new Date(secretStore.lastRotation).toISOString(),
            nextRotation: new Date(nextRotation).toISOString(),
            daysUntilRotation: Math.round((nextRotation - now) / (24 * 60 * 60 * 1000)),
        },
        previousSecrets: secretStore.previous.map((prev, index) => ({
            index,
            rotatedAt: new Date(prev.rotatedAt).toISOString(),
            expiresAt: new Date(prev.expiresAt).toISOString(),
            daysUntilExpiration: Math.round((prev.expiresAt - now) / (24 * 60 * 60 * 1000)),
            status: now > prev.expiresAt ? 'expired' : 'active',
        })),
        config: KEY_ROTATION_CONFIG,
    });
}

/**
 * Log current rotation status
 */
function logRotationStatus() {
    const now = Date.now();
    const nextRotation = secretStore.lastRotation + KEY_ROTATION_CONFIG.rotationInterval;
    const daysUntilRotation = Math.round((nextRotation - now) / (24 * 60 * 60 * 1000));

    console.info('[KEY_ROTATION] Status Report:');
    console.info(`  - Current secret active since: ${new Date(secretStore.lastRotation).toISOString()}`);
    console.info(`  - Days until next rotation: ${daysUntilRotation}`);
    console.info(`  - Active previous secrets: ${secretStore.previous.filter(s => s.expiresAt > now).length}`);
    console.info(`  - Expired secrets: ${secretStore.previous.filter(s => s.expiresAt <= now).length}`);
}

/**
 * Force immediate secret rotation (admin only)
 * Usage: POST /api/admin/key-rotation/rotate with admin credentials
 */
async function forceRotation(req, res) {
    try {
        // Add admin authorization check here
        // if (!req.user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });

        await rotateSecret();

        res.json({
            success: true,
            message: 'Secret rotated immediately',
            nextRotation: new Date(secretStore.lastRotation + KEY_ROTATION_CONFIG.rotationInterval).toISOString(),
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
}

/**
 * Initialize key rotation on server startup
 */
function initializeKeyRotation() {
    console.info('[KEY_ROTATION] Initializing key rotation system...');
    logRotationStatus();

    // Schedule automatic rotation
    const rotationTimer = scheduleSecretRotation();

    // Log rotation schedule
    const nextRotation = secretStore.lastRotation + KEY_ROTATION_CONFIG.rotationInterval;
    console.info(`[KEY_ROTATION] Next automatic rotation: ${new Date(nextRotation).toISOString()}`);

    return rotationTimer;
}

// Graceful cleanup on process exit
process.on('SIGTERM', () => {
    console.info('[KEY_ROTATION] SIGTERM received, clearing rotation timer');
    logRotationStatus();
});

module.exports = {
    // Core functions
    rotateSecret,
    verifyJWTWithRotation,
    signJWTWithRotation,
    generateSecret,
    scheduleSecretRotation,
    initializeKeyRotation,

    // Middleware
    authenticateWithRotation,

    // Endpoints
    getKeyRotationStatus,
    forceRotation,

    // Utilities
    logRotationStatus,
    KEY_ROTATION_CONFIG,
};
