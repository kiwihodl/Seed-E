#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function cleanupSignatureRequests() {
  console.log("🧹 Cleaning up signature requests...");

  try {
    // Delete all signature requests
    const deleteResult = await prisma.signatureRequest.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} signature requests`);

    console.log("✅ All signature requests have been removed!");
  } catch (error) {
    console.error("❌ Error cleaning up signature requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSignatureRequests();
