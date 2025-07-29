#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function deleteOldServices() {
  console.log("🗑️  Deleting old services...");

  try {
    // Delete all services
    const deleteResult = await prisma.service.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} old services`);

    console.log("✅ All old services have been removed!");
  } catch (error) {
    console.error("❌ Error deleting old services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldServices();
