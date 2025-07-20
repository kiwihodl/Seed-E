const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugXpubValue() {
  try {
    console.log("🔍 Checking actual xpub value...");

    // Get the purchased service details
    const purchasedService = await prisma.service.findFirst({
      where: {
        id: "cmdbulgfn00088z06ggldj78d", // The service you just purchased
      },
      include: {
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!purchasedService) {
      console.log("❌ Purchased service not found");
      return;
    }

    console.log("📋 Service Details:");
    console.log(`   Service ID: ${purchasedService.id}`);
    console.log(`   Provider: ${purchasedService.provider.username}`);
    console.log(`   Policy: ${purchasedService.policyType}`);
    console.log(`   Xpub Hash: ${purchasedService.xpubHash}`);
    console.log(`   Encrypted Xpub: ${purchasedService.encryptedXpub}`);
    console.log(
      `   Encrypted Xpub Length: ${purchasedService.encryptedXpub?.length || 0}`
    );

    // Also check the purchase record
    const purchase = await prisma.servicePurchase.findFirst({
      where: {
        serviceId: "cmdbulgfn00088z06ggldj78d",
      },
    });

    if (purchase) {
      console.log(`\n📋 Purchase Record:`);
      console.log(`   Purchase ID: ${purchase.id}`);
      console.log(`   Is Active: ${purchase.isActive}`);
      console.log(`   Payment Hash: ${purchase.paymentHash}`);
    }

    // Test the truncation function
    if (purchasedService.encryptedXpub) {
      const xpub = purchasedService.encryptedXpub;
      console.log(`\n🧪 Truncation Test:`);
      console.log(`   Full xpub: ${xpub}`);
      console.log(`   Length: ${xpub.length}`);
      console.log(`   First 8: ${xpub.substring(0, 8)}`);
      console.log(`   Last 4: ${xpub.substring(xpub.length - 4)}`);
      console.log(
        `   Truncated: ${xpub.substring(0, 8)}...${xpub.substring(
          xpub.length - 4
        )}`
      );
    }
  } catch (error) {
    console.error("❌ Error checking xpub value:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugXpubValue();
