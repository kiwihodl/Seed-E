#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAllPurchases() {
  try {
    console.log("🔍 Checking all purchases...");

    const clientId = "cmdoxqbrs0000pi1ms2pief1n";

    // Check all purchases for this client
    const allPurchases = await prisma.servicePurchase.findMany({
      where: {
        clientId: clientId,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    console.log(`📦 Found ${allPurchases.length} purchases for client ${clientId}:`);
    
    if (allPurchases.length === 0) {
      console.log("❌ No purchases found for this client");
      
      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (client) {
        console.log("✅ Client exists:", client.username);
      } else {
        console.log("❌ Client not found");
      }
      return;
    }

    allPurchases.forEach((purchase, i) => {
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
    const activePurchases = allPurchases.filter(p => p.isActive);
    console.log(`\n✅ Active purchases: ${activePurchases.length}`);

  } catch (error) {
    console.error("❌ Error checking purchases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPurchases().catch(console.error); 