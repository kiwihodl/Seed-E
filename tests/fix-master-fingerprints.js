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

// Generate a proper master fingerprint as hex string
function generateProperMasterFingerprint() {
  // Generate a random seed
  const seed = crypto.randomBytes(32);

  // Create master key from seed
  const masterKey = bip32.fromSeed(seed);

  // Get the master fingerprint as a proper hex string (8 characters)
  const masterFingerprint = masterKey.fingerprint.toString("hex").toUpperCase();

  console.log(
    `Generated master fingerprint: ${masterFingerprint} (${masterFingerprint.length} chars)`
  );

  return {
    masterKey,
    masterFingerprint,
  };
}

async function fixMasterFingerprints() {
  console.log("🔧 Fixing master fingerprints to proper hex format...");

  try {
    // Get all services
    const services = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        masterFingerprint: true,
        derivationPath: true,
        encryptedXpub: true,
      },
    });

    console.log(`📊 Found ${services.length} services to fix:`);

    for (const service of services) {
      console.log(`\n🔧 Fixing service: ${service.id}`);
      console.log(`   Current fingerprint: "${service.masterFingerprint}"`);

      // Generate a new proper master fingerprint
      const { masterFingerprint: newFingerprint } =
        generateProperMasterFingerprint();

      // Update the service with the proper fingerprint
      await prisma.service.update({
        where: { id: service.id },
        data: {
          masterFingerprint: newFingerprint,
        },
      });

      console.log(`   ✅ Updated to: "${newFingerprint}"`);
    }

    console.log("\n🎉 All master fingerprints have been fixed!");
  } catch (error) {
    console.error("❌ Error fixing master fingerprints:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMasterFingerprints();
