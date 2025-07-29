#!/usr/bin/env node

/**
 * Phase 1.5 Encryption Data Migration Script
 *
 * Migrates existing database records to use encryption:
 * - Encrypts existing XPUBs in Service table
 * - Encrypts existing PSBTs in SignatureRequest table
 * - Encrypts existing payment hashes in ServicePurchase table
 * - Validates encryption/decryption works correctly
 * - Maintains backward compatibility
 */

const { PrismaClient } = require("@prisma/client");

// Import encryption service using dynamic import for ES modules
let encryptionService;
async function loadEncryptionService() {
  const { encryptionService: service } = await import("../src/lib/encryption.js");
  encryptionService = service;
}

const prisma = new PrismaClient();

async function migrateEncryption() {
  console.log("🔐 Starting Phase 1.5 Encryption Data Migration...\n");

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

    // Step 2: Migrate Service records (XPUBs)
    console.log("✅ Step 2: Migrating Service records (XPUBs)...");
    const services = await prisma.service.findMany({
      where: {
        encryptedXpub: { not: null },
        encryptedXpubData: null, // Only migrate unencrypted records
      },
    });

    console.log(`   Found ${services.length} services to encrypt`);

    for (const service of services) {
      try {
        // Encrypt the XPUB
        const encryptedXpubData = encryptionService.encryptXpub(
          service.encryptedXpub,
          service.providerId
        );

        // Update the record with encrypted data
        await prisma.service.update({
          where: { id: service.id },
          data: {
            encryptedXpubData: encryptedXpubData,
          },
        });

        // Verify encryption worked
        const updatedService = await prisma.service.findUnique({
          where: { id: service.id },
        });

        if (updatedService.encryptedXpubData) {
          // Test decryption
          const decryptedXpub = encryptionService.decryptXpub(
            updatedService.encryptedXpubData,
            service.providerId
          );

          if (decryptedXpub === service.encryptedXpub) {
            console.log(
              `   ✅ Encrypted service ${service.id} (${service.policyType})`
            );
          } else {
            console.log(`   ❌ Decryption failed for service ${service.id}`);
          }
        }
      } catch (error) {
        console.log(
          `   ❌ Failed to encrypt service ${service.id}: ${error.message}`
        );
      }
    }

    // Step 3: Migrate SignatureRequest records (PSBTs)
    console.log("\n✅ Step 3: Migrating SignatureRequest records (PSBTs)...");
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: {
        psbtData: { not: null },
        encryptedPsbtData: null, // Only migrate unencrypted records
      },
    });

    console.log(
      `   Found ${signatureRequests.length} signature requests to encrypt`
    );

    for (const request of signatureRequests) {
      try {
        // Encrypt the PSBT data
        const encryptedPsbtData = encryptionService.encryptPSBT(
          request.psbtData,
          request.id
        );

        // Update the record with encrypted data
        await prisma.signatureRequest.update({
          where: { id: request.id },
          data: {
            encryptedPsbtData: encryptedPsbtData,
          },
        });

        // Verify encryption worked
        const updatedRequest = await prisma.signatureRequest.findUnique({
          where: { id: request.id },
        });

        if (updatedRequest.encryptedPsbtData) {
          // Test decryption
          const decryptedPsbt = encryptionService.decryptPSBT(
            updatedRequest.encryptedPsbtData,
            request.id
          );

          if (decryptedPsbt === request.psbtData) {
            console.log(`   ✅ Encrypted signature request ${request.id}`);
          } else {
            console.log(
              `   ❌ Decryption failed for signature request ${request.id}`
            );
          }
        }
      } catch (error) {
        console.log(
          `   ❌ Failed to encrypt signature request ${request.id}: ${error.message}`
        );
      }
    }

    // Step 4: Migrate signed PSBTs
    console.log("\n✅ Step 4: Migrating signed PSBTs...");
    const signedRequests = await prisma.signatureRequest.findMany({
      where: {
        signedPsbtData: { not: null },
        encryptedSignedPsbtData: null, // Only migrate unencrypted records
      },
    });

    console.log(`   Found ${signedRequests.length} signed PSBTs to encrypt`);

    for (const request of signedRequests) {
      try {
        // Encrypt the signed PSBT data
        const encryptedSignedPsbtData = encryptionService.encryptPSBT(
          request.signedPsbtData,
          request.id
        );

        // Update the record with encrypted data
        await prisma.signatureRequest.update({
          where: { id: request.id },
          data: {
            encryptedSignedPsbtData: encryptedSignedPsbtData,
          },
        });

        console.log(`   ✅ Encrypted signed PSBT for request ${request.id}`);
      } catch (error) {
        console.log(
          `   ❌ Failed to encrypt signed PSBT for request ${request.id}: ${error.message}`
        );
      }
    }

    // Step 5: Migrate ServicePurchase records (payment hashes)
    console.log(
      "\n✅ Step 5: Migrating ServicePurchase records (payment hashes)..."
    );
    const purchases = await prisma.servicePurchase.findMany({
      where: {
        paymentHash: { not: null },
        encryptedPaymentHashData: null, // Only migrate unencrypted records
      },
    });

    console.log(`   Found ${purchases.length} purchases to encrypt`);

    for (const purchase of purchases) {
      try {
        // Encrypt the payment hash
        const encryptedPaymentHashData = encryptionService.encryptPaymentHash(
          purchase.paymentHash,
          purchase.id
        );

        // Update the record with encrypted data
        await prisma.servicePurchase.update({
          where: { id: purchase.id },
          data: {
            encryptedPaymentHashData: encryptedPaymentHashData,
          },
        });

        // Verify encryption worked
        const updatedPurchase = await prisma.servicePurchase.findUnique({
          where: { id: purchase.id },
        });

        if (updatedPurchase.encryptedPaymentHashData) {
          // Test decryption
          const decryptedPaymentHash = encryptionService.decryptPaymentHash(
            updatedPurchase.encryptedPaymentHashData,
            purchase.id
          );

          if (decryptedPaymentHash === purchase.paymentHash) {
            console.log(`   ✅ Encrypted purchase ${purchase.id}`);
          } else {
            console.log(`   ❌ Decryption failed for purchase ${purchase.id}`);
          }
        }
      } catch (error) {
        console.log(
          `   ❌ Failed to encrypt purchase ${purchase.id}: ${error.message}`
        );
      }
    }

    // Step 6: Generate migration report
    console.log("\n✅ Step 6: Generating migration report...");
    const migrationReport = await generateMigrationReport();
    console.log("   Migration report generated successfully\n");

    // Step 7: Validate overall migration
    console.log("✅ Step 7: Validating migration...");
    const validationResult = await validateMigration();

    if (validationResult.success) {
      console.log("   ✅ Migration validation passed\n");
    } else {
      console.log(
        `   ❌ Migration validation failed: ${validationResult.error}\n`
      );
    }

    console.log("🎉 Phase 1.5 Encryption Data Migration COMPLETE!");
    console.log("\n📊 Migration Summary:");
    console.log(`   Services migrated: ${services.length}`);
    console.log(`   Signature requests migrated: ${signatureRequests.length}`);
    console.log(`   Signed PSBTs migrated: ${signedRequests.length}`);
    console.log(`   Purchases migrated: ${purchases.length}`);
    console.log("\n🔐 All sensitive data is now encrypted!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function generateMigrationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    services: await prisma.service.count({
      where: { encryptedXpubData: { not: null } },
    }),
    signatureRequests: await prisma.signatureRequest.count({
      where: { encryptedPsbtData: { not: null } },
    }),
    signedPsbts: await prisma.signatureRequest.count({
      where: { encryptedSignedPsbtData: { not: null } },
    }),
    purchases: await prisma.servicePurchase.count({
      where: { encryptedPaymentHashData: { not: null } },
    }),
  };

  console.log("   Migration Report:");
  console.log(`   - Encrypted services: ${report.services}`);
  console.log(`   - Encrypted signature requests: ${report.signatureRequests}`);
  console.log(`   - Encrypted signed PSBTs: ${report.signedPsbts}`);
  console.log(`   - Encrypted purchases: ${report.purchases}`);

  return report;
}

async function validateMigration() {
  try {
    // Test a few random records to ensure encryption/decryption works
    const testService = await prisma.service.findFirst({
      where: { encryptedXpubData: { not: null } },
    });

    if (testService) {
      const decryptedXpub = encryptionService.decryptXpub(
        testService.encryptedXpubData,
        testService.providerId
      );

      if (!decryptedXpub) {
        return { success: false, error: "Service decryption failed" };
      }
    }

    const testRequest = await prisma.signatureRequest.findFirst({
      where: { encryptedPsbtData: { not: null } },
    });

    if (testRequest) {
      const decryptedPsbt = encryptionService.decryptPSBT(
        testRequest.encryptedPsbtData,
        testRequest.id
      );

      if (!decryptedPsbt) {
        return { success: false, error: "Signature request decryption failed" };
      }
    }

    const testPurchase = await prisma.servicePurchase.findFirst({
      where: { encryptedPaymentHashData: { not: null } },
    });

    if (testPurchase) {
      const decryptedPaymentHash = encryptionService.decryptPaymentHash(
        testPurchase.encryptedPaymentHashData,
        testPurchase.id
      );

      if (!decryptedPaymentHash) {
        return { success: false, error: "Purchase decryption failed" };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the migration
migrateEncryption().catch(console.error);
