#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");
const crypto = require("crypto");

config();

const prisma = new PrismaClient();

async function createFreshProvider() {
  console.log("🚀 Creating fresh provider with new keys...");

  try {
    // Create a new provider
    const provider = await prisma.provider.create({
      data: {
        username: "freshprovider",
        passwordHash: "hashed_password_123",
        penaltyCount: 0,
      },
    });

    console.log("✅ Created provider:", provider.username);

    // Create services with different policy types
    const services = [
      {
        policyType: "P2WSH",
        xpubHash: "hash_" + crypto.randomBytes(8).toString("hex"),
        encryptedXpub:
          "xpub6H1LXWLaKsWFhvm6RV3ELAzCBiYVj1THUFVFpnC8d4K6EYuGg3FjjkjzkVeLmz4RzjrZNZxRUz8vYQHczLjs7uydmYWohtmLDt8dqCsQs3m",
        controlSignature: "signature_" + crypto.randomBytes(16).toString("hex"),
        initialBackupFee: 1,
        perSignatureFee: 1,
        minTimeDelay: 168,
        lightningAddress: "highlyregarded@getalby.com",
      },
      {
        policyType: "P2TR",
        xpubHash: "hash_" + crypto.randomBytes(8).toString("hex"),
        encryptedXpub:
          "xpub6H1LXWLaKsWFhvm6RV3ELAzCBiYVj1THUFVFpnC8d4K6EYuGg3FjjkjzkVeLmz4RzjrZNZxRUz8vYQHczLjs7uydmYWohtmLDt8dqCsQs3m",
        controlSignature: "signature_" + crypto.randomBytes(16).toString("hex"),
        initialBackupFee: 1,
        perSignatureFee: 1,
        minTimeDelay: 168,
        lightningAddress: "highlyregarded@getalby.com",
      },
      {
        policyType: "P2SH",
        xpubHash: "hash_" + crypto.randomBytes(8).toString("hex"),
        encryptedXpub:
          "xpub6H1LXWLaKsWFhvm6RV3ELAzCBiYVj1THUFVFpnC8d4K6EYuGg3FjjkjzkVeLmz4RzjrZNZxRUz8vYQHczLjs7uydmYWohtmLDt8dqCsQs3m",
        controlSignature: "signature_" + crypto.randomBytes(16).toString("hex"),
        initialBackupFee: 1,
        perSignatureFee: 1,
        minTimeDelay: 168,
        lightningAddress: "highlyregarded@getalby.com",
      },
    ];

    for (const serviceData of services) {
      const service = await prisma.service.create({
        data: {
          ...serviceData,
          providerId: provider.id,
        },
      });
      console.log(`✅ Created ${service.policyType} service:`, service.id);
    }

    // Create a test client
    const client = await prisma.client.create({
      data: {
        username: "testclient",
        passwordHash: "hashed_password_123",
      },
    });

    console.log("✅ Created test client:", client.username);
    console.log("✅ Fresh setup complete!");
  } catch (error) {
    console.error("❌ Error creating fresh provider:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createFreshProvider();
