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

  // Get the master fingerprint (this corresponds to the master key)
  const masterFingerprint = masterKey.fingerprint.toString("hex").toUpperCase();

  // For P2WSH (Native SegWit), use BIP48 derivation path
  const derivationPath = "m/48'/0'/0'/2'";

  // Derive the key using the correct path for P2WSH
  const derivedKey = masterKey.derivePath(derivationPath);

  // Get the xpub for the derived key (neutered = public key only)
  const xpub = derivedKey.neutered().toBase58();

  // Create a control signature using the derived key
  const message = "Control signature for Seed-E service";
  const messageHash = bitcoin.crypto.sha256(Buffer.from(message, "utf8"));
  const signature = derivedKey.sign(messageHash);

  // Convert signature to hex - ensure proper hex format
  const signatureHex = Buffer.from(signature).toString("hex");

  // Generate some test data
  const testData = {
    policyType: "P2WSH",
    xpub: xpub,
    controlSignature: signatureHex,
    masterFingerprint: masterFingerprint,
    derivationPath: derivationPath,
    initialBackupFee: 1,
    perSignatureFee: 1,
    monthlyFee: 25000,
    minTimeDelayDays: 7,
    lightningAddress: "test@getalby.com",
  };

  console.log(`Policy Type: ${testData.policyType}`);
  console.log(`Xpub: ${testData.xpub}`);
  console.log(`Control Signature: ${testData.controlSignature}`);
  console.log(`Master Fingerprint: ${testData.masterFingerprint}`);
  console.log(`Derivation Path: ${testData.derivationPath}`);
  console.log(`Initial Backup Fee: ${testData.initialBackupFee} sats`);
  console.log(`Per Signature Fee: ${testData.perSignatureFee} sats`);
  console.log(`Monthly Fee: ${testData.monthlyFee.toLocaleString()} sats`);
  console.log(`Time Delay: ${testData.minTimeDelayDays} days`);
  console.log(`Lightning Address: ${testData.lightningAddress}`);

  console.log("\n🔍 Verification:");
  console.log(
    `- Master fingerprint ${masterFingerprint} corresponds to the master key`
  );
  console.log(
    `- Derivation path ${derivationPath} was used to derive the xpub`
  );
  console.log(
    `- The xpub ${xpub.substring(0, 20)}... is derived from this path`
  );
  console.log(`- Control signature is created using the same derived key`);
}

// Run the key generation
generateKeys();
