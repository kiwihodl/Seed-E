#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listAllClients() {
  try {
    console.log("🔍 Listing all clients in database...");

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`📦 Found ${clients.length} clients:`);

    clients.forEach((client, i) => {
      console.log(`\n${i + 1}. Client ID: ${client.id}`);
      console.log("   - Username:", client.username);
      console.log("   - Created At:", client.createdAt);
    });

    if (clients.length === 0) {
      console.log("❌ No clients found in database");
    }

  } catch (error) {
    console.error("❌ Error listing clients:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllClients().catch(console.error); 