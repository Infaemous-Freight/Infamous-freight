/**
 * KMS — Key Management System (Phase 19.4)
 * 
 * Each Organization gets its own AES-256 data encryption key,
 * encrypted by a master key (MASTER_KEY environment variable).
 * 
 * This enables:
 * - Per-tenant encryption keys
 * - Field-level encryption (PII, payout details, tokens)
 * - Secure key rotation without manual decryption
 * 
 * Architecture:
 * 1. Master Key (environment variable, 32 bytes base64)
 *    - Never leaves production memory
 *    - Used only to encrypt/decrypt data keys
 * 
 * 2. Data Key (one per Organization)
 *    - Generated at org creation
 *    - Encrypted by master key using AES-256-GCM
 *    - Stored in Organization.dataKeyEnc
 * 
 * 3. Encrypted Value (field-level)
 *    - Each field uses data key to encrypt sensitive data
 *    - Stored as { iv, authTag, encryptedData } (base64)
 */

import crypto from "crypto";

// Master key from environment (must be 32-byte base64)
const MASTER_KEY = process.env.MASTER_KEY
  ? Buffer.from(process.env.MASTER_KEY, "base64")
  : null;

const MASTER_KEY_LENGTH = 32; // AES-256
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16; // GCM auth tag

if (MASTER_KEY && MASTER_KEY.length !== MASTER_KEY_LENGTH) {
  throw new Error(
    `MASTER_KEY must be ${MASTER_KEY_LENGTH} bytes (base64-encoded). ` +
    `Current length: ${MASTER_KEY.length} bytes.`
  );
}

/**
 * Generate a random data key (32 bytes) and encrypt it with the master key
 * 
 * Returns base64-encoded: [ iv (12) || authTag (16) || encryptedKey (32) ]
 */
export function generateDataKey(): string {
  if (!MASTER_KEY) {
    throw new Error(
      "MASTER_KEY not configured. Cannot generate data key. " +
      "Set MASTER_KEY environment variable."
    );
  }

  // Generate random data key (32 bytes for AES-256)
  const dataKey = crypto.randomBytes(MASTER_KEY_LENGTH);
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Encrypt data key with master key using AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  const encryptedKey = Buffer.concat([
    cipher.update(dataKey),
    cipher.final(),
  ]);
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Pack: iv || authTag || encryptedKey
  const packed = Buffer.concat([iv, authTag, encryptedKey]);
  
  return packed.toString("base64");
}

/**
 * Decrypt a data key that was encrypted with generateDataKey()
 * 
 * Input: base64-encoded [ iv (12) || authTag (16) || encryptedKey (32) ]
 * Output: decrypted 32-byte data key
 */
export function decryptDataKey(encryptedKeyB64: string): Buffer {
  if (!MASTER_KEY) {
    throw new Error(
      "MASTER_KEY not configured. Cannot decrypt data key. " +
      "Set MASTER_KEY environment variable."
    );
  }

  const packed = Buffer.from(encryptedKeyB64, "base64");
  
  // Extract components
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encryptedKey = packed.subarray(IV_LENGTH + TAG_LENGTH);
  
  // Decrypt with AES-256-GCM
  const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  
  const dataKey = Buffer.concat([
    decipher.update(encryptedKey),
    decipher.final(),
  ]);
  
  return dataKey;
}

/**
 * Encrypt a sensitive field using a data key
 * 
 * Usage:
 *   const encrypted = encryptField(dataKey, "123-45-6789"); // SSN
 *   // Store encrypted as string in database
 *   await db.user.update({ data: { ssn: encrypted } });
 * 
 * Returns base64-encoded: [ iv (12) || authTag (16) || encryptedValue ]
 */
export function encryptField(dataKey: Buffer, plaintext: string): string {
  if (dataKey.length !== MASTER_KEY_LENGTH) {
    throw new Error(
      `Data key must be ${MASTER_KEY_LENGTH} bytes. Got ${dataKey.length}`
    );
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Encrypt field value
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
  const encryptedValue = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Pack and encode
  const packed = Buffer.concat([iv, authTag, encryptedValue]);
  return packed.toString("base64");
}

/**
 * Decrypt a field encrypted with encryptField()
 * 
 * Usage:
 *   const encrypted = row.ssn; // from database
 *   const plaintext = decryptField(dataKey, encrypted);
 * 
 * Returns plaintext string
 */
export function decryptField(dataKey: Buffer, encryptedB64: string): string {
  if (dataKey.length !== MASTER_KEY_LENGTH) {
    throw new Error(
      `Data key must be ${MASTER_KEY_LENGTH} bytes. Got ${dataKey.length}`
    );
  }

  const packed = Buffer.from(encryptedB64, "base64");
  
  // Extract components
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encryptedValue = packed.subarray(IV_LENGTH + TAG_LENGTH);
  
  // Decrypt
  const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);
  decipher.setAuthTag(authTag);
  
  const plaintext = Buffer.concat([
    decipher.update(encryptedValue),
    decipher.final(),
  ]).toString("utf-8");
  
  return plaintext;
}

/**
 * Verify that a MASTER_KEY is configured
 * Call this at server startup to fail early if KMS is misconfigured
 */
export function assertMasterKeyConfigured(): void {
  if (!MASTER_KEY) {
    throw new Error(
      "MASTER_KEY environment variable is required for Phase 19 multi-tenancy. " +
      "Generate with: openssl rand -base64 32"
    );
  }
}

/**
 * Utility to generate MASTER_KEY for documentation
 * Not called at runtime, just for setup instructions
 */
export function generateMasterKeyExample(): string {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Validation helper: check if encrypted field is properly formatted
 */
export function isEncryptedField(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const buffer = Buffer.from(value, "base64");
    // Minimum valid length: IV (12) + authTag (16) + at least 1 byte encrypted
    return buffer.length >= IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Integration pattern for Organization creation:
 * 
 *   export async function createOrganization(name: string, slug: string) {
 *     const dataKeyEnc = generateDataKey(); // Encrypt master → data key
 *     
 *     const org = await prisma.organization.create({
 *       data: {
 *         name,
 *         slug,
 *         dataKeyEnc,
 *       },
 *     });
 *     
 *     return org;
 *   }
 * 
 * Integration pattern for field encryption:
 * 
 *   export async function updateUserPII(userId: string, orgId: string, pii: any) {
 *     const org = await prisma.organization.findUnique({
 *       where: { id: orgId },
 *       select: { dataKeyEnc: true },
 *     });
 *     
 *     const dataKey = decryptDataKey(org.dataKeyEnc);
 *     
 *     const encryptedSSN = encryptField(dataKey, pii.ssn);
 *     const encryptedBank = encryptField(dataKey, pii.bankAccount);
 *     
 *     await prisma.user.update({
 *       where: { id: userId },
 *       data: {
 *         ssn: encryptedSSN,
 *         bankAccount: encryptedBank,
 *       },
 *     });
 *   }
 */
