#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function updateServicesToLightning() {
  console.log("⚡ Updating services to use Lightning addresses...");

  try {
    // Update all services to use Lightning addresses instead of Bolt12 offers
    const result = await prisma.service.updateMany({
      where: {
        lightningAddress: null, // Only update services without Lightning addresses
      },
      data: {
        lightningAddress: "bitcoinbutler@amber.app", // Set Lightning address
        bolt12Offer: null, // Clear Bolt12 offer
      },
    });

    console.log(
      `✅ Updated ${result.count} services to use Lightning addresses`
    );

    // Show updated services
    const updatedServices = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        lightningAddress: true,
        bolt12Offer: true,
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log("\n📋 Updated services:");
    updatedServices.forEach((service) => {
      console.log(`  - ${service.provider.username} - ${service.policyType}`);
      console.log(
        `    Lightning Address: ${service.lightningAddress || "None"}`
      );
      console.log(`    Bolt12 Offer: ${service.bolt12Offer || "None"}`);
    });

    console.log(
      `\n✅ Update complete! ${updatedServices.length} services updated.`
    );
  } catch (error) {
    console.error("❌ Error updating services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateServicesToLightning();
