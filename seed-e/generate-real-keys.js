const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const bitcoin = require("bitcoinjs-lib");
const crypto = require("crypto");

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Generate a real master key with a different seed each time
const timestamp = Date.now().toString();
const seed = crypto.createHash("sha256").update(timestamp).digest();
const masterKey = bip32.fromSeed(seed);

// Derive the first account (m/44'/0'/0')
const account = masterKey.derivePath("m/44'/0'/0'");

// Get the xpub (extended public key)
const xpub = account.neutered().toBase58();

console.log("Real xpub:", xpub);

// Create a message to sign
const message = "I authorize this service policy creation";
const messageBuffer = Buffer.from(message, "utf8");

// Hash the message first (required for ECDSA signing)
const messageHash = crypto.createHash("sha256").update(messageBuffer).digest();

// Sign the message hash with the private key
const signature = account.sign(messageHash);

// Convert signature to Base64
const signatureBase64 = signature.toString("base64");

console.log("Message:", message);
console.log("Message hash:", messageHash.toString("hex"));
console.log("Real signature (Base64):", signatureBase64);
console.log("Signature length (bytes):", signature.length);

// Generate a BOLT12 offer (simplified for testing)
const bolt12Offer =
  "lno1qgsyx6hk6umndph4jqtf9v6kkhlnnmw009juyzd9q7pwgkht7dtwwmxe3g98acmmal9y5x6n9ypmz2w33xggwd28xq7fwwccxqp58xjm8wf3v9e8k6mr5d9cxzun5v5c6w3vy6jz0mcq27rvw0";

console.log("\n=== REAL TEST DATA ===");
console.log("xpub:", xpub);
console.log("controlSignature:", signatureBase64);
console.log("bolt12Offer:", bolt12Offer);
console.log("initialBackupFee: 50000");
console.log("perSignatureFee: 1000");
console.log("minTimeDelayDays: 7");
