#!/usr/bin/env node

/**
 * Simple data check script
 * - Check what records exist in the database
 * - See what needs to be migrated
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkData() {
  console.log("🔍 Checking database data...\n");

  try {
    // Check Service records
    console.log("✅ Checking Service records...");
    const totalServices = await prisma.service.count();
    const servicesWithXpub = await prisma.service.count({
      where: { encryptedXpub: { not: null } },
    });
    const servicesWithEncryptedData = await prisma.service.count({
      where: { encryptedXpubData: { not: null } },
    });

    console.log(`   Total services: ${totalServices}`);
    console.log(`   Services with XPUB: ${servicesWithXpub}`);
    console.log(
      `   Services with encrypted data: ${servicesWithEncryptedData}`
    );
    console.log(
      `   Services to migrate: ${servicesWithXpub - servicesWithEncryptedData}`
    );
    console.log("");

    // Check SignatureRequest records
    console.log("✅ Checking SignatureRequest records...");
    const totalRequests = await prisma.signatureRequest.count();
    const requestsWithPsbt = await prisma.signatureRequest.count({
      where: { psbtData: { not: null } },
    });
    const requestsWithEncryptedPsbt = await prisma.signatureRequest.count({
      where: { encryptedPsbtData: { not: null } },
    });
    const requestsWithSignedPsbt = await prisma.signatureRequest.count({
      where: { signedPsbtData: { not: null } },
    });
    const requestsWithEncryptedSignedPsbt = await prisma.signatureRequest.count(
      {
        where: { encryptedSignedPsbtData: { not: null } },
      }
    );

    console.log(`   Total signature requests: ${totalRequests}`);
    console.log(`   Requests with PSBT: ${requestsWithPsbt}`);
    console.log(
      `   Requests with encrypted PSBT: ${requestsWithEncryptedPsbt}`
    );
    console.log(`   Requests with signed PSBT: ${requestsWithSignedPsbt}`);
    console.log(
      `   Requests with encrypted signed PSBT: ${requestsWithEncryptedSignedPsbt}`
    );
    console.log(
      `   PSBTs to migrate: ${requestsWithPsbt - requestsWithEncryptedPsbt}`
    );
    console.log(
      `   Signed PSBTs to migrate: ${
        requestsWithSignedPsbt - requestsWithEncryptedSignedPsbt
      }`
    );
    console.log("");

    // Check ServicePurchase records
    console.log("✅ Checking ServicePurchase records...");
    const totalPurchases = await prisma.servicePurchase.count();
    const purchasesWithPaymentHash = await prisma.servicePurchase.count({
      where: { paymentHash: { not: null } },
    });
    const purchasesWithEncryptedPaymentHash =
      await prisma.servicePurchase.count({
        where: { encryptedPaymentHashData: { not: null } },
      });

    console.log(`   Total purchases: ${totalPurchases}`);
    console.log(`   Purchases with payment hash: ${purchasesWithPaymentHash}`);
    console.log(
      `   Purchases with encrypted payment hash: ${purchasesWithEncryptedPaymentHash}`
    );
    console.log(
      `   Payment hashes to migrate: ${
        purchasesWithPaymentHash - purchasesWithEncryptedPaymentHash
      }`
    );
    console.log("");

    // Summary
    const totalToMigrate =
      servicesWithXpub -
      servicesWithEncryptedData +
      (requestsWithPsbt - requestsWithEncryptedPsbt) +
      (requestsWithSignedPsbt - requestsWithEncryptedSignedPsbt) +
      (purchasesWithPaymentHash - purchasesWithEncryptedPaymentHash);

    console.log("📊 MIGRATION SUMMARY:");
    console.log(`   Total records to migrate: ${totalToMigrate}`);
    console.log(`   Services: ${servicesWithXpub - servicesWithEncryptedData}`);
    console.log(`   PSBTs: ${requestsWithPsbt - requestsWithEncryptedPsbt}`);
    console.log(
      `   Signed PSBTs: ${
        requestsWithSignedPsbt - requestsWithEncryptedSignedPsbt
      }`
    );
    console.log(
      `   Payment hashes: ${
        purchasesWithPaymentHash - purchasesWithEncryptedPaymentHash
      }`
    );

    if (totalToMigrate === 0) {
      console.log("\n🎉 All data is already encrypted!");
    } else {
      console.log("\n🚀 Ready for migration!");
    }
  } catch (error) {
    console.error("❌ Check failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkData().catch(console.error);
