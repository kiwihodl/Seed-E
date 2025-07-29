#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");
const bitcoin = require("bitcoinjs-lib");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

config();

// Initialize Bitcoin libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const prisma = new PrismaClient();

// Generate a realistic key with proper derivation
function generateRealKey(policyType) {
  // Generate a random seed
  const seed = crypto.randomBytes(32);

  // Create master key from seed
  const masterKey = bip32.fromSeed(seed);

  // Get the master fingerprint as a proper hex string (8 characters)
  const masterFingerprint = Buffer.from(masterKey.fingerprint)
    .toString("hex")
    .toUpperCase();

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

  // Convert signature to hex
  const signatureHex = Buffer.from(signature).toString("hex");

  return {
    xpub,
    masterFingerprint,
    derivationPath,
  };
}

async function cleanupAllServices() {
  console.log("🧹 Cleaning up ALL existing services...");

  try {
    // First, let's see what services exist
    const allServices = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        lightningAddress: true,
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log(`📊 Found ${allServices.length} existing services:`);
    allServices.forEach((service) => {
      console.log(`  - ID: ${service.id}`);
      console.log(`    Policy: ${service.policyType}`);
      console.log(`    Provider: ${service.provider.username}`);
      console.log(
        `    Lightning Address: ${service.lightningAddress || "NOT SET"}`
      );
    });

    if (allServices.length === 0) {
      console.log("✅ No services to clean up!");
      return;
    }

    // Delete all purchases first
    console.log(`\n🗑️  Deleting all purchases...`);
    const deletePurchasesResult = await prisma.servicePurchase.deleteMany({});
    console.log(`✅ Deleted ${deletePurchasesResult.count} purchases`);

    // Delete all services
    console.log(`\n🗑️  Deleting all services...`);
    const deleteResult = await prisma.service.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} services`);

    console.log("\n✅ All services and purchases have been removed!");
  } catch (error) {
    console.error("❌ Error cleaning up services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createNewServices() {
  console.log(
    "\n🔧 Creating new services with proper master fingerprint and derivation path..."
  );

  try {
    // Get the provider
    const provider = await prisma.provider.findFirst({
      where: {
        username: "testprovider11",
      },
    });

    if (!provider) {
      console.log(
        "❌ Provider testprovider11 not found. Creating new provider..."
      );
      const newProvider = await prisma.provider.create({
        data: {
          username: "testprovider11",
          passwordHash:
            "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m", // "password"
          twoFactorSecret: "JBSWY3DPEHPK3PXP", // Test 2FA secret
        },
      });
      console.log(`✅ Created provider: ${newProvider.id}`);
    }

    const providerId =
      provider?.id ||
      (
        await prisma.provider.findFirst({
          where: { username: "testprovider11" },
        })
      ).id;

    // Create multiple P2WSH services for multisig testing
    const services = [
      {
        providerId: providerId,
        policyType: "P2WSH",
        ...generateRealKey("P2WSH"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com",
        isActive: true,
      },
      {
        providerId: providerId,
        policyType: "P2WSH",
        ...generateRealKey("P2WSH"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com",
        isActive: true,
      },
      {
        providerId: providerId,
        policyType: "P2WSH",
        ...generateRealKey("P2WSH"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com",
        isActive: true,
      },
    ];

    console.log("\n🔑 Generating real P2WSH keys for multisig testing...");

    for (const serviceData of services) {
      // Hash the xpub for secure storage
      const xpubHash = crypto
        .createHash("sha256")
        .update(serviceData.xpub)
        .digest("hex");

      const service = await prisma.service.create({
        data: {
          providerId: serviceData.providerId,
          policyType: serviceData.policyType,
          xpubHash: xpubHash,
          encryptedXpub: serviceData.xpub, // Store the actual xpub
          masterFingerprint: serviceData.masterFingerprint,
          derivationPath: serviceData.derivationPath,
          initialBackupFee: serviceData.initialBackupFee,
          perSignatureFee: serviceData.perSignatureFee,
          minTimeDelay: serviceData.minTimeDelay,
          lightningAddress: serviceData.lightningAddress,
          isActive: serviceData.isActive,
        },
      });
      console.log(
        "✅ Service created:",
        service.policyType,
        "-",
        service.encryptedXpub.substring(0, 20) + "..."
      );
      console.log(`  Master Fingerprint: ${serviceData.masterFingerprint}`);
      console.log(`  Derivation Path: ${serviceData.derivationPath}`);
    }

    console.log("\n🎉 New P2WSH services created successfully!");
    console.log("💡 You can now purchase these services for multisig testing.");
    console.log(
      "🔑 Each service has a unique master fingerprint and xpub for 2-of-3 multisig setup."
    );
  } catch (error) {
    console.error("❌ Error creating new services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await cleanupAllServices();
  await createNewServices();
}

main();
