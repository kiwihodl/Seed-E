const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("🔍 Checking users in database...\n");

    // Check clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    console.log("📋 Clients:");
    clients.forEach((client) => {
      console.log(`   - ${client.username} (ID: ${client.id})`);
    });

    // Check providers
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    console.log("\n🏢 Providers:");
    providers.forEach((provider) => {
      console.log(`   - ${provider.username} (ID: ${provider.id})`);
    });

    // Check services
    const services = await prisma.service.findMany({
      include: {
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log("\n🔧 Services:");
    services.forEach((service) => {
      console.log(
        `   - Service ${service.id} by ${service.provider.username} (Purchased: ${service.isPurchased})`
      );
    });

    // Check purchases
    const purchases = await prisma.servicePurchase.findMany({
      include: {
        client: {
          select: {
            username: true,
          },
        },
        service: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log("\n🛒 Purchases:");
    purchases.forEach((purchase) => {
      console.log(
        `   - Purchase ${purchase.id} by ${purchase.client.username} for service ${purchase.service.id} (Active: ${purchase.isActive})`
      );
    });
  } catch (error) {
    console.error("❌ Error checking users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
