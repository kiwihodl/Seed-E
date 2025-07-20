const bitcoin = require("bitcoinjs-lib");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

// Initialize Bitcoin libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

function generateKeys() {
  // Generate a random seed
  const seed = crypto.randomBytes(32);

  // Create master key from seed
  const masterKey = bip32.fromSeed(seed);

  // Derive the first account (m/84'/0'/0') for native SegWit
  const account = masterKey.derivePath("m/84'/0'/0'");

  // Get the xpub for the account (neutered = public key only)
  const xpub = account.neutered().toBase58();

  // Create a control signature (simulating a signature from the private key)
  const message = "Control signature for Seed-E service";
  const messageHash = bitcoin.crypto.sha256(Buffer.from(message, "utf8"));
  const signature = account.sign(messageHash);

  // Convert signature to hex - ensure proper hex format
  const signatureHex = Buffer.from(signature).toString("hex");

  // Generate some test data
  const testData = {
    policyType: "P2WSH",
    xpub: xpub,
    controlSignature: signatureHex,
    initialBackupFee: 1,
    perSignatureFee: 1,
    monthlyFee: 25000,
    minTimeDelayDays: 7,
    lightningAddress: "test@getalby.com",
  };

  console.log(`Policy Type: ${testData.policyType}`);
  console.log(`Xpub: ${testData.xpub}`);
  console.log(`Control Signature: ${testData.controlSignature}`);
  console.log(`Initial Backup Fee: ${testData.initialBackupFee} sats`);
  console.log(`Per Signature Fee: ${testData.perSignatureFee} sats`);
  console.log(`Monthly Fee: ${testData.monthlyFee.toLocaleString()} sats`);
  console.log(`Time Delay: ${testData.minTimeDelayDays} days`);
  console.log(`Lightning Address: ${testData.lightningAddress}`);
}

// Run the key generation
generateKeys();
