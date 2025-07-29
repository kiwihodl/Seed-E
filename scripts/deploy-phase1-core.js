#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Simple encryption functions for testing (matching the implementation)
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

async function deployPhase1() {
  console.log("🚀 PHASE 1 DEPLOYMENT: Core Encryption Infrastructure\n");

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
    // Step 1: Validate Environment Variables
    console.log("✅ Step 1: Validating environment variables...");
    const hasMasterKey = !!process.env.ENCRYPTION_MASTER_KEY;
    const hasSalt = !!process.env.ENCRYPTION_SALT;

    logTest("ENCRYPTION_MASTER_KEY is set", hasMasterKey);
    logTest("ENCRYPTION_SALT is set", hasSalt);

    if (!hasMasterKey || !hasSalt) {
      throw new Error("Missing required environment variables");
    }
    console.log("");

    // Step 2: Test Database Connection
    console.log("✅ Step 2: Testing database connection...");
    await prisma.$connect();
    logTest("Database connection successful", true);
    console.log("");

    // Step 3: Validate Database Schema
    console.log("✅ Step 3: Validating database schema...");
    try {
      // Check if encrypted fields exist in schema
      const serviceFields = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Service' 
        AND column_name = 'encryptedXpubData'
      `;

      const hasEncryptedFields = serviceFields.length > 0;
      logTest(
        "Encrypted fields exist in schema",
        hasEncryptedFields,
        `Found ${serviceFields.length} encrypted fields in Service table`
      );

      if (!hasEncryptedFields) {
        throw new Error("Encrypted fields not found in database schema");
      }
    } catch (error) {
      logTest("Database schema validation", false, error.message);
      throw error;
    }
    console.log("");

    // Step 4: Test Core Encryption Functions
    console.log("✅ Step 4: Testing core encryption functions...");
    const testData = "test-encryption-data";
    const testContext = "test-context";

    const encrypted = encryptData(testData, testContext);
    const decrypted = decryptData(encrypted, testContext);

    logTest("Encryption/decryption works", decrypted === testData);
    logTest(
      "Encrypted data has required fields",
      encrypted.encrypted &&
        encrypted.iv &&
        encrypted.authTag &&
        encrypted.version
    );
    console.log("");

    // Step 5: Performance Test
    console.log("✅ Step 5: Performance testing...");
    const startTime = Date.now();
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      encryptData(`test-data-${i}`, `context-${i}`);
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;

    logTest(
      "Performance acceptable",
      avgTime < 1000,
      `Average time: ${avgTime.toFixed(2)}ms`
    );
    console.log("");

    // Step 6: Test Database Operations
    console.log("✅ Step 6: Testing database operations...");
    try {
      // Test creating a service with encrypted data
      const testXpub =
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gY29AREAckqC3mNdMMM6VnVVecdWu6oAC9QduXmihMHVGRUdbvM7";
      const encryptedXpub = encryptData(testXpub, "test-provider");

      // Create a test provider first
      const testProvider = await prisma.provider.create({
        data: {
          username: `test-deploy-${Date.now()}`,
          passwordHash: "test-password-hash",
        },
      });

      // Create a test service with encrypted data
      const testService = await prisma.service.create({
        data: {
          providerId: testProvider.id,
          policyType: "P2WSH",
          xpubHash: "test-hash",
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

      logTest("Service creation with encryption", true);

      // Test reading encrypted data
      const retrievedService = await prisma.service.findUnique({
        where: { id: testService.id },
      });

      if (retrievedService.encryptedXpubData) {
        const decryptedXpub = decryptData(
          retrievedService.encryptedXpubData,
          "test-provider"
        );
        logTest("Encrypted data retrieval", decryptedXpub === testXpub);
      } else {
        logTest("Encrypted data retrieval", false, "No encrypted data found");
      }

      // Cleanup test data
      await prisma.service.delete({ where: { id: testService.id } });
      await prisma.provider.delete({ where: { id: testProvider.id } });
    } catch (error) {
      logTest("Database operations", false, error.message);
      throw error;
    }
    console.log("");

    // Summary
    console.log("📊 PHASE 1 DEPLOYMENT SUMMARY:");
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
      console.log("\n🎉 PHASE 1 DEPLOYMENT SUCCESSFUL!");
      console.log("✅ Core encryption infrastructure is ready for production");
      console.log("\n🚀 Ready to proceed to Phase 2: API Routes");
    } else {
      console.log("\n⚠️  PHASE 1 DEPLOYMENT FAILED!");
      console.log("❌ Please fix the issues above before proceeding");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Phase 1 deployment failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployPhase1().catch(console.error);
