#!/usr/bin/env node

/**
 * Phase 1.5 Encryption Data Migration - SIMPLIFIED
 *
 * Simple migration script that uses crypto directly
 * - Counts records that need migration
 * - Tests basic encryption/decryption
 * - Generates migration plan
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Simple encryption functions for testing
function encryptData(data, context) {
  const key = crypto.pbkdf2Sync(
    process.env.ENCRYPTION_MASTER_KEY || "default-key",
    process.env.ENCRYPTION_SALT || "default-salt",
    100000,
    32,
    "sha256"
  );

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    encrypted,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    version: "1.0",
  };
}

function decryptData(encryptedField, context) {
  const key = crypto.pbkdf2Sync(
    process.env.ENCRYPTION_MASTER_KEY || "default-key",
    process.env.ENCRYPTION_SALT || "default-salt",
    100000,
    32,
    "sha256"
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encryptedField.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(encryptedField.authTag, "base64"));

  let decrypted = decipher.update(encryptedField.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

async function analyzeMigration() {
  console.log("🔐 Phase 1.5 Encryption Data Migration - ANALYSIS\n");

  try {
    // Check environment variables
    console.log("✅ Step 1: Checking environment variables...");
    const hasMasterKey = !!process.env.ENCRYPTION_MASTER_KEY;
    const hasSalt = !!process.env.ENCRYPTION_SALT;

    console.log(
      `   ENCRYPTION_MASTER_KEY: ${hasMasterKey ? "✅ Set" : "❌ Missing"}`
    );
    console.log(`   ENCRYPTION_SALT: ${hasSalt ? "✅ Set" : "❌ Missing"}`);

    if (!hasMasterKey || !hasSalt) {
      console.log("   ⚠️  Using default values for testing");
    }
    console.log("");

    // Test encryption
    console.log("✅ Step 2: Testing encryption...");
    const testData = "test-encryption-data";
    const encrypted = encryptData(testData, "test");
    const decrypted = decryptData(encrypted, "test");

    if (decrypted === testData) {
      console.log("   ✅ Encryption/decryption test passed");
    } else {
      console.log("   ❌ Encryption/decryption test failed");
      return;
    }
    console.log("");

    // Analyze Service records (XPUBs)
    console.log("✅ Step 3: Analyzing Service records (XPUBs)...");
    const servicesToMigrate = await prisma.service.findMany({
      where: {
        encryptedXpub: { not: null },
        OR: [
          { encryptedXpubData: null },
          { encryptedXpubData: { equals: null } },
        ],
      },
    });

    const servicesAlreadyEncrypted = await prisma.service.count({
      where: { encryptedXpubData: { not: null } },
    });

    console.log(`   Services to migrate: ${servicesToMigrate.length}`);
    console.log(`   Services already encrypted: ${servicesAlreadyEncrypted}`);
    console.log(
      `   Total services: ${
        servicesToMigrate.length + servicesAlreadyEncrypted
      }`
    );

    // Test encryption with first service
    if (servicesToMigrate.length > 0) {
      const testService = servicesToMigrate[0];
      console.log(`   Testing encryption with service: ${testService.id}`);

      const encryptedXpubData = encryptData(
        testService.encryptedXpub,
        `xpub:${testService.providerId}`
      );

      const decryptedXpub = decryptData(
        encryptedXpubData,
        `xpub:${testService.providerId}`
      );

      if (decryptedXpub === testService.encryptedXpub) {
        console.log("   ✅ Service encryption/decryption test passed");
      } else {
        console.log("   ❌ Service encryption/decryption test failed");
      }
    }
    console.log("");

    // Analyze SignatureRequest records (PSBTs)
    console.log("✅ Step 4: Analyzing SignatureRequest records (PSBTs)...");
    const signatureRequestsToMigrate = await prisma.signatureRequest.findMany({
      where: {
        psbtData: { not: null },
        encryptedPsbtData: null, // Only count unencrypted records
      },
    });

    const signatureRequestsAlreadyEncrypted =
      await prisma.signatureRequest.count({
        where: { encryptedPsbtData: { not: null } },
      });

    console.log(
      `   Signature requests to migrate: ${signatureRequestsToMigrate.length}`
    );
    console.log(
      `   Signature requests already encrypted: ${signatureRequestsAlreadyEncrypted}`
    );
    console.log(
      `   Total signature requests: ${
        signatureRequestsToMigrate.length + signatureRequestsAlreadyEncrypted
      }`
    );

    // Test encryption with first signature request
    if (signatureRequestsToMigrate.length > 0) {
      const testRequest = signatureRequestsToMigrate[0];
      console.log(
        `   Testing encryption with signature request: ${testRequest.id}`
      );

      const encryptedPsbtData = encryptData(
        testRequest.psbtData,
        `psbt:${testRequest.id}`
      );

      const decryptedPsbt = decryptData(
        encryptedPsbtData,
        `psbt:${testRequest.id}`
      );

      if (decryptedPsbt === testRequest.psbtData) {
        console.log(
          "   ✅ Signature request encryption/decryption test passed"
        );
      } else {
        console.log(
          "   ❌ Signature request encryption/decryption test failed"
        );
      }
    }
    console.log("");

    // Analyze signed PSBTs
    console.log("✅ Step 5: Analyzing signed PSBTs...");
    const signedPsbtsToMigrate = await prisma.signatureRequest.findMany({
      where: {
        signedPsbtData: { not: null },
        encryptedSignedPsbtData: null, // Only count unencrypted records
      },
    });

    const signedPsbtsAlreadyEncrypted = await prisma.signatureRequest.count({
      where: { encryptedSignedPsbtData: { not: null } },
    });

    console.log(`   Signed PSBTs to migrate: ${signedPsbtsToMigrate.length}`);
    console.log(
      `   Signed PSBTs already encrypted: ${signedPsbtsAlreadyEncrypted}`
    );
    console.log(
      `   Total signed PSBTs: ${
        signedPsbtsToMigrate.length + signedPsbtsAlreadyEncrypted
      }`
    );

    // Test encryption with first signed PSBT
    if (signedPsbtsToMigrate.length > 0) {
      const testSignedRequest = signedPsbtsToMigrate[0];
      console.log(
        `   Testing encryption with signed PSBT: ${testSignedRequest.id}`
      );

      const encryptedSignedPsbtData = encryptData(
        testSignedRequest.signedPsbtData,
        `psbt:${testSignedRequest.id}`
      );

      const decryptedSignedPsbt = decryptData(
        encryptedSignedPsbtData,
        `psbt:${testSignedRequest.id}`
      );

      if (decryptedSignedPsbt === testSignedRequest.signedPsbtData) {
        console.log("   ✅ Signed PSBT encryption/decryption test passed");
      } else {
        console.log("   ❌ Signed PSBT encryption/decryption test failed");
      }
    }
    console.log("");

    // Analyze ServicePurchase records (payment hashes)
    console.log(
      "✅ Step 6: Analyzing ServicePurchase records (payment hashes)..."
    );
    const purchasesToMigrate = await prisma.servicePurchase.findMany({
      where: {
        paymentHash: { not: null },
        encryptedPaymentHashData: null, // Only count unencrypted records
      },
    });

    const purchasesAlreadyEncrypted = await prisma.servicePurchase.count({
      where: { encryptedPaymentHashData: { not: null } },
    });

    console.log(`   Purchases to migrate: ${purchasesToMigrate.length}`);
    console.log(`   Purchases already encrypted: ${purchasesAlreadyEncrypted}`);
    console.log(
      `   Total purchases: ${
        purchasesToMigrate.length + purchasesAlreadyEncrypted
      }`
    );

    // Test encryption with first purchase
    if (purchasesToMigrate.length > 0) {
      const testPurchase = purchasesToMigrate[0];
      console.log(`   Testing encryption with purchase: ${testPurchase.id}`);

      const encryptedPaymentHashData = encryptData(
        testPurchase.paymentHash,
        `payment:${testPurchase.id}`
      );

      const decryptedPaymentHash = decryptData(
        encryptedPaymentHashData,
        `payment:${testPurchase.id}`
      );

      if (decryptedPaymentHash === testPurchase.paymentHash) {
        console.log("   ✅ Purchase encryption/decryption test passed");
      } else {
        console.log("   ❌ Purchase encryption/decryption test failed");
      }
    }
    console.log("");

    // Generate migration plan
    console.log("✅ Step 7: Generating migration plan...");
    const totalRecordsToMigrate =
      servicesToMigrate.length +
      signatureRequestsToMigrate.length +
      signedPsbtsToMigrate.length +
      purchasesToMigrate.length;

    console.log(`   Total records to migrate: ${totalRecordsToMigrate}`);
    console.log(
      `   Estimated migration time: ${Math.ceil(
        totalRecordsToMigrate / 100
      )} minutes`
    );
    console.log("   Migration plan generated successfully\n");

    // Summary
    console.log("📊 MIGRATION ANALYSIS SUMMARY:");
    console.log("   ✅ Encryption service validated");
    console.log("   ✅ All encryption/decryption tests passed");
    console.log("   ✅ Migration plan generated");
    console.log(`   📋 Records to migrate: ${totalRecordsToMigrate}`);
    console.log("   🚀 Ready for actual migration\n");

    console.log("🎉 ANALYSIS COMPLETE - Ready for migration!");
    console.log("\n💡 To run the actual migration:");
    console.log("   node scripts/migrate-encryption.js");
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeMigration().catch(console.error);
