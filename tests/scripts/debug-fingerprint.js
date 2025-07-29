#!/usr/bin/env node

const bitcoin = require("bitcoinjs-lib");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

// Initialize Bitcoin libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

// Generate a master key and test fingerprint conversion
function debugFingerprint() {
  // Generate a random seed
  const seed = crypto.randomBytes(32);
  console.log("Seed:", seed.toString("hex"));

  // Create master key from seed
  const masterKey = bip32.fromSeed(seed);

  console.log("Master key fingerprint:", masterKey.fingerprint);
  console.log("Fingerprint type:", typeof masterKey.fingerprint);
  console.log(
    "Fingerprint constructor:",
    masterKey.fingerprint.constructor.name
  );

  // Try different conversion methods
  console.log("\nDifferent conversion methods:");
  console.log("1. toString():", masterKey.fingerprint.toString());
  console.log("2. toString('hex'):", masterKey.fingerprint.toString("hex"));
  console.log(
    "3. Buffer.from().toString('hex'):",
    Buffer.from(masterKey.fingerprint).toString("hex")
  );
  console.log("4. Array.from():", Array.from(masterKey.fingerprint));

  // Manual hex conversion
  const bytes = Array.from(masterKey.fingerprint);
  const hexString = bytes
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  console.log("5. Manual hex conversion:", hexString);

  return hexString;
}

const result = debugFingerprint();
console.log("\n✅ Final result:", result);
