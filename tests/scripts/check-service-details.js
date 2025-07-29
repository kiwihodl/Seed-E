const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkServiceDetails() {
  try {
    console.log("🔍 Checking service details...");

    const service = await prisma.service.findFirst({
      include: {
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    if (service) {
      console.log("✅ Service found:");
      console.log("  ID:", service.id);
      console.log("  Provider:", service.provider.username);
      console.log("  Policy Type:", service.policyType);
      console.log("  Initial Fee:", service.initialBackupFee);
      console.log("  Per Signature Fee:", service.perSignatureFee);
      console.log("  Lightning Address:", service.lightningAddress);
      console.log("  Is Purchased:", service.isPurchased);
      console.log("  Created:", service.createdAt);
    } else {
      console.log("❌ No service found");
    }

    // Also check clients
    const clients = await prisma.client.findMany();
    console.log(`📊 Found ${clients.length} client(s):`);
    clients.forEach((client) => {
      console.log(`  - ${client.username} (${client.id})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceDetails();
