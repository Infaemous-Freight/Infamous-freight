/**
 * Webhook Request Signing & Verification
 *
 * Implements HMAC-SHA256 signing for webhook payloads to ensure authenticity
 * Clients can verify the signature to ensure the request came from Infamous
 */

const crypto = require('crypto');
const { logger } = require('./logger');

/**
 * Sign webhook payload
 *
 * Creates signed message that includes timestamp and signature
 */
function signWebhookPayload(payload, secret = process.env.WEBHOOK_SECRET) {
    if (!secret) {
        throw new Error('WEBHOOK_SECRET not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const payloadJson = JSON.stringify(payload);

    // Create signed message: timestamp.payload
    const message = `${timestamp}.${payloadJson}`;

    // Generate signature
    const signature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

    return {
        payload,
        timestamp,
        signature,
        // Header format: t=<timestamp>,v1=<signature>
        header: `t=${timestamp},v1=${signature}`,
    };
}

/**
 * Verify webhook signature
 *
 * Validates that webhook came from Infamous and hasn't been tampered with
 */
function verifyWebhookSignature(signatureHeader, payload, secret = process.env.WEBHOOK_SECRET) {
    if (!secret) {
        throw new Error('WEBHOOK_SECRET not configured');
    }

    if (!signatureHeader) {
        throw new Error('Missing signature header');
    }

    // Parse signature header: t=<timestamp>,v1=<signature>
    const parts = signatureHeader.split(',');
    let timestamp = null;
    let signature = null;

    for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 't') {
            timestamp = parseInt(value);
        } else if (key === 'v1') {
            signature = value;
        }
    }

    if (!timestamp || !signature) {
        throw new Error('Invalid signature header format');
    }

    // Check timestamp (webhook must be within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;
    const maxAge = 5 * 60;  // 5 minutes

    if (age > maxAge || age < 0) {
        throw new Error(`Webhook timestamp outside acceptable range: ${age}s old`);
    }

    // Recreate signed message
    const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${timestamp}.${payloadJson}`;

    // Compute expected signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
        throw new Error('Webhook signature does not match');
    }

    return true;
}

/**
 * Webhook verification middleware
 *
 * Use on webhook receiving endpoints to verify requests
 */
function verifyWebhookMiddleware(req, res, next) {
    try {
        const signatureHeader = req.headers['x-infamous-signature'] ||
            req.headers['x-webhook-signature'];

        if (!signatureHeader) {
            return res.status(400).json({
                error: 'Missing signature header',
                header: 'X-Infamous-Signature',
            });
        }

        // Get raw body for verification (must be before JSON parsing)
        const rawBody = req.rawBody || JSON.stringify(req.body);

        verifyWebhookSignature(signatureHeader, rawBody);

        // Mark as verified
        req.webhookVerified = true;

        logger.info({
            webhookType: req.headers['x-webhook-type'],
            timestamp: req.headers['x-webhook-timestamp'],
        }, 'Webhook signature verified');

        next();
    } catch (err) {
        logger.error({
            error: err.message,
            header: req.headers['x-infamous-signature'],
        }, 'Webhook signature verification failed');

        res.status(401).json({
            error: 'Webhook signature verification failed',
            message: err.message,
        });
    }
}

/**
 * Send signed webhook to client
 *
 * Use when pushing webhooks to external services
 */
async function sendSignedWebhook(url, payload, options = {}) {
    const secret = options.secret || process.env.WEBHOOK_SECRET;

    if (!secret) {
        throw new Error('WEBHOOK_SECRET not configured');
    }

    const { header, timestamp } = signWebhookPayload(payload, secret);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Infamous-Signature': header,
            'X-Webhook-Type': options.type || 'unknown',
            'X-Webhook-Timestamp': timestamp.toString(),
            'User-Agent': 'Infamous-Freight-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
        timeout: options.timeout || 10000,
    });

    if (!response.ok) {
        logger.error({
            url,
            status: response.status,
            statusText: response.statusText,
        }, 'Webhook delivery failed');

        throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }

    logger.info({
        url,
        type: options.type,
    }, 'Webhook sent successfully');

    return response;
}

/**
 * Test webhook signature verification
 */
function testWebhookSignature() {
    const testSecret = 'test-secret-12345';
    const testPayload = { event: 'shipment.created', id: '123' };

    // Sign
    const signed = signWebhookPayload(testPayload, testSecret);
    console.log('Signed webhook:', signed);

    // Verify
    try {
        verifyWebhookSignature(signed.header, JSON.stringify(testPayload), testSecret);
        console.log('✅ Signature verified');
    } catch (err) {
        console.log('❌ Verification failed:', err.message);
    }

    // Test with tampered payload
    try {
        verifyWebhookSignature(signed.header, '{"tampered": true}', testSecret);
        console.log('❌ Should have caught tampered payload');
    } catch (err) {
        console.log('✅ Caught tampered payload:', err.message);
    }
}

// Run test if called directly
if (require.main === module) {
    testWebhookSignature();
}

module.exports = {
    signWebhookPayload,
    verifyWebhookSignature,
    verifyWebhookMiddleware,
    sendSignedWebhook,
};
