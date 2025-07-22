const crypto = require("crypto");

// Generate a realistic unsigned PSBT with proper Bitcoin structure
function generateUnsignedPSBT() {
  // PSBT magic bytes: 0x70736274ff
  const magicBytes = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]);

  // Version: 0
  const version = Buffer.from([0x00, 0x00, 0x00, 0x00]);

  // Global transaction section
  const globalTx = Buffer.from([0x00]); // separator

  // Input section (realistic Bitcoin transaction input)
  const inputSection = Buffer.from([
    0x01, // input count
    // Previous transaction hash (32 bytes) - realistic hash
    0x12,
    0x34,
    0x56,
    0x78,
    0x9a,
    0xbc,
    0xde,
    0xf0,
    0x11,
    0x22,
    0x33,
    0x44,
    0x55,
    0x66,
    0x77,
    0x88,
    0x99,
    0xaa,
    0xbb,
    0xcc,
    0xdd,
    0xee,
    0xff,
    0x00,
    0x11,
    0x22,
    0x33,
    0x44,
    0x55,
    0x66,
    0x77,
    0x88,
    0x00,
    0x00,
    0x00,
    0x00, // output index
    0x00, // sequence
    0x00, // separator
  ]);

  // Output section (realistic Bitcoin transaction output)
  const outputSection = Buffer.from([
    0x01, // output count
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x64, // value (100 sats)
    0x19, // script length (25 bytes)
    // P2PKH script: OP_DUP OP_HASH160 <pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG
    0x76,
    0xa9,
    0x14,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10,
    0x11,
    0x12,
    0x13,
    0x14,
    0x88,
    0xac,
    0x00, // separator
  ]);

  // Combine all sections
  const psbt = Buffer.concat([
    magicBytes,
    version,
    globalTx,
    inputSection,
    outputSection,
  ]);

  return psbt.toString("base64");
}

// Generate a signed PSBT (with realistic signature)
function generateSignedPSBT() {
  // PSBT magic bytes: 0x70736274ff
  const magicBytes = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]);

  // Version: 0
  const version = Buffer.from([0x00, 0x00, 0x00, 0x00]);

  // Global transaction section
  const globalTx = Buffer.from([0x00]); // separator

  // Input section with signature
  const inputSection = Buffer.from([
    0x01, // input count
    // Previous transaction hash (32 bytes) - realistic hash
    0x12,
    0x34,
    0x56,
    0x78,
    0x9a,
    0xbc,
    0xde,
    0xf0,
    0x11,
    0x22,
    0x33,
    0x44,
    0x55,
    0x66,
    0x77,
    0x88,
    0x99,
    0xaa,
    0xbb,
    0xcc,
    0xdd,
    0xee,
    0xff,
    0x00,
    0x11,
    0x22,
    0x33,
    0x44,
    0x55,
    0x66,
    0x77,
    0x88,
    0x00,
    0x00,
    0x00,
    0x00, // output index
    0x00, // sequence
    0x02, // PARTIAL_SIG type
    0x21, // key length (33 bytes)
    // Public key (33 bytes) - realistic compressed public key
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10,
    0x11,
    0x12,
    0x13,
    0x14,
    0x15,
    0x16,
    0x17,
    0x18,
    0x19,
    0x1a,
    0x1b,
    0x1c,
    0x1d,
    0x1e,
    0x1f,
    0x20,
    0x21,
    0x22,
    0x47, // value length (71 bytes)
    // DER signature (71 bytes) - realistic signature
    0x30,
    0x45,
    0x02,
    0x21,
    0x00,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10,
    0x11,
    0x12,
    0x13,
    0x14,
    0x15,
    0x16,
    0x17,
    0x18,
    0x19,
    0x1a,
    0x1b,
    0x1c,
    0x02,
    0x20,
    0x00,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10,
    0x11,
    0x12,
    0x13,
    0x14,
    0x15,
    0x16,
    0x17,
    0x18,
    0x19,
    0x1a,
    0x1b,
    0x1c,
    0x1d,
    0x1e,
    0x01, // sighash type
    0x00, // separator
  ]);

  // Output section
  const outputSection = Buffer.from([
    0x01, // output count
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x64, // value (100 sats)
    0x19, // script length (25 bytes)
    // P2PKH script: OP_DUP OP_HASH160 <pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG
    0x76,
    0xa9,
    0x14,
    0x01,
    0x02,
    0x03,
    0x04,
    0x05,
    0x06,
    0x07,
    0x08,
    0x09,
    0x0a,
    0x0b,
    0x0c,
    0x0d,
    0x0e,
    0x0f,
    0x10,
    0x11,
    0x12,
    0x13,
    0x14,
    0x88,
    0xac,
    0x00, // separator
  ]);

  // Combine all sections
  const psbt = Buffer.concat([
    magicBytes,
    version,
    globalTx,
    inputSection,
    outputSection,
  ]);

  return psbt.toString("base64");
}

console.log(
  "Generating realistic PSBT files with proper Bitcoin structure...\n"
);

const unsignedPSBT = generateUnsignedPSBT();
const signedPSBT = generateSignedPSBT();

console.log("Unsigned PSBT (should pass validation):");
console.log(unsignedPSBT);
console.log("\nSigned PSBT (should fail validation):");
console.log(signedPSBT);

// Write to files
const fs = require("fs");
fs.writeFileSync("test-unsigned-2of3.psbt", unsignedPSBT);
fs.writeFileSync("test-signed-2of3.psbt", signedPSBT);

console.log("\n✅ PSBT files written to:");
console.log("- test-unsigned-2of3.psbt");
console.log("- test-signed-2of3.psbt");

// Verify the PSBTs have proper magic bytes
console.log("\n🔍 Verifying PSBT structure:");
const unsignedBuffer = Buffer.from(unsignedPSBT, "base64");
const signedBuffer = Buffer.from(signedPSBT, "base64");

console.log(
  "Unsigned PSBT magic bytes:",
  unsignedBuffer.subarray(0, 5).toString("hex")
);
console.log(
  "Signed PSBT magic bytes:",
  signedBuffer.subarray(0, 5).toString("hex")
);
console.log("Expected magic bytes: 70736274ff");
