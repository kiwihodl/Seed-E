#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function checkServices() {
  console.log("🔍 Checking services in database...");

  try {
    const services = await prisma.service.findMany({
      where: {
        provider: {
          username: "testprovider8",
        },
      },
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

    console.log("✅ Found services:");
    services.forEach((service) => {
      console.log(`  - ID: ${service.id}`);
      console.log(`    Policy: ${service.policyType}`);
      console.log(`    Provider: ${service.provider.username}`);
      console.log(
        `    Lightning Address: ${service.lightningAddress || "NOT SET"}`
      );
    });

    if (services.length === 0) {
      console.log("❌ No services found");
    }
  } catch (error) {
    console.error("❌ Error checking services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServices();
