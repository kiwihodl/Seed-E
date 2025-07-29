#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function cleanupEverything() {
  console.log("🧹 Cleaning up everything...");

  try {
    // Delete all purchases first (due to foreign key constraints)
    const deletePurchases = await prisma.servicePurchase.deleteMany({});
    console.log(`🗑️  Deleted ${deletePurchases.count} purchases`);

    // Delete all signature requests
    const deleteRequests = await prisma.signatureRequest.deleteMany({});
    console.log(`🗑️  Deleted ${deleteRequests.count} signature requests`);

    // Delete all subscription requests
    const deleteSubscriptions = await prisma.subscriptionRequest.deleteMany({});
    console.log(
      `🗑️  Deleted ${deleteSubscriptions.count} subscription requests`
    );

    // Delete all services
    const deleteServices = await prisma.service.deleteMany({});
    console.log(`🗑️  Deleted ${deleteServices.count} services`);

    // Delete all providers
    const deleteProviders = await prisma.provider.deleteMany({});
    console.log(`🗑️  Deleted ${deleteProviders.count} providers`);

    // Delete all clients
    const deleteClients = await prisma.client.deleteMany({});
    console.log(`🗑️  Deleted ${deleteClients.count} clients`);

    console.log("✅ Database completely cleaned up!");
  } catch (error) {
    console.error("❌ Error cleaning up:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupEverything();
