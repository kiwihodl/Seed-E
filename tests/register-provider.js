#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

const bitcoin = require("bitcoinjs-lib");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

// Initialize Bitcoin libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

// Generate a realistic key with proper derivation
function generateRealKey(policyType) {
  // Generate a random seed
  const seed = crypto.randomBytes(32);

  // Create master key from seed
  const masterKey = bip32.fromSeed(seed);

  // Get the master fingerprint
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

  // Convert signature to hex
  const signatureHex = Buffer.from(signature).toString("hex");

  return {
    xpub,
    controlSignature: signatureHex,
    masterFingerprint,
    derivationPath,
  };
}

async function registerProvider() {
  console.log("🔧 Registering test provider...");

  try {
    // Create provider
    const provider = await prisma.provider.create({
      data: {
        username: "testprovider11", // Changed to avoid unique constraint
        passwordHash:
          "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m", // "password"
        twoFactorSecret: "JBSWY3DPEHPK3PXP", // Test 2FA secret
      },
    });

    console.log("✅ Provider created:", provider.id);

    // Generate real keys using the generate-real-keys script
    console.log("\n🔑 Generating real keys...");

    // Create some test services for the provider with Lightning addresses
    const services = [
      {
        providerId: provider.id,
        policyType: "P2WSH",
        ...generateRealKey("P2WSH"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
      {
        providerId: provider.id,
        policyType: "P2TR",
        ...generateRealKey("P2TR"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
      {
        providerId: provider.id,
        policyType: "P2SH",
        ...generateRealKey("P2SH"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
      {
        providerId: provider.id,
        policyType: "P2WSH",
        ...generateRealKey("P2WSH"),
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
    ];

    for (const serviceData of services) {
      // Hash the xpub for secure storage
      const xpubHash = require("crypto")
        .createHash("sha256")
        .update(serviceData.xpub)
        .digest("hex");

      const service = await prisma.service.create({
        data: {
          providerId: serviceData.providerId,
          policyType: serviceData.policyType,
          xpubHash: xpubHash,
          encryptedXpub: serviceData.xpub, // Store the actual xpub
          controlSignature: serviceData.controlSignature,
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

    console.log("\n🎉 Test provider and services created successfully!");
    console.log("Provider ID:", provider.id);
    console.log("Login with: testprovider / password");
    console.log("2FA Code: 123456 (for testing)");
  } catch (error) {
    console.error("❌ Error creating provider:", error);
  } finally {
    await prisma.$disconnect();
  }
}

registerProvider();
