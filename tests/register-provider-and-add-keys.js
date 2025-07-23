const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Test TOTP secret
const TEST_TOTP_SECRET = "JBSWY3DPEHPK3PXP";

async function registerProviderAndAddKeys() {
  try {
    console.log("🔧 Registering new provider account...");

    // Create provider account
    const providerPassword = await bcrypt.hash("testpass123", 12);
    const provider = await prisma.provider.create({
      data: {
        username: "testprovider2",
        passwordHash: providerPassword,
        twoFactorSecret: TEST_TOTP_SECRET,
        recoveryKey: "test-recovery-key-123",
      },
    });

    console.log("✅ Created provider:", provider.username);
    console.log("Provider ID:", provider.id);

    // Generate 4 real keys
    console.log("\n🔑 Generating 4 real keys...");

    const policyTypes = ["P2TR", "P2WSH", "P2SH", "P2TR"];
    const keys = [];

    for (let i = 0; i < 4; i++) {
      // Generate a real master key with different seed each time
      const timestamp = Date.now().toString() + i;
      const seed = crypto.createHash("sha256").update(timestamp).digest();
      const masterKey = bip32.fromSeed(seed);

      // Derive the first account (m/44'/0'/0')
      const account = masterKey.derivePath("m/44'/0'/0'");

      // Get the xpub (extended public key)
      const xpub = account.neutered().toBase58();

      // Create a message to sign
      const message = `I authorize this service policy creation - Key ${i + 1}`;
      const messageBuffer = Buffer.from(message, "utf8");

      // Hash the message first (required for ECDSA signing)
      const messageHash = crypto
        .createHash("sha256")
        .update(messageBuffer)
        .digest();

      // Sign the message hash with the private key
      const signature = account.sign(messageHash);

      // Convert signature to hex (128 characters)
      const signatureHex = Buffer.from(signature).toString("hex");

      // Generate a BOLT12 offer (simplified for testing)
      const bolt12Offer =
        "lno1qgsyx6hk6umndph4jqtf9v6kkhlnnmw009juyzd9q7pwgkht7dtwwmxe3g98acmmal9y5x6n9ypmz2w33xggwd28xq7fwwccxqp58xjm8wf3v9e8k6mr5d9cxzun5v5c6w3vy6jz0mcq27rvw0";

      keys.push({
        policyType: policyTypes[i],
        xpub,
        signatureHex,
        bolt12Offer,
        index: i + 1,
      });

      console.log(`✅ Generated key ${i + 1}:`);
      console.log(`  Policy Type: ${policyTypes[i]}`);
      console.log(`  xpub: ${xpub.substring(0, 50)}...`);
      console.log(`  signature: ${signatureHex.substring(0, 50)}...`);
    }

    // Add all keys to the provider
    console.log("\n📝 Adding keys to provider...");

    for (const key of keys) {
      const newService = await prisma.service.create({
        data: {
          providerId: provider.id,
          policyType: key.policyType,
          xpubHash: key.xpub, // For now, use xpub as hash
          encryptedXpub: key.xpub,
          initialBackupFee: BigInt(1), // 1 sat
          perSignatureFee: BigInt(1), // 1 sat
          monthlyFee: BigInt(1), // 1 sat
          minTimeDelay: 7 * 24, // 7 days in hours
          bolt12Offer: key.bolt12Offer,
          isActive: true,
          isPurchased: false,
        },
      });

      console.log(`✅ Added key ${key.index} to provider!`);
      console.log(`  Service ID: ${newService.id}`);
      console.log(`  Policy Type: ${key.policyType}`);
    }

    // Generate current TOTP code
    const currentCode = speakeasy.totp({
      secret: TEST_TOTP_SECRET,
      encoding: "base32",
    });

    console.log("\n📋 Provider Account Details:");
    console.log("Username: testprovider2");
    console.log("Password: testpass123");
    console.log("TOTP Secret: " + TEST_TOTP_SECRET);
    console.log("Current TOTP Code: " + currentCode);
    console.log("");
    console.log("💡 To get a new TOTP code, use:");
    console.log(
      "  node -e \"console.log(require('speakeasy').totp({secret: '" +
        TEST_TOTP_SECRET +
        "', encoding: 'base32'}))\""
    );
    console.log("");
    console.log("🔑 Created 4 keys with 1 sat fees each");
    console.log("   - Key 1: P2TR (Taproot)");
    console.log("   - Key 2: P2WSH (Native SegWit)");
    console.log("   - Key 3: P2SH (Legacy SegWit)");
    console.log("   - Key 4: P2TR (Taproot)");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

registerProviderAndAddKeys();
