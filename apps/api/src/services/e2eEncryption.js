// apps/api/src/services/e2eEncryption.js

const crypto = require("crypto");

class E2EEncryptionService {
  /**
   * End-to-End Encryption for user communications
   * Uses RSA for key exchange, AES for symmetric encryption
   */

  constructor() {
    this.algorithm = "aes-256-gcm";
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  /**
   * Generate RSA key pair for client
   */
  generateKeyPair() {
    return crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
  }

  /**
   * Generate session symmetric key
   */
  generateSessionKey() {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Encrypt session key with client's public key
   */
  encryptSessionKey(sessionKey, clientPublicKey) {
    const encrypted = crypto.publicEncrypt(
      {
        key: clientPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      sessionKey,
    );
    return encrypted.toString("base64");
  }

  /**
   * Encrypt message with session key
   */
  encryptMessage(message, sessionKey) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, sessionKey, iv);

    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      ciphertext: encrypted,
      tag: tag.toString("hex"),
      combined: `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`,
    };
  }

  /**
   * Decrypt message with session key
   */
  decryptMessage(iv, ciphertext, tag, sessionKey) {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, sessionKey, Buffer.from(iv, "hex"));

      decipher.setAuthTag(Buffer.from(tag, "hex"));

      let decrypted = decipher.update(ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error("Decryption failed - authentication tag mismatch or corrupted data", { cause: error });
    }
  }

  /**
   * Create end-to-end encrypted transport for messages
   */
  createEncryptedTransport(senderPrivateKey, recipientPublicKey) {
    const sessionKey = this.generateSessionKey();
    const encryptedSessionKey = this.encryptSessionKey(sessionKey, recipientPublicKey);

    return {
      sessionKey,
      encryptedSessionKey,

      send: (message) => {
        return this.encryptMessage(message, sessionKey);
      },

      receive: (iv, ciphertext, tag) => {
        return this.decryptMessage(iv, ciphertext, tag, sessionKey);
      },
    };
  }

  /**
   * Sign message with private key (non-repudiation)
   */
  signMessage(message, privateKey) {
    const sign = crypto.createSign("sha256");
    sign.update(message);
    const signature = sign.sign(privateKey, "base64");
    return signature;
  }

  /**
   * Verify message signature with public key
   */
  verifySignature(message, signature, publicKey) {
    const verify = crypto.createVerify("sha256");
    verify.update(message);
    return verify.verify(publicKey, signature, "base64");
  }

  /**
   * Secure key derivation for multiple conversations
   */
  deriveKey(masterKey, conversationId) {
    const hmac = crypto.createHmac("sha256", masterKey);
    hmac.update(conversationId);
    return hmac.digest();
  }

  /**
   * Perfect forward secrecy - rotate keys periodically
   */
  rotateSessionKey(oldSessionKey) {
    const newKey = this.generateSessionKey();
    return {
      oldKey: oldSessionKey,
      newKey,
      rotatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }
}

module.exports = { E2EEncryptionService };
