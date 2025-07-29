#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function debugPurchase() {
  console.log("🔍 Debugging purchase and payment hash issue...");

  try {
    // Check all purchases
    const purchases = await prisma.servicePurchase.findMany({
      include: {
        service: {
          select: {
            policyType: true,
            lightningAddress: true,
          },
        },
      },
    });

    console.log("📊 All purchases:");
    purchases.forEach((purchase) => {
      console.log(`  - ID: ${purchase.id}`);
      console.log(`    Payment Hash: ${purchase.paymentHash}`);
      console.log(`    Service: ${purchase.service.policyType}`);
      console.log(
        `    Lightning Address: ${purchase.service.lightningAddress}`
      );
      console.log(`    Active: ${purchase.isActive}`);
      console.log(`    Verify URL: ${purchase.verifyUrl || "null"}`);
      console.log(`    Created: ${purchase.createdAt}`);
      console.log("");
    });

    // Check the specific hash that's failing
    const targetHash =
      "dc00ac6f691f5da9774e99f8ce501e1ed754f67885ca9e2fc1223c3b9cfaba29";
    const specificPurchase = await prisma.servicePurchase.findFirst({
      where: {
        paymentHash: targetHash,
      },
    });

    if (specificPurchase) {
      console.log(`✅ Found purchase for hash: ${targetHash}`);
      console.log(`   Purchase ID: ${specificPurchase.id}`);
      console.log(`   Active: ${specificPurchase.isActive}`);
    } else {
      console.log(`❌ No purchase found for hash: ${targetHash}`);
    }
  } catch (error) {
    console.error("❌ Error debugging purchase:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPurchase();
