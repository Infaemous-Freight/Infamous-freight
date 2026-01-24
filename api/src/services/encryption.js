/*
 * Encryption Service
 * Handles encryption/decryption of sensitive fields
 */

const crypto = require('crypto');
const { logger } = require('../middleware/logger');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive data
 */
function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    logger.error({ err }, 'Decryption error');
    return null;
  }
}

/**
 * Hash password (for storing)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + ENCRYPTION_KEY).digest('hex');
}

/**
 * Verify password
 */
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * Hash field for comparison (non-reversible)
 */
function hashField(data) {
  return crypto
    .createHash('sha256')
    .update(String(data))
    .digest('hex');
}

/**
 * Secure Payment Storage Service
 */
class SecurePaymentService {
  static async storePayment(prisma, paymentData) {
    return prisma.payment.create({
      data: {
        userId: paymentData.userId,
        stripePaymentIntentId: paymentData.stripePaymentIntentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        encryptedCardLast4: paymentData.cardLast4
          ? encrypt(paymentData.cardLast4)
          : null,
        encryptedMetadata: paymentData.metadata
          ? encrypt(JSON.stringify(paymentData.metadata))
          : null,
      },
    });
  }

  static async getPayment(prisma, paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      if (payment.encryptedCardLast4) {
        payment.cardLast4 = decrypt(payment.encryptedCardLast4);
      }
      if (payment.encryptedMetadata) {
        payment.metadata = JSON.parse(decrypt(payment.encryptedMetadata) || '{}');
      }
    }

    return payment;
  }
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  hashField,
  SecurePaymentService,
};
