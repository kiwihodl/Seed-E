#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function cleanupServices() {
  console.log(
    "🧹 Cleaning up services to only keep those with your Lightning address..."
  );

  try {
    const targetLightningAddress = "highlyregarded@getalby.com";

    // First, let's see what services exist
    const allServices = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        lightningAddress: true,
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log("📊 Current services:");
    allServices.forEach((service) => {
      console.log(`  - ID: ${service.id}`);
      console.log(`    Policy: ${service.policyType}`);
      console.log(`    Provider: ${service.provider.username}`);
      console.log(
        `    Lightning Address: ${service.lightningAddress || "NOT SET"}`
      );
    });

    // Find services that don't have the target Lightning address
    const servicesToDelete = allServices.filter(
      (service) => service.lightningAddress !== targetLightningAddress
    );

    console.log(`\n🗑️  Found ${servicesToDelete.length} services to delete:`);
    servicesToDelete.forEach((service) => {
      console.log(
        `  - ${service.provider.username} - ${service.policyType} (${
          service.lightningAddress || "NO ADDRESS"
        })`
      );
    });

    if (servicesToDelete.length === 0) {
      console.log("✅ All services already have your Lightning address!");
      return;
    }

    // Delete purchases for services that don't have the target Lightning address
    const servicesToDeleteIds = servicesToDelete.map((service) => service.id);

    console.log(`\n🗑️  Deleting purchases for services to be removed...`);
    const deletePurchasesResult = await prisma.servicePurchase.deleteMany({
      where: {
        serviceId: {
          in: servicesToDeleteIds,
        },
      },
    });
    console.log(`✅ Deleted ${deletePurchasesResult.count} purchases`);

    // Delete the services that don't have the target Lightning address
    const deleteResult = await prisma.service.deleteMany({
      where: {
        lightningAddress: {
          not: targetLightningAddress,
        },
      },
    });

    console.log(`\n✅ Deleted ${deleteResult.count} services`);

    // Show remaining services
    const remainingServices = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        lightningAddress: true,
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log("\n📋 Remaining services with your Lightning address:");
    remainingServices.forEach((service) => {
      console.log(`  - ID: ${service.id}`);
      console.log(`    Policy: ${service.policyType}`);
      console.log(`    Provider: ${service.provider.username}`);
      console.log(`    Lightning Address: ${service.lightningAddress}`);
    });
  } catch (error) {
    console.error("❌ Error cleaning up services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupServices();
