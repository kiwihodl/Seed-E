const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkRecoveryKey() {
  try {
    console.log('🔍 Checking recovery key for client "test"...');

    const client = await prisma.client.findUnique({
      where: { username: "test" },
      select: {
        id: true,
        username: true,
        recoveryKey: true,
        twoFactorSecret: true,
        createdAt: true,
      },
    });

    if (client) {
      console.log("✅ Found client:");
      console.log(`  - ID: ${client.id}`);
      console.log(`  - Username: ${client.username}`);
      console.log(`  - Recovery Key: ${client.recoveryKey || "NOT SET"}`);
      console.log(
        `  - 2FA Secret: ${client.twoFactorSecret ? "SET" : "NOT SET"}`
      );
      console.log(`  - Created: ${client.createdAt}`);
    } else {
      console.log('❌ Client "test" not found');
    }
  } catch (error) {
    console.error("❌ Error checking recovery key:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecoveryKey();
