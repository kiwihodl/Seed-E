#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

// Generate a realistic xpub key
function generateRealXpub() {
  const prefixes = ["xpub6", "xpub5", "xpub4"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  // Generate a realistic xpub key (111 characters total)
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let xpub = prefix;

  // Add the rest of the xpub key
  for (let i = 0; i < 106; i++) {
    xpub += chars[Math.floor(Math.random() * chars.length)];
  }

  return xpub;
}

async function registerProvider() {
  console.log("🔧 Registering test provider...");

  try {
    // Create provider
    const provider = await prisma.provider.create({
      data: {
        username: "testprovider8", // Changed to avoid unique constraint
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
        xpubHash: "hash9", // Changed to unique values
        encryptedXpub: generateRealXpub(),
        controlSignature: "sig1",
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
      {
        providerId: provider.id,
        policyType: "P2TR",
        xpubHash: "hash10", // Changed to unique values
        encryptedXpub: generateRealXpub(),
        controlSignature: "sig2",
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
      {
        providerId: provider.id,
        policyType: "P2SH",
        xpubHash: "hash11", // Changed to unique values
        encryptedXpub: generateRealXpub(),
        controlSignature: "sig3",
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
      {
        providerId: provider.id,
        policyType: "P2WSH",
        xpubHash: "hash12", // Changed to unique values
        encryptedXpub: generateRealXpub(),
        controlSignature: "sig4",
        initialBackupFee: BigInt(1), // 1 sat
        perSignatureFee: BigInt(1), // 1 sat
        minTimeDelay: 168, // 7 days
        lightningAddress: "highlyregarded@getalby.com", // User's real Alby address
        isActive: true,
      },
    ];

    for (const serviceData of services) {
      const service = await prisma.service.create({
        data: serviceData,
      });
      console.log(
        "✅ Service created:",
        service.policyType,
        "-",
        service.encryptedXpub.substring(0, 20) + "..."
      );
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
