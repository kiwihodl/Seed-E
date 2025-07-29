#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkEncryption() {
  try {
    console.log("🔍 Checking database encryption...");

    // Get the latest service
    const service = await prisma.service.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!service) {
      console.log("❌ No services found in database");
      return;
    }

    console.log("📊 Latest service record:");
    console.log("   - ID:", service.id);
    console.log("   - Policy Type:", service.policyType);
    console.log("   - XPUB Hash:", service.xpubHash);
    console.log("   - Encrypted XPUB:", service.encryptedXpub ? "Yes" : "No");
    console.log(
      "   - Encrypted XPUB Data:",
      service.encryptedXpubData ? "Yes" : "No"
    );
    console.log("   - Master Fingerprint:", service.masterFingerprint);
    console.log("   - Derivation Path:", service.derivationPath);
    console.log("   - Created At:", service.createdAt);

    if (service.encryptedXpubData) {
      console.log("🔐 Encrypted XPUB Data Structure:");
      console.log("   - Type:", typeof service.encryptedXpubData);
      console.log(
        "   - Has encrypted field:",
        !!service.encryptedXpubData.encrypted
      );
      console.log("   - Has IV:", !!service.encryptedXpubData.iv);
      console.log("   - Has auth tag:", !!service.encryptedXpubData.authTag);
      console.log("   - Version:", service.encryptedXpubData.version);
    }

    console.log("✅ Encryption check completed!");
  } catch (error) {
    console.error("❌ Error checking encryption:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEncryption().catch(console.error);
