const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupPendingPurchases() {
  try {
    console.log("🧹 Cleaning up pending purchases...");

    // Find all pending purchases
    const pendingPurchases = await prisma.servicePurchase.findMany({
      where: {
        isActive: false, // Only pending purchases
      },
    });

    if (pendingPurchases.length === 0) {
      console.log("✅ No pending purchases to clean up");
      return;
    }

    console.log(
      `📋 Found ${pendingPurchases.length} pending purchase(s) to delete:`
    );

    pendingPurchases.forEach((purchase, index) => {
      console.log(`${index + 1}. Purchase ID: ${purchase.id}`);
      console.log(`   Payment Hash: ${purchase.paymentHash}`);
      console.log(`   Created: ${purchase.createdAt.toISOString()}`);
    });

    // Delete all pending purchases
    const result = await prisma.servicePurchase.deleteMany({
      where: {
        isActive: false,
      },
    });

    console.log(`✅ Deleted ${result.count} pending purchase(s)`);
  } catch (error) {
    console.error("❌ Error cleaning up purchases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPendingPurchases();
