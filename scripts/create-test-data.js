#!/usr/bin/env node

/**
 * Create Test Data with Phase 1.5 Encryption
 *
 * Generates realistic test data to verify encryption works:
 * - Test providers with encrypted XPUBs
 * - Test signature requests with encrypted PSBTs
 * - Test purchases with encrypted payment hashes
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

async function createTestData() {
  console.log("🔐 Creating test data with Phase 1.5 encryption...\n");

  try {
    // Step 1: Create test providers
    console.log("✅ Step 1: Creating test providers...");

    const provider1 = await prisma.provider.create({
      data: {
        username: "test-provider-1",
        passwordHash: "$2b$10$test.hash.for.provider.1",
        twoFactorSecret: "test-2fa-secret-1",
        recoveryKey: "test-recovery-key-1",
        penaltyCount: 0,
      },
    });

    const provider2 = await prisma.provider.create({
      data: {
        username: "test-provider-2",
        passwordHash: "$2b$10$test.hash.for.provider.2",
        twoFactorSecret: "test-2fa-secret-2",
        recoveryKey: "test-recovery-key-2",
        penaltyCount: 0,
      },
    });

    console.log(
      `   Created providers: ${provider1.username}, ${provider2.username}`
    );

    // Step 2: Create test clients
    console.log("\n✅ Step 2: Creating test clients...");

    const client1 = await prisma.client.create({
      data: {
        username: "test-client-1",
        passwordHash: "$2b$10$test.hash.for.client.1",
        twoFactorSecret: "test-2fa-secret-client-1",
        recoveryKey: "test-recovery-key-client-1",
      },
    });

    const client2 = await prisma.client.create({
      data: {
        username: "test-client-2",
        passwordHash: "$2b$10$test.hash.for.client.2",
        twoFactorSecret: "test-2fa-secret-client-2",
        recoveryKey: "test-recovery-key-client-2",
      },
    });

    console.log(`   Created clients: ${client1.username}, ${client2.username}`);

    // Step 3: Create test services with encrypted XPUBs
    console.log("\n✅ Step 3: Creating test services with encrypted XPUBs...");

    const testXpub1 =
      "xpub6CWiMKiARsJP9vj5c6c9k4Cmm26s9NxrxVx8vDb6v9wC1gCAqpWpiHwrh5wyqTtRVeXQdfEhH3gQ8qyCFGcaqVqgvscGcKMSPxHMcREBXq";
    const testXpub2 =
      "xpub6CWiMKiARsJP9vj5c6c9k4Cmm26s9NxrxVx8vDb6v9wC1gCAqpWpiHwrh5wyqTtRVeXQdfEhH3gQ8qyCFGcaqVqgvscGcKMSPxHMcREBXr";

    const encryptedXpubData1 = encryptData(testXpub1, `xpub:${provider1.id}`);
    const encryptedXpubData2 = encryptData(testXpub2, `xpub:${provider2.id}`);

    const service1 = await prisma.service.create({
      data: {
        providerId: provider1.id,
        policyType: "P2WSH",
        xpubHash: crypto.createHash("sha256").update(testXpub1).digest("hex"),
        encryptedXpub: testXpub1, // Keep plain text for backward compatibility
        encryptedXpubData: encryptedXpubData1, // Store encrypted data
        masterFingerprint: "97046043",
        derivationPath: "m/48'/0'/0'/2'",
        initialBackupFee: BigInt(10000), // 10,000 sats
        perSignatureFee: BigInt(5000), // 5,000 sats
        monthlyFee: BigInt(50000), // 50,000 sats
        minTimeDelay: 168, // 7 days
        lightningAddress: "test-provider-1@voltage.com",
        isActive: true,
        isPurchased: false,
      },
    });

    const service2 = await prisma.service.create({
      data: {
        providerId: provider2.id,
        policyType: "P2TR",
        xpubHash: crypto.createHash("sha256").update(testXpub2).digest("hex"),
        encryptedXpub: testXpub2, // Keep plain text for backward compatibility
        encryptedXpubData: encryptedXpubData2, // Store encrypted data
        masterFingerprint: "12345678",
        derivationPath: "m/86'/0'/0'/0'",
        initialBackupFee: BigInt(15000), // 15,000 sats
        perSignatureFee: BigInt(7500), // 7,500 sats
        monthlyFee: null, // No monthly fee
        minTimeDelay: 336, // 14 days
        lightningAddress: "test-provider-2@alby.com",
        isActive: true,
        isPurchased: false,
      },
    });

    console.log(
      `   Created services: ${service1.id} (P2WSH), ${service2.id} (P2TR)`
    );

    // Step 4: Create test purchases with encrypted payment hashes
    console.log(
      "\n✅ Step 4: Creating test purchases with encrypted payment hashes..."
    );

    const paymentHash1 =
      "test-payment-hash-1-" + crypto.randomBytes(16).toString("hex");
    const paymentHash2 =
      "test-payment-hash-2-" + crypto.randomBytes(16).toString("hex");

    const purchase1 = await prisma.servicePurchase.create({
      data: {
        serviceId: service1.id,
        clientId: client1.id,
        paymentHash: paymentHash1, // Keep plain text for backward compatibility
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        verifyUrl: "https://test-lnurl-verify-1.com",
      },
    });

    const purchase2 = await prisma.servicePurchase.create({
      data: {
        serviceId: service2.id,
        clientId: client2.id,
        paymentHash: paymentHash2, // Keep plain text for backward compatibility
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        verifyUrl: "https://test-lnurl-verify-2.com",
      },
    });

    // Encrypt payment hashes after creation
    const encryptedPaymentHashData1 = encryptData(
      paymentHash1,
      `payment:${purchase1.id}`
    );
    const encryptedPaymentHashData2 = encryptData(
      paymentHash2,
      `payment:${purchase2.id}`
    );

    await prisma.servicePurchase.update({
      where: { id: purchase1.id },
      data: { encryptedPaymentHashData: encryptedPaymentHashData1 },
    });

    await prisma.servicePurchase.update({
      where: { id: purchase2.id },
      data: { encryptedPaymentHashData: encryptedPaymentHashData2 },
    });

    console.log(`   Created purchases: ${purchase1.id}, ${purchase2.id}`);

    // Step 5: Create test signature requests with encrypted PSBTs
    console.log(
      "\n✅ Step 5: Creating test signature requests with encrypted PSBTs..."
    );

    const testPsbt1 =
      "cHNidP8BAF4CAAAAAYi6bNJSVKzuNxDz91Zr5UlGs/Y7t2aq5KK6UQoBbqIBAQAAAAD/////AQAAAAAAAAAABUUKHQUAAAAAFgAUFNI/COHT2DTdT7remwPGo/efs1IAAAAAAQEgAOH1BQABAAAAAR0QJxYwvfy2R8GJufJ4upL96nKKHmmqF1M5Zl5K9Im0AAAAAAD/////AgAAAAAAAAAAABYAFATA4CQpAHX6JZUtqux4i28kySb6FgAAAAABFkACIRAgCwIHAQABAAABF0ECKZ2ziIA2y6R2eG0NUqGmOixqq9cGM00xDDqh3UJpcmOqmsu8V2qZMcSFP49n4W1kV2ejGfEaP4/9Ca5eEa/OBP//////////AgAAAAAAAAAAABYAFATA4CQpAHX6JZUtqux4i28kySb6FgAAAAABFkACIRAgCwIHAQABAAABF0ECKZ2ziIA2y6R2eG0NUqGmOixqq9cGM00xDDqh3UJpcmOqmsu8V2qZMcSFP49n4W1kV2ejGfEaP4/9Ca5eEa/OBP//////////";
    const testPsbt2 =
      "cHNidP8BAF4CAAAAAYi6bNJSVKzuNxDz91Zr5UlGs/Y7t2aq5KK6UQoBbqIBAQAAAAD/////AQAAAAAAAAAABUUKHQUAAAAAFgAUFNI/COHT2DTdT7remwPGo/efs1IAAAAAAQEgAOH1BQABAAAAAR0QJxYwvfy2R8GJufJ4upL96nKKHmmqF1M5Zl5K9Im0AAAAAAD/////AgAAAAAAAAAAABYAFATA4CQpAHX6JZUtqux4i28kySb6FgAAAAABFkACIRAgCwIHAQABAAABF0ECKZ2ziIA2y6R2eG0NUqGmOixqq9cGM00xDDqh3UJpcmOqmsu8V2qZMcSFP49n4W1kV2ejGfEaP4/9Ca5eEa/OBP//////////AgAAAAAAAAAAABYAFATA4CQpAHX6JZUtqux4i28kySb6FgAAAAABFkACIRAgCwIHAQABAAABF0ECKZ2ziIA2y6R2eG0NUqGmOixqq9cGM00xDDqh3UJpcmOqmsu8V2qZMcSFP49n4W1kV2ejGfEaP4/9Ca5eEa/OBP//////////";

    const signatureRequest1 = await prisma.signatureRequest.create({
      data: {
        clientId: client1.id,
        serviceId: service1.id,
        psbtData: testPsbt1, // Keep plain text for backward compatibility
        psbtHash: crypto.createHash("sha256").update(testPsbt1).digest("hex"),
        paymentHash:
          "test-payment-hash-sig-1-" + crypto.randomBytes(16).toString("hex"),
        paymentConfirmed: true,
        signatureFee: BigInt(5000), // 5,000 sats
        unlocksAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "PENDING",
      },
    });

    const signatureRequest2 = await prisma.signatureRequest.create({
      data: {
        clientId: client2.id,
        serviceId: service2.id,
        psbtData: testPsbt2, // Keep plain text for backward compatibility
        psbtHash: crypto.createHash("sha256").update(testPsbt2).digest("hex"),
        paymentHash:
          "test-payment-hash-sig-2-" + crypto.randomBytes(16).toString("hex"),
        paymentConfirmed: true,
        signatureFee: BigInt(7500), // 7,500 sats
        unlocksAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        status: "PENDING",
      },
    });

    // Encrypt PSBTs after creation
    const encryptedPsbtData1 = encryptData(
      testPsbt1,
      `psbt:${signatureRequest1.id}`
    );
    const encryptedPsbtData2 = encryptData(
      testPsbt2,
      `psbt:${signatureRequest2.id}`
    );

    await prisma.signatureRequest.update({
      where: { id: signatureRequest1.id },
      data: { encryptedPsbtData: encryptedPsbtData1 },
    });

    await prisma.signatureRequest.update({
      where: { id: signatureRequest2.id },
      data: { encryptedPsbtData: encryptedPsbtData2 },
    });

    console.log(
      `   Created signature requests: ${signatureRequest1.id}, ${signatureRequest2.id}`
    );

    // Step 6: Create signed PSBTs with encryption
    console.log("\n✅ Step 6: Creating signed PSBTs with encryption...");

    const signedPsbt1 = testPsbt1 + "-signed-by-provider-1";
    const signedPsbt2 = testPsbt2 + "-signed-by-provider-2";

    const encryptedSignedPsbtData1 = encryptData(
      signedPsbt1,
      `psbt:${signatureRequest1.id}`
    );
    const encryptedSignedPsbtData2 = encryptData(
      signedPsbt2,
      `psbt:${signatureRequest2.id}`
    );

    await prisma.signatureRequest.update({
      where: { id: signatureRequest1.id },
      data: {
        signedPsbtData: signedPsbt1, // Keep plain text for backward compatibility
        encryptedSignedPsbtData: encryptedSignedPsbtData1, // Store encrypted data
        signedAt: new Date(),
        status: "SIGNED",
      },
    });

    await prisma.signatureRequest.update({
      where: { id: signatureRequest2.id },
      data: {
        signedPsbtData: signedPsbt2, // Keep plain text for backward compatibility
        encryptedSignedPsbtData: encryptedSignedPsbtData2, // Store encrypted data
        signedAt: new Date(),
        status: "SIGNED",
      },
    });

    console.log(
      `   Created signed PSBTs for requests: ${signatureRequest1.id}, ${signatureRequest2.id}`
    );

    // Step 7: Summary
    console.log("\n📊 TEST DATA CREATION SUMMARY:");
    console.log(`   Providers created: 2`);
    console.log(`   Clients created: 2`);
    console.log(`   Services created: 2 (with encrypted XPUBs)`);
    console.log(`   Purchases created: 2 (with encrypted payment hashes)`);
    console.log(`   Signature requests created: 2 (with encrypted PSBTs)`);
    console.log(`   Signed PSBTs created: 2 (with encrypted signed PSBTs)`);
    console.log(
      "\n🎉 Test data created successfully with Phase 1.5 encryption!"
    );
    console.log("\n💡 Next: Run tests to verify encryption works correctly");
  } catch (error) {
    console.error("❌ Test data creation failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test data creation
createTestData().catch(console.error);
