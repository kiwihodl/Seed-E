import crypto from "crypto";

/**
 * Phase 1.5 Encryption Implementation
 *
 * Core encryption utilities for protecting sensitive data in Seed-E
 * - AES-256-GCM encryption for database fields
 * - Secure key derivation and management
 * - Encrypted field structure with IV and auth tags
 */

export interface EncryptedField {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
  version: string; // Encryption version for future compatibility
}

export interface EncryptionConfig {
  algorithm: "aes-256-gcm";
  keyLength: 32; // 256 bits
  ivLength: 16; // 128 bits
  authTagLength: 16; // 128 bits
  saltLength: 32; // 256 bits for key derivation
  iterations: 100000; // PBKDF2 iterations
}

export class EncryptionService {
  private config: EncryptionConfig = {
    algorithm: "aes-256-gcm",
    keyLength: 32,
    ivLength: 16,
    authTagLength: 16,
    saltLength: 32,
    iterations: 100000,
  };

  private masterKey: Buffer;
  private salt: Buffer;

  constructor() {
    this.initializeKeys();
  }

  /**
   * Initialize encryption keys from environment variables
   */
  private initializeKeys(): void {
    const masterKeyEnv = process.env.ENCRYPTION_MASTER_KEY;
    const saltEnv = process.env.ENCRYPTION_SALT;

    if (!masterKeyEnv || !saltEnv) {
      console.warn(
        "⚠️  ENCRYPTION_MASTER_KEY and ENCRYPTION_SALT not set - using fallback keys"
      );
      // Use fallback keys for development/testing
      this.masterKey = Buffer.from(
        "default-master-key-32-bytes-long-here",
        "utf8"
      ).slice(0, 32);
      this.salt = Buffer.from("default-salt-32-bytes-long-here", "utf8").slice(
        0,
        32
      );
      return;
    }

    try {
      // Decode base64 keys
      this.masterKey = Buffer.from(masterKeyEnv, "base64");
      this.salt = Buffer.from(saltEnv, "base64");

      // Validate key lengths
      if (this.masterKey.length !== this.config.keyLength) {
        throw new Error(`Master key must be ${this.config.keyLength} bytes`);
      }

      if (this.salt.length !== this.config.saltLength) {
        throw new Error(`Salt must be ${this.config.saltLength} bytes`);
      }
    } catch (error) {
      console.warn(
        "⚠️  Failed to initialize encryption keys, using fallback:",
        error.message
      );
      // Use fallback keys if decoding fails
      this.masterKey = Buffer.from(
        "default-master-key-32-bytes-long-here",
        "utf8"
      ).slice(0, 32);
      this.salt = Buffer.from("default-salt-32-bytes-long-here", "utf8").slice(
        0,
        32
      );
    }
  }

  /**
   * Derive a context-specific key from the master key
   */
  private deriveKey(context: string): Buffer {
    const contextBuffer = Buffer.from(context, "utf8");
    const keyMaterial = Buffer.concat([this.masterKey, contextBuffer]);

    return crypto.pbkdf2Sync(
      keyMaterial,
      this.salt,
      this.config.iterations,
      this.config.keyLength,
      "sha256"
    );
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  public encrypt(data: string, context: string): EncryptedField {
    try {
      const key = this.deriveKey(context);
      const iv = crypto.randomBytes(this.config.ivLength);

      const cipher = crypto.createCipheriv(this.config.algorithm, key, iv);

      // Encrypt the data
      let encrypted = cipher.update(data, "utf8", "base64");
      encrypted += cipher.final("base64");

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        version: "1.0",
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  public decrypt(encryptedField: EncryptedField, context: string): string {
    try {
      const key = this.deriveKey(context);
      const iv = Buffer.from(encryptedField.iv, "base64");
      const authTag = Buffer.from(encryptedField.authTag, "base64");

      const decipher = crypto.createDecipheriv(this.config.algorithm, key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(
        encryptedField.encrypted,
        "base64",
        "utf8"
      );
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Encrypt XPUB/ZPUB data
   */
  public encryptXpub(xpub: string, providerId: string): EncryptedField {
    return this.encrypt(xpub, `xpub:${providerId}`);
  }

  /**
   * Decrypt XPUB/ZPUB data
   */
  public decryptXpub(
    encryptedField: EncryptedField,
    providerId: string
  ): string {
    return this.decrypt(encryptedField, `xpub:${providerId}`);
  }

  /**
   * Encrypt PSBT data
   */
  public encryptPSBT(psbt: string, requestId: string): EncryptedField {
    return this.encrypt(psbt, `psbt:${requestId}`);
  }

  /**
   * Decrypt PSBT data
   */
  public decryptPSBT(
    encryptedField: EncryptedField,
    requestId: string
  ): string {
    return this.decrypt(encryptedField, `psbt:${requestId}`);
  }

  /**
   * Encrypt payment hash
   */
  public encryptPaymentHash(
    paymentHash: string,
    purchaseId: string
  ): EncryptedField {
    return this.encrypt(paymentHash, `payment:${purchaseId}`);
  }

  /**
   * Decrypt payment hash
   */
  public decryptPaymentHash(
    encryptedField: EncryptedField,
    purchaseId: string
  ): string {
    return this.decrypt(encryptedField, `payment:${purchaseId}`);
  }

  /**
   * Encrypt client notes
   */
  public encryptClientNotes(notes: string, requestId: string): EncryptedField {
    return this.encrypt(notes, `notes:${requestId}`);
  }

  /**
   * Decrypt client notes
   */
  public decryptClientNotes(
    encryptedField: EncryptedField,
    requestId: string
  ): string {
    return this.decrypt(encryptedField, `notes:${requestId}`);
  }

  /**
   * Generate a new master key (for key rotation)
   */
  public static generateMasterKey(): string {
    return crypto.randomBytes(32).toString("base64");
  }

  /**
   * Generate a new salt (for key rotation)
   */
  public static generateSalt(): string {
    return crypto.randomBytes(32).toString("base64");
  }

  /**
   * Validate encryption configuration
   */
  public validateConfig(): boolean {
    try {
      // Test encryption/decryption with a known value
      const testData = "test-encryption-validation";
      const testContext = "validation";

      const encrypted = this.encrypt(testData, testContext);
      const decrypted = this.decrypt(encrypted, testContext);

      return decrypted === testData;
    } catch (error) {
      console.error("Encryption validation failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
