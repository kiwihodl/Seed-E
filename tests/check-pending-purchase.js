const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkPendingPurchase() {
  try {
    console.log("🔍 Checking pending purchase details...");

    // Find the pending purchase
    const pendingPurchase = await prisma.servicePurchase.findFirst({
      where: {
        isActive: false,
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                username: true,
              },
            },
          },
        },
        client: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!pendingPurchase) {
      console.log("❌ No pending purchase found");
      return;
    }

    console.log("📋 Pending purchase details:");
    console.log(`   Purchase ID: ${pendingPurchase.id}`);
    console.log(`   Client: ${pendingPurchase.client.username}`);
    console.log(
      `   Service: ${pendingPurchase.service.provider.username} - ${pendingPurchase.service.policyType}`
    );
    console.log(`   Payment Hash: ${pendingPurchase.paymentHash}`);
    console.log(`   Created: ${pendingPurchase.createdAt.toISOString()}`);
    console.log(`   Is Active: ${pendingPurchase.isActive}`);

    // Check if this is for the same client as the current user
    const currentClientId = "cmdbuoxqq00008zqtlrrl2xzj"; // Your client ID
    console.log(`\n🔍 Client check:`);
    console.log(`   Pending purchase client: ${pendingPurchase.clientId}`);
    console.log(`   Current client: ${currentClientId}`);
    console.log(
      `   Same client: ${pendingPurchase.clientId === currentClientId}`
    );
  } catch (error) {
    console.error("❌ Error checking pending purchase:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingPurchase();
