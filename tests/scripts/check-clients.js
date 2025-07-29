#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function checkClients() {
  console.log("👥 Checking existing clients...");

  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    console.log("✅ Found clients:");
    clients.forEach((client) => {
      console.log(`  - ID: ${client.id}`);
      console.log(`    Username: ${client.username}`);
      console.log(`    Created: ${client.createdAt}`);
    });

    if (clients.length === 0) {
      console.log("❌ No clients found");
    }
  } catch (error) {
    console.error("❌ Error checking clients:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
