#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function createTestClient() {
  console.log("🔧 Creating test client...");

  try {
    // Create client
    const client = await prisma.client.create({
      data: {
        username: "t2e",
        passwordHash:
          "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m", // "password"
        twoFactorSecret: "JBSWY3DPEHPK3PXP", // Test 2FA secret
      },
    });

    console.log("✅ Client created:", client.id);
    console.log("\n🎉 Test client created successfully!");
    console.log("Client ID:", client.id);
    console.log("Login with: t2e / password");
    console.log("2FA Code: 123456 (for testing)");
  } catch (error) {
    console.error("❌ Error creating client:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();
