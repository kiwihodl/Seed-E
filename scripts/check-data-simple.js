#!/usr/bin/env node

/**
 * Simple data check script - JavaScript filtering
 * - Get all records and filter in JavaScript
 * - Avoid complex Prisma queries
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDataSimple() {
  console.log("🔍 Checking database data (simple approach)...\n");

  try {
    // Check Service records
    console.log("✅ Checking Service records...");
    const allServices = await prisma.service.findMany();
    const servicesWithXpub = allServices.filter(
      (s) => s.encryptedXpub !== null
    ).length;
    const servicesWithEncryptedData = allServices.filter(
      (s) => s.encryptedXpubData !== null
    ).length;

    console.log(`   Total services: ${allServices.length}`);
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
    const allRequests = await prisma.signatureRequest.findMany();
    const requestsWithPsbt = allRequests.filter(
      (r) => r.psbtData !== null
    ).length;
    const requestsWithEncryptedPsbt = allRequests.filter(
      (r) => r.encryptedPsbtData !== null
    ).length;
    const requestsWithSignedPsbt = allRequests.filter(
      (r) => r.signedPsbtData !== null
    ).length;
    const requestsWithEncryptedSignedPsbt = allRequests.filter(
      (r) => r.encryptedSignedPsbtData !== null
    ).length;

    console.log(`   Total signature requests: ${allRequests.length}`);
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
    const allPurchases = await prisma.servicePurchase.findMany();
    const purchasesWithPaymentHash = allPurchases.filter(
      (p) => p.paymentHash !== null
    ).length;
    const purchasesWithEncryptedPaymentHash = allPurchases.filter(
      (p) => p.encryptedPaymentHashData !== null
    ).length;

    console.log(`   Total purchases: ${allPurchases.length}`);
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
checkDataSimple().catch(console.error);
