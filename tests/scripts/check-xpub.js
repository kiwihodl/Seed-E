const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkXpub() {
  try {
    console.log("🔍 Checking xpub fields for purchased service...");

    const service = await prisma.service.findUnique({
      where: { id: "cmdb36m0b00088z9a5mpewdp8" },
    });

    if (!service) {
      console.log("❌ Service not found");
      return;
    }

    console.log("📋 Service Details:");
    console.log(`   ID: ${service.id}`);
    console.log(`   Has encryptedXpub: ${!!service.encryptedXpub}`);
    console.log(`   xpubHash: ${service.xpubHash.substring(0, 20)}...`);

    if (service.encryptedXpub) {
      console.log(
        `   encryptedXpub: ${service.encryptedXpub.substring(0, 20)}...`
      );
    } else {
      console.log("   ❌ No encryptedXpub found");
    }

    console.log("\n💡 Provider should see:");
    console.log(
      `   - xpub field: ${service.encryptedXpub ? "ACTUAL XPUB" : "HASH ONLY"}`
    );
    console.log(`   - xpubHash field: ${service.xpubHash.substring(0, 20)}...`);
  } catch (error) {
    console.error("❌ Error checking xpub:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkXpub();
