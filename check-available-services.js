const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAvailableServices() {
  try {
    console.log("🔍 Checking available services...");

    // Get all services that are not purchased
    const services = await prisma.service.findMany({
      where: {
        isPurchased: false,
      },
      include: {
        provider: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📋 Found ${services.length} available service(s):`);
    console.log("");

    services.forEach((service, index) => {
      console.log(`${index + 1}. Service ID: ${service.id}`);
      console.log(`   Provider: ${service.provider.username}`);
      console.log(`   Policy Type: ${service.policyType}`);
      console.log(`   Initial Fee: ${service.initialBackupFee} sats`);
      console.log(`   Per Signature: ${service.perSignatureFee} sats`);
      console.log(`   Created: ${service.createdAt.toISOString()}`);
      console.log("");
    });

    // Also check purchased services
    const purchasedServices = await prisma.service.findMany({
      where: {
        isPurchased: true,
      },
      include: {
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    console.log(`📦 Found ${purchasedServices.length} purchased service(s):`);
    console.log("");

    purchasedServices.forEach((service, index) => {
      console.log(`${index + 1}. Service ID: ${service.id}`);
      console.log(`   Provider: ${service.provider.username}`);
      console.log(`   Policy Type: ${service.policyType}`);
      console.log(`   Initial Fee: ${service.initialBackupFee} sats`);
      console.log(`   Per Signature: ${service.perSignatureFee} sats`);
      console.log(`   Created: ${service.createdAt.toISOString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error checking services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableServices();
