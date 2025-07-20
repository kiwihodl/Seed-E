#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function cleanupPurchases() {
  console.log("🧹 Cleaning up all purchases...");

  try {
    // Get all purchases first
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

    console.log("📊 Current purchases:");
    purchases.forEach((purchase) => {
      console.log(`  - ID: ${purchase.id}`);
      console.log(`    Payment Hash: ${purchase.paymentHash}`);
      console.log(`    Service: ${purchase.service.policyType}`);
      console.log(
        `    Lightning Address: ${purchase.service.lightningAddress}`
      );
      console.log(`    Active: ${purchase.isActive}`);
      console.log("");
    });

    // Delete all purchases
    const deleteResult = await prisma.servicePurchase.deleteMany({});

    console.log(`🗑️  Deleted ${deleteResult.count} purchases`);
    console.log("✅ Database cleaned up!");
  } catch (error) {
    console.error("❌ Error cleaning up purchases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPurchases();
