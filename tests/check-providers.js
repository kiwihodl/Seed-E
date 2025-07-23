const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkProviders() {
  try {
    console.log("🔍 Checking all providers in database...");

    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        username: true,
        passwordHash: true,
        twoFactorSecret: true,
        createdAt: true,
      },
    });

    console.log(`✅ Found ${providers.length} provider(s):`);

    providers.forEach((provider, index) => {
      console.log(`\n${index + 1}. Provider Details:`);
      console.log(`   ID: ${provider.id}`);
      console.log(`   Username: ${provider.username}`);
      console.log(
        `   Password Hash: ${provider.passwordHash.substring(0, 20)}...`
      );
      console.log(`   2FA Secret: ${provider.twoFactorSecret || "NOT SET"}`);
      console.log(`   Created: ${provider.createdAt}`);

      // Test if this is the "password" hash
      const testHash =
        "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m";
      if (provider.passwordHash === testHash) {
        console.log(`   ✅ Password: "password"`);
      } else {
        console.log(`   ❓ Password: Unknown (not "password")`);
      }
    });

    if (providers.length === 0) {
      console.log("❌ No providers found in database");
    }
  } catch (error) {
    console.error("❌ Error checking providers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProviders();
