/**
 * API Key Rotation Utility
 * 
 * Generates and rotates JWT secrets, API keys, and other sensitive credentials.
 * Run periodically (e.g., every 30-90 days) to limit blast radius if keys are compromised.
 * 
 * Usage:
 * ```bash
 * # Generate new JWT secret
 * node apps/api/scripts/rotate-keys.js jwt
 * 
 * # Generate new API key
 * node apps/api/scripts/rotate-keys.js api
 * 
 * # Rotate all keys
 * node apps/api/scripts/rotate-keys.js all
 * ```
 * 
 * After generating new keys:
 * 1. Update environment variables (Vercel, Fly.io, etc.)
 * 2. Schedule token invalidation after grace period
 * 3. Notify team of rotation
 * 4. Update documentation
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a cryptographically secure random string
 * 
 * @param {number} bytes - Number of random bytes to generate
 * @returns {string} Hex-encoded random string
 */
function generateSecret(bytes = 64) {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a JWT secret
 * Length: 128 characters (64 bytes)
 * 
 * @returns {object} New JWT secret and metadata
 */
function generateJWTSecret() {
    const secret = generateSecret(64);
    const createdAt = new Date().toISOString();

    return {
        secret,
        createdAt,
        algorithm: 'HS256',
        expiresIn: '7d', // Consider shorter for higher security
    };
}

/**
 * Generate an API key with prefix
 * Format: ife_live_<random> or ife_test_<random>
 * 
 * @param {string} environment - 'live' or 'test'
 * @returns {object} New API key and metadata
 */
function generateAPIKey(environment = 'live') {
    const prefix = `ife_${environment}_`;
    const random = generateSecret(32); // 64 characters
    const apiKey = prefix + random;

    return {
        apiKey,
        prefix,
        environment,
        createdAt: new Date().toISOString(),
        // Store hash of API key in database, not the key itself
        hash: crypto.createHash('sha256').update(apiKey).digest('hex'),
    };
}

/**
 * Generate webhook signing secret
 * Used to verify webhooks from Stripe, PayPal, etc.
 * 
 * @returns {object} New webhook secret
 */
function generateWebhookSecret() {
    const secret = generateSecret(32);

    return {
        secret: `whsec_${secret}`,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Generate encryption key for data at rest
 * AES-256 requires 32 bytes (256 bits)
 * 
 * @returns {object} New encryption key
 */
function generateEncryptionKey() {
    const key = generateSecret(32); // 32 bytes = 256 bits

    return {
        key,
        algorithm: 'aes-256-gcm',
        createdAt: new Date().toISOString(),
        keyId: crypto.randomBytes(8).toString('hex'), // Unique key ID
    };
}

/**
 * Rotate JWT secret with grace period
 * 
 * Steps:
 * 1. Generate new secret
 * 2. Store both old and new secrets temporarily (grace period)
 * 3. Accept tokens signed with either secret during grace period
 * 4. After grace period, invalidate old tokens
 * 
 * @param {number} gracePeriodDays - Days to accept old tokens (default: 7)
 */
function rotateJWTSecret(gracePeriodDays = 7) {
    const newSecret = generateJWTSecret();
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    console.log('=== JWT SECRET ROTATION ===\n');
    console.log('New JWT Secret (store securely):');
    console.log(newSecret.secret);
    console.log('\nMetadata:');
    console.log(JSON.stringify({
        ...newSecret,
        secret: '[REDACTED]',
        gracePeriodEnd: gracePeriodEnd.toISOString(),
    }, null, 2));

    console.log('\n⚠️  IMPORTANT: Grace Period Management');
    console.log('1. Store old secret as JWT_SECRET_OLD');
    console.log('2. Store new secret as JWT_SECRET');
    console.log('3. Update middleware to accept both during grace period');
    console.log(`4. After ${gracePeriodDays} days (${gracePeriodEnd.toLocaleDateString()}), remove JWT_SECRET_OLD`);

    console.log('\nVercel deployment:');
    console.log(`  npx vercel env add JWT_SECRET --scope infaemous`);
    console.log('  (paste new secret when prompted)');

    console.log('\nFly.io deployment:');
    console.log(`  flyctl secrets set JWT_SECRET="${newSecret.secret}" --app infamous-freight-as-3gw`);

    return newSecret;
}

/**
 * Rotate API key
 * 
 * @param {string} environment - 'live' or 'test'
 */
function rotateAPIKey(environment = 'live') {
    const newKey = generateAPIKey(environment);

    console.log('=== API KEY ROTATION ===\n');
    console.log(`New ${environment.toUpperCase()} API Key:`);
    console.log(newKey.apiKey);
    console.log('\nKey Hash (store in database):');
    console.log(newKey.hash);
    console.log('\nMetadata:');
    console.log(JSON.stringify({
        ...newKey,
        apiKey: '[REDACTED]',
    }, null, 2));

    console.log('\n⚠️  IMPORTANT: Key Rotation Steps');
    console.log('1. Add new key to database with status "pending"');
    console.log('2. Notify API consumers of new key');
    console.log('3. Monitor usage of old vs new keys');
    console.log('4. After 30 days, mark old key as "deprecated"');
    console.log('5. After 90 days, revoke old key completely');

    return newKey;
}

/**
 * Generate secure revalidation secret for ISR
 * Used in /api/revalidate endpoint
 */
function generateRevalidateSecret() {
    const secret = generateSecret(32);

    console.log('=== REVALIDATE SECRET ===\n');
    console.log('Secret (for ISR on-demand revalidation):');
    console.log(secret);
    console.log('\nUsage:');
    console.log(`  POST /api/revalidate?secret=${secret}&path=/`);
    console.log('\nAdd to environment:');
    console.log(`  REVALIDATE_SECRET="${secret}"`);

    return { secret, createdAt: new Date().toISOString() };
}

/**
 * Save rotation log
 * Keep audit trail of all key rotations
 */
function logRotation(type, data) {
    const logDir = path.join(__dirname, '..', 'logs');
    const logFile = path.join(logDir, 'key-rotations.log');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        keyId: data.keyId || crypto.randomBytes(8).toString('hex'),
        metadata: {
            ...data,
            secret: '[REDACTED]',
            apiKey: '[REDACTED]',
            key: '[REDACTED]',
        },
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    console.log(`\n✓ Rotation logged to ${logFile}`);
}

/**
 * Main CLI
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('╔═══════════════════════════════════════╗');
    console.log('║   INFAMOUS FREIGHT KEY ROTATION       ║');
    console.log('╚═══════════════════════════════════════╝\n');

    switch (command) {
        case 'jwt':
            const jwtSecret = rotateJWTSecret();
            logRotation('jwt_secret', jwtSecret);
            break;

        case 'api':
            const env = args[1] || 'live';
            const apiKey = rotateAPIKey(env);
            logRotation('api_key', apiKey);
            break;

        case 'webhook':
            const webhookSecret = generateWebhookSecret();
            console.log('=== WEBHOOK SECRET ===\n');
            console.log('New secret:', webhookSecret.secret);
            logRotation('webhook_secret', webhookSecret);
            break;

        case 'encryption':
            const encKey = generateEncryptionKey();
            console.log('=== ENCRYPTION KEY ===\n');
            console.log('New key:', encKey.key);
            console.log('Key ID:', encKey.keyId);
            console.log('\n⚠️  Store in Key Management Service (KMS, Vault, etc.)');
            logRotation('encryption_key', encKey);
            break;

        case 'revalidate':
            const revalidateSecret = generateRevalidateSecret();
            logRotation('revalidate_secret', revalidateSecret);
            break;

        case 'all':
            console.log('Rotating all secrets...\n');
            const all = {
                jwt: rotateJWTSecret(),
                apiLive: rotateAPIKey('live'),
                apiTest: rotateAPIKey('test'),
                webhook: generateWebhookSecret(),
                encryption: generateEncryptionKey(),
                revalidate: generateRevalidateSecret(),
            };
            logRotation('full_rotation', { timestamp: new Date().toISOString() });
            break;

        default:
            console.log('Usage: node rotate-keys.js <command>\n');
            console.log('Commands:');
            console.log('  jwt           - Rotate JWT secret');
            console.log('  api [env]     - Rotate API key (env: live|test)');
            console.log('  webhook       - Generate webhook secret');
            console.log('  encryption    - Generate encryption key');
            console.log('  revalidate    - Generate ISR revalidate secret');
            console.log('  all           - Rotate all secrets\n');
            console.log('Examples:');
            console.log('  node rotate-keys.js jwt');
            console.log('  node rotate-keys.js api live');
            console.log('  node rotate-keys.js all');
            process.exit(1);
    }

    console.log('\n✓ Key rotation complete');
    console.log('⚠️  Remember to:');
    console.log('  1. Update environment variables in all environments');
    console.log('  2. Store secrets securely (1Password, Vault, etc.)');
    console.log('  3. Set reminders for next rotation (30-90 days)');
    console.log('  4. Monitor for any authentication failures');
    console.log('  5. Update documentation with rotation date');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateJWTSecret,
    generateAPIKey,
    generateWebhookSecret,
    generateEncryptionKey,
    rotateJWTSecret,
    rotateAPIKey,
};
