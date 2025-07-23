import { Signer, VaultSigner } from "@/types/signer";

// Generate a unique key ID from signer
export const getKeyUID = (signer: Signer | VaultSigner): string => {
  if ("xfp" in signer) {
    // This is a VaultSigner
    return signer.xfp;
  }
  // This is a Signer
  return signer.masterFingerprint;
};

// Get account from signer
export const getAccountFromSigner = (signer: Signer): number => {
  // Default to account 0 for now
  return 0;
};

// Simple error capture for web
export const captureError = (error: any): void => {
  console.error("Seed-E Error:", error);
  // In a real app, you might send this to a service like Sentry
};

// Format string with placeholders
export const formatString = (template: string, ...args: any[]): string => {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    return args[index] || match;
  });
};

// Utility functions for QR processing and data validation

/**
 * Extracts the total number of parts and current index from a BBQR string
 * @param bbqrString - The BBQR string to parse
 * @returns Object containing total and index
 */
export function extractBBQRIndex(bbqrString: string): {
  total: number;
  index: number;
} {
  if (!bbqrString.startsWith("B$")) {
    throw new Error("Invalid BBQR string format");
  }

  // Extract the count and index from positions 4-6 and 6-8
  const countStr = bbqrString.slice(4, 6);
  const indexStr = bbqrString.slice(6, 8);

  const total = parseInt(countStr, 36);
  const index = parseInt(indexStr, 36);

  if (isNaN(total) || isNaN(index)) {
    throw new Error("Invalid BBQR count or index");
  }

  return { total, index };
}

/**
 * Checks if a string is a valid hexadecimal string
 * @param str - The string to check
 * @returns True if the string is valid hexadecimal
 */
export function isHexadecimal(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }

  // Check if string contains only valid hex characters
  const hexRegex = /^[0-9A-Fa-f]+$/;
  return hexRegex.test(str);
}

/**
 * Validates if a string is a valid xpub
 * @param xpub - The xpub string to validate
 * @returns True if the string is a valid xpub
 */
export function isValidXpub(xpub: string): boolean {
  if (!xpub || typeof xpub !== "string") {
    return false;
  }

  // Basic xpub format validation - accept all variants (xpub, Xpub, ypub, Ypub, zpub, Zpub)
  const xpubRegex = /^[xXyYzZ]pub[1-9A-HJ-NP-Za-km-z]{107}$/;
  return xpubRegex.test(xpub);
}

/**
 * Validates if a string is a valid derivation path
 * @param path - The derivation path to validate
 * @returns True if the string is a valid derivation path
 */
export function isValidDerivationPath(path: string): boolean {
  if (!path || typeof path !== "string") {
    return false;
  }

  // Basic derivation path validation
  const pathRegex = /^m(\/[0-9]+'?)*$/;
  return pathRegex.test(path);
}

/**
 * Validates if a string is a valid master fingerprint
 * @param fingerprint - The master fingerprint to validate
 * @returns True if the string is a valid master fingerprint
 */
export function isValidMasterFingerprint(fingerprint: string): boolean {
  if (!fingerprint || typeof fingerprint !== "string") {
    return false;
  }

  // Master fingerprint should be 8 hex characters
  const fingerprintRegex = /^[0-9A-Fa-f]{8}$/;
  return fingerprintRegex.test(fingerprint);
}
