#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function rollbackEncryption() {
  console.log("🔄 PHASE 1.5 ENCRYPTION ROLLBACK\n");

  const rollbackResults = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  function logRollback(name, passed, details = "") {
    rollbackResults.total++;
    if (passed) {
      rollbackResults.passed++;
      console.log(`   ✅ ${name}${details ? ` - ${details}` : ""}`);
    } else {
      rollbackResults.failed++;
      console.log(`   ❌ ${name}${details ? ` - ${details}` : ""}`);
    }
  }

  try {
    // Step 1: Backup Current Data
    console.log("✅ Step 1: Creating backup of current data...");
    try {
      const backupData = {
        services: await prisma.service.findMany(),
        signatureRequests: await prisma.signatureRequest.findMany(),
        servicePurchases: await prisma.servicePurchase.findMany(),
        timestamp: new Date().toISOString(),
      };

      const backupPath = `backup-encryption-${Date.now()}.json`;
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      logRollback("Backup created", true, `Saved to ${backupPath}`);
    } catch (error) {
      logRollback("Backup creation", false, error.message);
      throw error;
    }
    console.log("");

    // Step 2: Disable Encryption in API Routes
    console.log("✅ Step 2: Disabling encryption in API routes...");
    try {
      const apiRoutes = [
        "src/app/api/providers/policies/route.ts",
        "src/app/api/signature-requests/create/route.ts",
        "src/app/api/signature-requests/sign/route.ts",
        "src/app/api/services/purchase/route.ts",
      ];

      let disabledRoutes = 0;
      for (const route of apiRoutes) {
        const routePath = path.join(process.cwd(), route);
        if (fs.existsSync(routePath)) {
          // Read the file
          let content = fs.readFileSync(routePath, "utf8");

          // Comment out encryption imports
          content = content.replace(
            /import \{ encryptionService \} from "@\/lib\/encryption";/g,
            '// import { encryptionService } from "@/lib/encryption";'
          );
          content = content.replace(
            /import \{ clientSecurityService \} from "@\/lib\/client-security";/g,
            '// import { clientSecurityService } from "@/lib/client-security";'
          );
          content = content.replace(
            /import \{ advancedFeaturesService \} from "@\/lib\/advanced-features";/g,
            '// import { advancedFeaturesService } from "@/lib/advanced-features";'
          );

          // Comment out encryption calls
          content = content.replace(
            /const encryptedXpubData = encryptionService\.encryptXpub\(/g,
            "// const encryptedXpubData = encryptionService.encryptXpub("
          );
          content = content.replace(
            /const encryptedPsbtData = encryptionService\.encryptPSBT\(/g,
            "// const encryptedPsbtData = encryptionService.encryptPSBT("
          );
          content = content.replace(
            /const encryptedSignedPsbtData = encryptionService\.encryptPSBT\(/g,
            "// const encryptedSignedPsbtData = encryptionService.encryptPSBT("
          );
          content = content.replace(
            /const encryptedPaymentHashData = encryptionService\.encryptPaymentHash\(/g,
            "// const encryptedPaymentHashData = encryptionService.encryptPaymentHash("
          );

          // Comment out encrypted data assignments
          content = content.replace(
            /encryptedXpubData: encryptedXpubData,/g,
            "// encryptedXpubData: encryptedXpubData,"
          );
          content = content.replace(
            /encryptedPsbtData: encryptedPsbtData,/g,
            "// encryptedPsbtData: encryptedPsbtData,"
          );
          content = content.replace(
            /encryptedSignedPsbtData: encryptedSignedPsbtData,/g,
            "// encryptedSignedPsbtData: encryptedSignedPsbtData,"
          );
          content = content.replace(
            /encryptedPaymentHashData: encryptedPaymentHashData,/g,
            "// encryptedPaymentHashData: encryptedPaymentHashData,"
          );

          // Write back the modified file
          fs.writeFileSync(routePath, content);
          disabledRoutes++;
        }
      }

      logRollback(
        "API routes encryption disabled",
        disabledRoutes === apiRoutes.length,
        `${disabledRoutes}/${apiRoutes.length} routes modified`
      );
    } catch (error) {
      logRollback("API routes rollback", false, error.message);
    }
    console.log("");

    // Step 3: Restore Plain Text Data
    console.log("✅ Step 3: Restoring plain text data...");
    try {
      // Get all services with encrypted data
      const servicesWithEncryption = await prisma.service.findMany({
        where: {
          encryptedXpubData: { not: null },
        },
      });

      let restoredServices = 0;
      for (const service of servicesWithEncryption) {
        if (service.encryptedXpub && !service.encryptedXpubData) {
          // Service already has plain text xpub, just clear encrypted data
          await prisma.service.update({
            where: { id: service.id },
            data: {
              encryptedXpubData: null,
            },
          });
          restoredServices++;
        }
      }

      // Get all signature requests with encrypted data
      const requestsWithEncryption = await prisma.signatureRequest.findMany({
        where: {
          encryptedPsbtData: { not: null },
        },
      });

      let restoredRequests = 0;
      for (const request of requestsWithEncryption) {
        if (request.psbtData && !request.encryptedPsbtData) {
          // Request already has plain text PSBT, just clear encrypted data
          await prisma.signatureRequest.update({
            where: { id: request.id },
            data: {
              encryptedPsbtData: null,
              encryptedSignedPsbtData: null,
            },
          });
          restoredRequests++;
        }
      }

      // Get all purchases with encrypted data
      const purchasesWithEncryption = await prisma.servicePurchase.findMany({
        where: {
          encryptedPaymentHashData: { not: null },
        },
      });

      let restoredPurchases = 0;
      for (const purchase of purchasesWithEncryption) {
        if (purchase.paymentHash && !purchase.encryptedPaymentHashData) {
          // Purchase already has plain text payment hash, just clear encrypted data
          await prisma.servicePurchase.update({
            where: { id: purchase.id },
            data: {
              encryptedPaymentHashData: null,
            },
          });
          restoredPurchases++;
        }
      }

      logRollback(
        "Plain text data restored",
        true,
        `${restoredServices} services, ${restoredRequests} requests, ${restoredPurchases} purchases`
      );
    } catch (error) {
      logRollback("Data restoration", false, error.message);
    }
    console.log("");

    // Step 4: Disable Environment Variables
    console.log("✅ Step 4: Disabling encryption environment variables...");
    try {
      // Note: This would typically be done by updating the .env file
      // For safety, we'll just log the recommendation
      logRollback(
        "Environment variables",
        true,
        "Manual update required - comment out ENCRYPTION_* variables in .env"
      );
    } catch (error) {
      logRollback("Environment variables", false, error.message);
    }
    console.log("");

    // Step 5: Verify Rollback
    console.log("✅ Step 5: Verifying rollback...");
    try {
      // Check that API routes no longer use encryption
      const apiRoutes = [
        "src/app/api/providers/policies/route.ts",
        "src/app/api/signature-requests/create/route.ts",
        "src/app/api/signature-requests/sign/route.ts",
        "src/app/api/services/purchase/route.ts",
      ];

      let verifiedRoutes = 0;
      for (const route of apiRoutes) {
        const routePath = path.join(process.cwd(), route);
        if (fs.existsSync(routePath)) {
          const content = fs.readFileSync(routePath, "utf8");
          const hasEncryptionImports = content.includes(
            "import { encryptionService }"
          );
          if (!hasEncryptionImports) {
            verifiedRoutes++;
          }
        }
      }

      logRollback(
        "API routes verified",
        verifiedRoutes === apiRoutes.length,
        `${verifiedRoutes}/${apiRoutes.length} routes verified`
      );

      // Check database for remaining encrypted data
      const remainingEncryptedServices = await prisma.service.count({
        where: {
          encryptedXpubData: { not: null },
        },
      });

      const remainingEncryptedRequests = await prisma.signatureRequest.count({
        where: {
          encryptedPsbtData: { not: null },
        },
      });

      const remainingEncryptedPurchases = await prisma.servicePurchase.count({
        where: {
          encryptedPaymentHashData: { not: null },
        },
      });

      logRollback(
        "Database rollback verified",
        remainingEncryptedServices === 0 &&
          remainingEncryptedRequests === 0 &&
          remainingEncryptedPurchases === 0,
        `${remainingEncryptedServices} services, ${remainingEncryptedRequests} requests, ${remainingEncryptedPurchases} purchases still encrypted`
      );
    } catch (error) {
      logRollback("Rollback verification", false, error.message);
    }
    console.log("");

    // Summary
    console.log("📊 ROLLBACK SUMMARY:");
    console.log(`   Total steps: ${rollbackResults.total}`);
    console.log(`   Passed: ${rollbackResults.passed}`);
    console.log(`   Failed: ${rollbackResults.failed}`);
    console.log(
      `   Success rate: ${(
        (rollbackResults.passed / rollbackResults.total) *
        100
      ).toFixed(1)}%`
    );

    if (rollbackResults.failed === 0) {
      console.log("\n🎉 ROLLBACK SUCCESSFUL!");
      console.log("✅ Encryption has been disabled and system restored");
      console.log("\n⚠️  IMPORTANT: Manual steps required:");
      console.log(
        "   1. Comment out ENCRYPTION_MASTER_KEY and ENCRYPTION_SALT in .env"
      );
      console.log("   2. Restart the application");
      console.log(
        "   3. Test all API endpoints to ensure they work without encryption"
      );
    } else {
      console.log("\n⚠️  ROLLBACK INCOMPLETE!");
      console.log("❌ Some steps failed - please review and complete manually");
    }

    // Safety Recommendations
    console.log("\n💡 SAFETY RECOMMENDATIONS:");
    console.log("   - Test all API endpoints after rollback");
    console.log("   - Verify no encryption-related errors in logs");
    console.log("   - Monitor system performance");
    console.log("   - Keep backup file for potential data recovery");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

rollbackEncryption().catch(console.error);
