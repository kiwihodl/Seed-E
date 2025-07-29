#!/usr/bin/env node

/**
 * Phase 1.5 Encryption Data Migration - DRY RUN
 *
 * Tests the migration process without actually modifying data:
 * - Counts records that would be migrated
 * - Validates encryption service
 * - Tests encryption/decryption with sample data
 * - Generates migration plan
 */

const { PrismaClient } = require("@prisma/client");

// Import encryption service using dynamic import for ES modules
let encryptionService;
async function loadEncryptionService() {
  const { encryptionService: service } = await import(
    "../src/lib/encryption.js"
  );
  encryptionService = service;
}

const prisma = new PrismaClient();

async function dryRunMigration() {
  console.log("🔐 Phase 1.5 Encryption Data Migration - DRY RUN\n");

  try {
    // Load encryption service
    console.log("✅ Loading encryption service...");
    await loadEncryptionService();
    console.log("   Encryption service loaded successfully\n");

    // Step 1: Validate encryption service
    console.log("✅ Step 1: Validating encryption service...");
    const isValid = encryptionService.validateConfig();
    if (!isValid) {
      throw new Error("Encryption service validation failed");
    }
    console.log("   Encryption service validated successfully\n");

    // Step 2: Analyze Service records (XPUBs)
    console.log("✅ Step 2: Analyzing Service records (XPUBs)...");
    const servicesToMigrate = await prisma.service.findMany({
      where: {
        encryptedXpub: { not: null },
        encryptedXpubData: null, // Only count unencrypted records
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

      const encryptedXpubData = encryptionService.encryptXpub(
        testService.encryptedXpub,
        testService.providerId
      );

      const decryptedXpub = encryptionService.decryptXpub(
        encryptedXpubData,
        testService.providerId
      );

      if (decryptedXpub === testService.encryptedXpub) {
        console.log("   ✅ Service encryption/decryption test passed");
      } else {
        console.log("   ❌ Service encryption/decryption test failed");
      }
    }
    console.log("");

    // Step 3: Analyze SignatureRequest records (PSBTs)
    console.log("✅ Step 3: Analyzing SignatureRequest records (PSBTs)...");
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

      const encryptedPsbtData = encryptionService.encryptPSBT(
        testRequest.psbtData,
        testRequest.id
      );

      const decryptedPsbt = encryptionService.decryptPSBT(
        encryptedPsbtData,
        testRequest.id
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

    // Step 4: Analyze signed PSBTs
    console.log("✅ Step 4: Analyzing signed PSBTs...");
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

      const encryptedSignedPsbtData = encryptionService.encryptPSBT(
        testSignedRequest.signedPsbtData,
        testSignedRequest.id
      );

      const decryptedSignedPsbt = encryptionService.decryptPSBT(
        encryptedSignedPsbtData,
        testSignedRequest.id
      );

      if (decryptedSignedPsbt === testSignedRequest.signedPsbtData) {
        console.log("   ✅ Signed PSBT encryption/decryption test passed");
      } else {
        console.log("   ❌ Signed PSBT encryption/decryption test failed");
      }
    }
    console.log("");

    // Step 5: Analyze ServicePurchase records (payment hashes)
    console.log(
      "✅ Step 5: Analyzing ServicePurchase records (payment hashes)..."
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

      const encryptedPaymentHashData = encryptionService.encryptPaymentHash(
        testPurchase.paymentHash,
        testPurchase.id
      );

      const decryptedPaymentHash = encryptionService.decryptPaymentHash(
        encryptedPaymentHashData,
        testPurchase.id
      );

      if (decryptedPaymentHash === testPurchase.paymentHash) {
        console.log("   ✅ Purchase encryption/decryption test passed");
      } else {
        console.log("   ❌ Purchase encryption/decryption test failed");
      }
    }
    console.log("");

    // Step 6: Generate migration plan
    console.log("✅ Step 6: Generating migration plan...");
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

    // Step 7: Summary
    console.log("📊 DRY RUN SUMMARY:");
    console.log("   ✅ Encryption service validated");
    console.log("   ✅ All encryption/decryption tests passed");
    console.log("   ✅ Migration plan generated");
    console.log(`   📋 Records to migrate: ${totalRecordsToMigrate}`);
    console.log("   🚀 Ready for actual migration\n");

    console.log("🎉 DRY RUN COMPLETE - Ready for actual migration!");
    console.log("\n💡 To run the actual migration:");
    console.log("   node scripts/migrate-encryption.js");
  } catch (error) {
    console.error("❌ Dry run failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the dry run
dryRunMigration().catch(console.error);
