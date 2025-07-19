import crypto from "crypto";

/**
 * Hash an xpub with the server secret for secure storage
 * @param xpub The extended public key to hash
 * @returns The hashed xpub
 */
export function hashXpub(xpub: string): string {
  const secret = process.env.XPUB_HASH_SECRET;

  if (!secret) {
    throw new Error("XPUB_HASH_SECRET environment variable is not set");
  }

  // Create hash using HMAC-SHA256
  const hash = crypto.createHmac("sha256", secret);
  hash.update(xpub);

  return hash.digest("hex");
}

/**
 * Verify if a hashed xpub matches a plain xpub
 * @param plainXpub The plain xpub to check
 * @param hashedXpub The hashed xpub to compare against
 * @returns True if they match
 */
export function verifyXpubHash(plainXpub: string, hashedXpub: string): boolean {
  const computedHash = hashXpub(plainXpub);
  return computedHash === hashedXpub;
}
