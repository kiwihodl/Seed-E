const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixXpubKey() {
  try {
    console.log("🔧 Fixing xpub key for purchased service...");

    // Update the purchased service with a real xpub key
    const updatedService = await prisma.service.update({
      where: {
        id: "cmdbulgfn00088z06ggldj78d", // The service you purchased
      },
      data: {
        encryptedXpub:
          "xpub6F1XwNWF6uBSLtSsPG9K9i5prpiLqJ9HsQJ8xtjQJXE6C9YpfjF4XYibHMsVWrSsNA2NFZGx3cZYBB5FibS5ScqgLHv4ADVjguUtTvcyrr", // Real xpub key
      },
    });

    console.log("✅ Updated service with real xpub key:");
    console.log(`   Service ID: ${updatedService.id}`);
    console.log(`   New xpub: ${updatedService.encryptedXpub}`);
    console.log(`   Length: ${updatedService.encryptedXpub.length}`);

    // Test the truncation
    const xpub = updatedService.encryptedXpub;
    console.log(`\n🧪 Truncation Test:`);
    console.log(`   Full xpub: ${xpub}`);
    console.log(`   First 8: ${xpub.substring(0, 8)}`);
    console.log(`   Last 4: ${xpub.substring(xpub.length - 4)}`);
    console.log(
      `   Truncated: ${xpub.substring(0, 8)}...${xpub.substring(
        xpub.length - 4
      )}`
    );
  } catch (error) {
    console.error("❌ Error fixing xpub key:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixXpubKey();
