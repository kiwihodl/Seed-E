#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function manuallyActivatePurchase() {
  try {
    console.log("🔧 Manually activating purchase...");

    const clientId = "cmdx54bch0000ml1s2vwj6hyp";
    const serviceId = "cmdx5iicf0004ml1st3pyohrl";

    // Find the purchase
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
      console.log("❌ Purchase not found");
      return;
    }

    console.log("📊 Found purchase:");
    console.log("   - ID:", purchase.id);
    console.log("   - Is Active:", purchase.isActive);
    console.log("   - Payment Hash:", purchase.paymentHash);
    console.log("   - Service:", purchase.service.policyType);
    console.log("   - Provider:", purchase.service.provider.username);

    if (purchase.isActive) {
      console.log("✅ Purchase is already active");
      return;
    }

    // Manually activate the purchase
    console.log("🔧 Activating purchase...");

    await prisma.$transaction([
      // Update the purchase to active
      prisma.servicePurchase.update({
        where: { id: purchase.id },
        data: { isActive: true },
      }),
      // Mark the service as purchased
      prisma.service.update({
        where: { id: purchase.serviceId },
        data: { isPurchased: true },
      }),
    ]);

    console.log("✅ Purchase manually activated!");

    // Verify the activation
    const updatedPurchase = await prisma.servicePurchase.findUnique({
      where: { id: purchase.id },
    });

    console.log("📊 Updated purchase status:", updatedPurchase.isActive);
  } catch (error) {
    console.error("❌ Error activating purchase:", error);
  } finally {
    await prisma.$disconnect();
  }
}

manuallyActivatePurchase().catch(console.error);
