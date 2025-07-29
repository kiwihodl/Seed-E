const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function confirmCurrentPayment() {
  try {
    console.log("🔧 Manually confirming current payment...");

    // Find the most recent pending purchase
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!pendingPurchase) {
      console.log("❌ No pending purchase found");
      return;
    }

    console.log("📋 Found pending purchase:");
    console.log(`   Purchase ID: ${pendingPurchase.id}`);
    console.log(`   Payment Hash: ${pendingPurchase.paymentHash}`);
    console.log(
      `   Service: ${pendingPurchase.service.provider.username} - ${pendingPurchase.service.policyType}`
    );
    console.log(`   Created: ${pendingPurchase.createdAt.toISOString()}`);

    // Manually confirm the payment
    const result = await prisma.$transaction(async (tx) => {
      // Update the purchase to active
      const updatedPurchase = await tx.servicePurchase.update({
        where: { id: pendingPurchase.id },
        data: {
          isActive: true,
        },
      });

      // Mark the service as purchased
      await tx.service.update({
        where: { id: pendingPurchase.serviceId },
        data: {
          isPurchased: true,
        },
      });

      return updatedPurchase;
    });

    console.log("✅ Payment manually confirmed!");
    console.log(`   Updated purchase ID: ${result.id}`);
    console.log(`   Service ID: ${pendingPurchase.serviceId}`);

    // Verify the changes
    const updatedPurchase = await prisma.servicePurchase.findUnique({
      where: { id: pendingPurchase.id },
    });

    const updatedService = await prisma.service.findUnique({
      where: { id: pendingPurchase.serviceId },
    });

    console.log("\n📊 Verification:");
    console.log(`   Purchase isActive: ${updatedPurchase.isActive}`);
    console.log(`   Service isPurchased: ${updatedService.isPurchased}`);
  } catch (error) {
    console.error("❌ Error manually confirming payment:", error);
  } finally {
    await prisma.$disconnect();
  }
}

confirmCurrentPayment();
