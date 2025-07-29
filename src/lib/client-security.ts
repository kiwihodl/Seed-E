/**
 * Phase 1.5.3: Client-Side Security Implementation
 *
 * Provides client-side security features:
 * - Session token generation and validation
 * - Replay attack prevention
 * - Ownership proof system
 * - Client-side encryption before storage
 */

import crypto from "crypto";
import { encryptionService } from "./encryption";
import { teeIntegration } from "./tee-integration";

export interface SessionToken {
  token: string;
  clientId: string;
  providerId: string;
  requestId: string;
  createdAt: Date;
  expiresAt: Date;
  nonce: string;
  signature: string;
}

export interface OwnershipProof {
  proofId: string;
  xpub: string;
  sessionId: string;
  randomNonce: string;
  signature: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ClientSecurityConfig {
  sessionTokenExpiry: number; // milliseconds
  ownershipProofExpiry: number; // milliseconds
  nonceLength: number; // bytes
  maxReplayAttempts: number;
}

export class ClientSecurityService {
  private config: ClientSecurityConfig = {
    sessionTokenExpiry: 3600000, // 1 hour
    ownershipProofExpiry: 1800000, // 30 minutes
    nonceLength: 32, // 256 bits
    maxReplayAttempts: 3,
  };

  private usedTokens: Set<string> = new Set();
  private tokenAttempts: Map<string, number> = new Map();

  /**
   * Generate a cryptographically secure session token
   */
  public generateSessionToken(
    clientId: string,
    providerId: string,
    requestId: string
  ): SessionToken {
    const token = this.generateSecureToken();
    const nonce = crypto.randomBytes(this.config.nonceLength).toString("hex");
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() + this.config.sessionTokenExpiry
    );

    // Create signature for token validation
    const signatureData = `${clientId}:${providerId}:${requestId}:${nonce}:${expiresAt.getTime()}`;
    const signature = this.signData(signatureData);

    const sessionToken: SessionToken = {
      token,
      clientId,
      providerId,
      requestId,
      createdAt,
      expiresAt,
      nonce,
      signature,
    };

    console.log(
      `🔐 Generated session token for client ${clientId} and provider ${providerId}`
    );
    return sessionToken;
  }

  /**
   * Validate a session token
   */
  public validateSessionToken(token: string, requestId: string): boolean {
    try {
      // Check if token has been used (replay protection)
      if (this.usedTokens.has(token)) {
        console.log(
          `❌ Token ${token} has already been used (replay attack detected)`
        );
        return false;
      }

      // Check token attempts (rate limiting)
      const attempts = this.tokenAttempts.get(token) || 0;
      if (attempts >= this.config.maxReplayAttempts) {
        console.log(`❌ Token ${token} has exceeded maximum attempts`);
        return false;
      }

      this.tokenAttempts.set(token, attempts + 1);

      // In a real implementation, you would decode and validate the token
      // For now, we'll simulate validation
      const isValid = this.simulateTokenValidation(token, requestId);

      if (isValid) {
        // Mark token as used
        this.usedTokens.add(token);
        console.log(`✅ Session token validated successfully`);
      } else {
        console.log(`❌ Session token validation failed`);
      }

      return isValid;
    } catch (error) {
      console.error(
        `❌ Session token validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }

  /**
   * Create an ownership proof for a provider
   */
  public async createOwnershipProof(
    xpub: string,
    providerId: string,
    sessionId: string
  ): Promise<OwnershipProof> {
    try {
      const randomNonce = crypto
        .randomBytes(this.config.nonceLength)
        .toString("hex");
      const createdAt = new Date();
      const expiresAt = new Date(
        createdAt.getTime() + this.config.ownershipProofExpiry
      );

      // Create proof message
      const proofMessage = `${xpub}:${providerId}:${sessionId}:${randomNonce}:${expiresAt.getTime()}`;

      // Sign the proof (in a real implementation, this would use the actual private key)
      const signature = this.signData(proofMessage);

      const proof: OwnershipProof = {
        proofId: this.generateSecureToken(),
        xpub,
        sessionId,
        randomNonce,
        signature,
        createdAt,
        expiresAt,
      };

      console.log(`🔐 Created ownership proof for provider ${providerId}`);
      return proof;
    } catch (error) {
      throw new Error(
        `Ownership proof creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Verify an ownership proof
   */
  public verifyOwnershipProof(
    proof: OwnershipProof,
    providerId: string
  ): boolean {
    try {
      // Check expiration
      if (new Date() > proof.expiresAt) {
        console.log(`❌ Ownership proof has expired`);
        return false;
      }

      // Recreate proof message
      const proofMessage = `${proof.xpub}:${providerId}:${proof.sessionId}:${
        proof.randomNonce
      }:${proof.expiresAt.getTime()}`;

      // Verify signature
      const isValid = this.verifySignature(proofMessage, proof.signature);

      if (isValid) {
        console.log(`✅ Ownership proof verified successfully`);
      } else {
        console.log(`❌ Ownership proof verification failed`);
      }

      return isValid;
    } catch (error) {
      console.error(
        `❌ Ownership proof verification error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }

  /**
   * Encrypt data client-side before sending to server
   */
  public async encryptClientSide(
    data: string,
    context: string
  ): Promise<{ encrypted: string; sessionId: string }> {
    try {
      // Try to use TEE if available
      if (teeIntegration.isTEEAvailable()) {
        console.log(`🔒 Using TEE for client-side encryption`);
        return await teeIntegration.encryptInTEE(data, context);
      } else {
        // Fallback to regular encryption
        console.log(`🔒 Using software encryption for client-side encryption`);
        const encryptedField = encryptionService.encrypt(data, context);
        return {
          encrypted: JSON.stringify(encryptedField),
          sessionId: `session-${context}-${Date.now()}`,
        };
      }
    } catch (error) {
      throw new Error(
        `Client-side encryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Decrypt data client-side
   */
  public async decryptClientSide(
    encryptedData: string,
    sessionId: string,
    context: string
  ): Promise<string> {
    try {
      // Try to use TEE if available
      if (teeIntegration.isTEEAvailable()) {
        console.log(`🔓 Using TEE for client-side decryption`);
        return await teeIntegration.decryptInTEE(encryptedData, sessionId);
      } else {
        // Fallback to regular decryption
        console.log(`🔓 Using software decryption for client-side decryption`);
        const encryptedField = JSON.parse(encryptedData);
        return encryptionService.decrypt(encryptedField, context);
      }
    } catch (error) {
      throw new Error(
        `Client-side decryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  /**
   * Sign data with a cryptographic signature
   */
  private signData(data: string): string {
    // In a real implementation, this would use the actual private key
    // For now, we'll create a hash-based signature
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return hash.substring(0, 32); // Return first 32 characters as signature
  }

  /**
   * Verify a signature
   */
  private verifySignature(data: string, signature: string): boolean {
    // In a real implementation, this would verify against the public key
    // For now, we'll recreate the signature and compare
    const expectedSignature = this.signData(data);
    return signature === expectedSignature;
  }

  /**
   * Simulate token validation (for testing)
   */
  private simulateTokenValidation(token: string, requestId: string): boolean {
    // In a real implementation, this would decode and validate the JWT token
    // For now, we'll simulate validation
    return token.length > 0 && requestId.length > 0;
  }

  /**
   * Clean up expired tokens and attempts
   */
  public cleanupExpiredTokens(): void {
    const now = Date.now();
    const expiryTime = now - this.config.sessionTokenExpiry;

    // Clean up old attempts
    for (const [token, lastAttempt] of this.tokenAttempts.entries()) {
      if (lastAttempt < expiryTime) {
        this.tokenAttempts.delete(token);
      }
    }

    console.log(`🧹 Cleaned up expired tokens and attempts`);
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(): {
    activeTokens: number;
    usedTokens: number;
    totalAttempts: number;
    teeAvailable: boolean;
  } {
    return {
      activeTokens: this.tokenAttempts.size,
      usedTokens: this.usedTokens.size,
      totalAttempts: Array.from(this.tokenAttempts.values()).reduce(
        (sum, attempts) => sum + attempts,
        0
      ),
      teeAvailable: teeIntegration.isTEEAvailable(),
    };
  }
}

// Export singleton instance
export const clientSecurityService = new ClientSecurityService();
