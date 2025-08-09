#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkPurchaseStatus() {
  try {
    console.log("🔍 Checking purchase status...");

    const clientId = "cmdoxqbrs0000pi1ms2pief1n";
    const serviceId = "cmdx5iicf0004ml1st3pyohrl";

    // Check if purchase exists
    const purchase = await prisma.servicePurchase.findFirst({
      where: {
        clientId: clientId,
        serviceId: serviceId,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!purchase) {
      console.log("❌ No purchase found for this client and service");
      return;
    }

    console.log("📊 Purchase found:");
    console.log("   - ID:", purchase.id);
    console.log("   - Client ID:", purchase.clientId);
    console.log("   - Service ID:", purchase.serviceId);
    console.log("   - Is Active:", purchase.isActive);
    console.log("   - Payment Hash:", purchase.paymentHash ? "Yes" : "No");
    console.log("   - Expires At:", purchase.expiresAt);
    console.log("   - Created At:", purchase.createdAt);
    console.log("   - Service Policy Type:", purchase.service.policyType);
    console.log("   - Provider:", purchase.service.provider.username);

    // Check if there are any other purchases for this client
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

    console.log("\n📦 All purchases for this client:");
    allPurchases.forEach((p, i) => {
      console.log(`   ${i + 1}. Service: ${p.service.policyType} (${p.service.provider.username}) - Active: ${p.isActive}`);
    });

  } catch (error) {
    console.error("❌ Error checking purchase status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPurchaseStatus().catch(console.error); 