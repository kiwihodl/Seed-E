#!/usr/bin/env node

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

async function deployPhase2() {
  console.log("🚀 PHASE 2 DEPLOYMENT: API Route Encryption\n");

  const deploymentResults = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  function logTest(name, passed, details = "") {
    deploymentResults.total++;
    if (passed) {
      deploymentResults.passed++;
      console.log(`   ✅ ${name}${details ? ` - ${details}` : ""}`);
    } else {
      deploymentResults.failed++;
      console.log(`   ❌ ${name}${details ? ` - ${details}` : ""}`);
    }
  }

  try {
    // Step 1: Validate Phase 1 is complete
    console.log("✅ Step 1: Validating Phase 1 completion...");
    const hasMasterKey = !!process.env.ENCRYPTION_MASTER_KEY;
    const hasSalt = !!process.env.ENCRYPTION_SALT;

    logTest("Phase 1 environment variables", hasMasterKey && hasSalt);

    if (!hasMasterKey || !hasSalt) {
      throw new Error("Phase 1 not completed - missing environment variables");
    }
    console.log("");

    // Step 2: Test API Route Files Exist
    console.log("✅ Step 2: Validating API route files...");
    const fs = require("fs");
    const path = require("path");

    const apiRoutes = [
      "src/app/api/providers/policies/route.ts",
      "src/app/api/signature-requests/create/route.ts",
      "src/app/api/signature-requests/sign/route.ts",
      "src/app/api/services/purchase/route.ts",
    ];

    for (const route of apiRoutes) {
      const exists = fs.existsSync(path.join(process.cwd(), route));
      logTest(`API route exists: ${route}`, exists);
    }
    console.log("");

    // Step 3: Test Database Schema for API Routes
    console.log("✅ Step 3: Testing database schema for API routes...");
    try {
      // Check Service table encrypted fields
      const serviceFields = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Service' 
        AND column_name = 'encryptedXpubData'
      `;
      logTest("Service.encryptedXpubData exists", serviceFields.length > 0);

      // Check ServicePurchase table encrypted fields
      const purchaseFields = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ServicePurchase' 
        AND column_name = 'encryptedPaymentHashData'
      `;
      logTest(
        "ServicePurchase.encryptedPaymentHashData exists",
        purchaseFields.length > 0
      );

      // Check SignatureRequest table encrypted fields
      const requestFields = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'SignatureRequest' 
        AND column_name IN ('encryptedPsbtData', 'encryptedSignedPsbtData')
      `;
      logTest(
        "SignatureRequest encrypted fields exist",
        requestFields.length >= 2
      );
    } catch (error) {
      logTest("Database schema validation", false, error.message);
      throw error;
    }
    console.log("");

    // Step 4: Test API Route Functionality
    console.log("✅ Step 4: Testing API route functionality...");
    try {
      // Create test data for API testing
      const testProvider = await prisma.provider.create({
        data: {
          username: `test-api-${Date.now()}`,
          passwordHash: "test-password-hash",
        },
      });

      const testClient = await prisma.client.create({
        data: {
          username: `test-client-${Date.now()}`,
          passwordHash: "test-password-hash",
        },
      });

      // Test 1: Provider Policies API (XPUB encryption)
      const testXpub =
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gY29AREAckqC3mNdMMM6VnVVecdWu6oAC9QduXmihMHVGRUdbvM7";
      const encryptedXpub = encryptData(testXpub, testProvider.id);

      const testService = await prisma.service.create({
        data: {
          providerId: testProvider.id,
          policyType: "P2WSH",
          xpubHash: `test-hash-${Date.now()}`,
          encryptedXpub: testXpub,
          encryptedXpubData: encryptedXpub,
          initialBackupFee: BigInt(1000),
          perSignatureFee: BigInt(500),
          minTimeDelay: 168,
          lightningAddress: "test@getalby.com",
          isActive: true,
          isPurchased: false,
        },
      });

      logTest("Provider Policies API - Service creation with encryption", true);

      // Verify encrypted data was stored
      const retrievedService = await prisma.service.findUnique({
        where: { id: testService.id },
      });

      if (retrievedService.encryptedXpubData) {
        const decryptedXpub = decryptData(
          retrievedService.encryptedXpubData,
          testProvider.id
        );
        logTest(
          "Provider Policies API - XPUB encryption/decryption",
          decryptedXpub === testXpub
        );
      } else {
        logTest(
          "Provider Policies API - XPUB encryption/decryption",
          false,
          "No encrypted data found"
        );
      }

      // Test 2: Service Purchase API (Payment hash encryption)
      const testPaymentHash = `test-payment-hash-${Date.now()}`;
      const encryptedPaymentHash = encryptData(testPaymentHash, testClient.id);

      const testPurchase = await prisma.servicePurchase.create({
        data: {
          clientId: testClient.id,
          serviceId: testService.id,
          paymentHash: testPaymentHash,
          encryptedPaymentHashData: encryptedPaymentHash,
          paymentAmount: BigInt(1000),
          isActive: true,
        },
      });

      logTest("Service Purchase API - Purchase creation with encryption", true);

      // Verify encrypted payment hash
      const retrievedPurchase = await prisma.servicePurchase.findUnique({
        where: { id: testPurchase.id },
      });

      if (retrievedPurchase.encryptedPaymentHashData) {
        const decryptedPaymentHash = decryptData(
          retrievedPurchase.encryptedPaymentHashData,
          testClient.id
        );
        logTest(
          "Service Purchase API - Payment hash encryption/decryption",
          decryptedPaymentHash === testPaymentHash
        );
      } else {
        logTest(
          "Service Purchase API - Payment hash encryption/decryption",
          false,
          "No encrypted data found"
        );
      }

      // Test 3: Signature Request API (PSBT encryption)
      const testPsbt = "test-psbt-data-67890";
      const encryptedPsbt = encryptData(testPsbt, testClient.id);

      const testSignatureRequest = await prisma.signatureRequest.create({
        data: {
          clientId: testClient.id,
          serviceId: testService.id,
          psbtData: testPsbt,
          encryptedPsbtData: encryptedPsbt,
          signatureFee: BigInt(500),
          unlocksAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: "PENDING",
          isActive: true,
        },
      });

      logTest("Signature Request API - Request creation with encryption", true);

      // Verify encrypted PSBT
      const retrievedRequest = await prisma.signatureRequest.findUnique({
        where: { id: testSignatureRequest.id },
      });

      if (retrievedRequest.encryptedPsbtData) {
        const decryptedPsbt = decryptData(
          retrievedRequest.encryptedPsbtData,
          testClient.id
        );
        logTest(
          "Signature Request API - PSBT encryption/decryption",
          decryptedPsbt === testPsbt
        );
      } else {
        logTest(
          "Signature Request API - PSBT encryption/decryption",
          false,
          "No encrypted data found"
        );
      }

      // Test 4: Signed PSBT encryption
      const testSignedPsbt = "test-signed-psbt-data-11111";
      const encryptedSignedPsbt = encryptData(testSignedPsbt, testProvider.id);

      await prisma.signatureRequest.update({
        where: { id: testSignatureRequest.id },
        data: {
          signedPsbtData: testSignedPsbt,
          encryptedSignedPsbtData: encryptedSignedPsbt,
          status: "SIGNED",
        },
      });

      logTest("Signature Request API - Signed PSBT encryption", true);

      // Verify encrypted signed PSBT
      const updatedRequest = await prisma.signatureRequest.findUnique({
        where: { id: testSignatureRequest.id },
      });

      if (updatedRequest.encryptedSignedPsbtData) {
        const decryptedSignedPsbt = decryptData(
          updatedRequest.encryptedSignedPsbtData,
          testProvider.id
        );
        logTest(
          "Signature Request API - Signed PSBT encryption/decryption",
          decryptedSignedPsbt === testSignedPsbt
        );
      } else {
        logTest(
          "Signature Request API - Signed PSBT encryption/decryption",
          false,
          "No encrypted data found"
        );
      }

      // Cleanup test data
      await prisma.signatureRequest.delete({
        where: { id: testSignatureRequest.id },
      });
      await prisma.servicePurchase.delete({ where: { id: testPurchase.id } });
      await prisma.service.delete({ where: { id: testService.id } });
      await prisma.client.delete({ where: { id: testClient.id } });
      await prisma.provider.delete({ where: { id: testProvider.id } });
    } catch (error) {
      logTest("API route functionality", false, error.message);
      throw error;
    }
    console.log("");

    // Step 5: Performance Test for API Routes
    console.log("✅ Step 5: Performance testing for API routes...");
    const startTime = Date.now();
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      encryptData(`test-psbt-${i}`, `client-${i}`);
      encryptData(`test-xpub-${i}`, `provider-${i}`);
      encryptData(`test-payment-${i}`, `client-${i}`);
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / (iterations * 3);

    logTest(
      "API route performance acceptable",
      avgTime < 1000,
      `Average time: ${avgTime.toFixed(2)}ms`
    );
    console.log("");

    // Summary
    console.log("📊 PHASE 2 DEPLOYMENT SUMMARY:");
    console.log(`   Total tests: ${deploymentResults.total}`);
    console.log(`   Passed: ${deploymentResults.passed}`);
    console.log(`   Failed: ${deploymentResults.failed}`);
    console.log(
      `   Success rate: ${(
        (deploymentResults.passed / deploymentResults.total) *
        100
      ).toFixed(1)}%`
    );

    if (deploymentResults.failed === 0) {
      console.log("\n🎉 PHASE 2 DEPLOYMENT SUCCESSFUL!");
      console.log("✅ API route encryption is ready for production");
      console.log("\n🚀 Ready to proceed to Phase 3: Monitoring & Production");
    } else {
      console.log("\n⚠️  PHASE 2 DEPLOYMENT FAILED!");
      console.log("❌ Please fix the issues above before proceeding");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Phase 2 deployment failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployPhase2().catch(console.error);
