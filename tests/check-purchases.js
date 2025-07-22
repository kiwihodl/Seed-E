const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkPurchases() {
  try {
    const purchases = await prisma.servicePurchase.findMany({
      include: {
        service: {
          include: {
            provider: true,
          },
        },
        client: true,
      },
    });

    console.log("Purchased Services:");
    console.log("==================");

    if (purchases.length === 0) {
      console.log("No purchased services found.");
      return;
    }

    purchases.forEach((purchase, index) => {
      console.log(
        `${index + 1}. ${purchase.service.provider.username} (${
          purchase.service.policyType
        })`
      );
      console.log(`   Xpub Hash: ${purchase.service.xpubHash}`);
      console.log(
        `   Encrypted Xpub: ${purchase.service.encryptedXpub ? "Yes" : "No"}`
      );
      console.log(`   Client: ${purchase.client.username}`);
      console.log(`   Is Active: ${purchase.isActive}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPurchases();
