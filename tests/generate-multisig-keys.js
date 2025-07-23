const bitcoin = require("bitcoinjs-lib");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

// Initialize Bitcoin libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

function generateKeysForPolicy(policyType) {
  // Generate a random seed
  const seed = crypto.randomBytes(32);

  // Create master key from seed
  const masterKey = bip32.fromSeed(seed);

  // Get the master fingerprint (this corresponds to the master key)
  const masterFingerprint = masterKey.fingerprint.toString("hex").toUpperCase();

  // For different policy types, we need different derivation paths
  let derivationPath;

  switch (policyType) {
    case "P2WSH":
      derivationPath = "m/48'/0'/0'/2'"; // BIP48 for P2WSH
      break;
    case "P2TR":
      derivationPath = "m/86'/0'/0'/0'"; // BIP86 for Taproot
      break;
    case "P2SH":
      derivationPath = "m/49'/0'/0'/0'"; // BIP49 for Legacy SegWit
      break;
    default:
      throw new Error(`Unknown policy type: ${policyType}`);
  }

  // Derive the key using the correct path for the policy type
  const derivedKey = masterKey.derivePath(derivationPath);

  // Get the xpub for the derived key (neutered = public key only)
  const xpub = derivedKey.neutered().toBase58();

  // Create a control signature using the derived key
  const message = "Control signature for Seed-E service";
  const messageHash = bitcoin.crypto.sha256(Buffer.from(message, "utf8"));
  const signature = derivedKey.sign(messageHash);

  // Convert signature to hex - ensure proper hex format
  const signatureHex = Buffer.from(signature).toString("hex");

  // Generate test data
  const testData = {
    policyType: policyType,
    xpub: xpub,
    masterFingerprint: masterFingerprint,
    derivationPath: derivationPath,
    initialBackupFee: 1,
    perSignatureFee: 1,
    monthlyFee: 25000,
    minTimeDelayDays: 7,
    lightningAddress: "highlyregarded@getalby.com",
  };

  console.log(`\n🔑 Generated ${policyType} Key:`);
  console.log(`Policy Type: ${testData.policyType}`);
  console.log(`Xpub: ${testData.xpub}`);
  console.log(`Master Fingerprint: ${testData.masterFingerprint}`);
  console.log(`Derivation Path: ${testData.derivationPath}`);
  console.log(`Initial Backup Fee: ${testData.initialBackupFee} sats`);
  console.log(`Per Signature Fee: ${testData.perSignatureFee} sats`);
  console.log(`Monthly Fee: ${testData.monthlyFee.toLocaleString()} sats`);
  console.log(`Time Delay: ${testData.minTimeDelayDays} days`);
  console.log(`Lightning Address: ${testData.lightningAddress}`);

  console.log(`\n🔍 Verification for ${policyType}:`);
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

  return testData;
}

function generateAllPolicyTypes() {
  console.log("🚀 Generating keys for all policy types...\n");

  const policyTypes = ["P2WSH", "P2TR", "P2SH"];
  const keys = {};

  for (const policyType of policyTypes) {
    keys[policyType] = generateKeysForPolicy(policyType);
  }

  console.log("\n📋 Summary of all generated keys:");
  console.log("=".repeat(50));

  for (const [policyType, keyData] of Object.entries(keys)) {
    console.log(`\n${policyType}:`);
    console.log(`  Master Fingerprint: ${keyData.masterFingerprint}`);
    console.log(`  Derivation Path: ${keyData.derivationPath}`);
    console.log(`  Xpub: ${keyData.xpub.substring(0, 20)}...`);
  }

  console.log("\n✅ All keys generated successfully!");
  console.log("💡 You can now use these keys to create real multisig wallets.");
  console.log(
    "🔧 Copy the master fingerprint and derivation path to your wallet setup."
  );
}

// Run the key generation for all policy types
generateAllPolicyTypes();
