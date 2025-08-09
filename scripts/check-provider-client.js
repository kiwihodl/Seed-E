#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkProviderClient() {
  try {
    console.log("🔍 Checking Provider_client account...");

    // Find the client by username
    const client = await prisma.client.findUnique({
      where: { username: "Provider_client" },
    });

    if (!client) {
      console.log("❌ Provider_client not found in database");
      return;
    }

    console.log("✅ Provider_client found:");
    console.log("   - ID:", client.id);
    console.log("   - Username:", client.username);
    console.log("   - Created At:", client.createdAt);

    // Check all purchases for this client
    const purchases = await prisma.servicePurchase.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    console.log(`\n📦 Found ${purchases.length} purchases for Provider_client:`);

    purchases.forEach((purchase, i) => {
      console.log(`\n${i + 1}. Purchase ID: ${purchase.id}`);
      console.log("   - Service ID:", purchase.serviceId);
      console.log("   - Service Type:", purchase.service.policyType);
      console.log("   - Provider:", purchase.service.provider.username);
      console.log("   - Is Active:", purchase.isActive);
      console.log("   - Payment Hash:", purchase.paymentHash ? "Yes" : "No");
      console.log("   - Expires At:", purchase.expiresAt);
      console.log("   - Created At:", purchase.createdAt);
    });

    // Check if any are active
    const activePurchases = purchases.filter(p => p.isActive);
    console.log(`\n✅ Active purchases: ${activePurchases.length}`);

    if (activePurchases.length === 0 && purchases.length > 0) {
      console.log("\n⚠️  ISSUE FOUND: Purchases exist but none are active!");
      console.log("   This means payment confirmation failed.");
    }

  } catch (error) {
    console.error("❌ Error checking Provider_client:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProviderClient().catch(console.error); 