#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function checkTestRecoveryKeys() {
  try {
    console.log("🔍 Checking recovery keys for test users...");

    // Check provider
    const provider = await prisma.provider.findUnique({
      where: { username: "autotest_provider" },
      select: {
        id: true,
        username: true,
        recoveryKey: true,
        twoFactorSecret: true,
        createdAt: true,
      },
    });

    if (provider) {
      console.log("✅ Found provider:");
      console.log(`  - ID: ${provider.id}`);
      console.log(`  - Username: ${provider.username}`);
      console.log(`  - Recovery Key: ${provider.recoveryKey || "NOT SET"}`);
      console.log(
        `  - 2FA Secret: ${provider.twoFactorSecret ? "SET" : "NOT SET"}`
      );
      console.log(`  - Created: ${provider.createdAt}`);
    } else {
      console.log('❌ Provider "autotest_provider" not found');
    }

    console.log("");

    // Check client
    const client = await prisma.client.findUnique({
      where: { username: "autotest_client" },
      select: {
        id: true,
        username: true,
        recoveryKey: true,
        twoFactorSecret: true,
        createdAt: true,
      },
    });

    if (client) {
      console.log("✅ Found client:");
      console.log(`  - ID: ${client.id}`);
      console.log(`  - Username: ${client.username}`);
      console.log(`  - Recovery Key: ${client.recoveryKey || "NOT SET"}`);
      console.log(
        `  - 2FA Secret: ${client.twoFactorSecret ? "SET" : "NOT SET"}`
      );
      console.log(`  - Created: ${client.createdAt}`);
    } else {
      console.log('❌ Client "autotest_client" not found');
    }
  } catch (error) {
    console.error("❌ Error checking recovery keys:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestRecoveryKeys();
