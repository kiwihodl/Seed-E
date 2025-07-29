#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function cleanupOldServices() {
  console.log("🧹 Cleaning up old services with null bolt12Offer...");

  try {
    // Delete all services that have null bolt12Offer (old format)
    const result = await prisma.service.deleteMany({
      where: {
        bolt12Offer: null,
      },
    });

    console.log(
      `✅ Deleted ${result.count} old services with null bolt12Offer`
    );

    // Show remaining services
    const remainingServices = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        bolt12Offer: true,
        lightningAddress: true,
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log("\n📋 Remaining services:");
    remainingServices.forEach((service) => {
      console.log(`  - ${service.provider.username} - ${service.policyType}`);
      console.log(
        `    Lightning Address: ${service.lightningAddress || "None"}`
      );
      console.log(`    Bolt12 Offer: ${service.bolt12Offer || "None"}`);
    });

    console.log(
      `\n✅ Cleanup complete! ${remainingServices.length} services remaining.`
    );
  } catch (error) {
    console.error("❌ Error cleaning up services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldServices();
