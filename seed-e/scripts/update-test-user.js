const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function updateTestUser() {
  try {
    console.log("🔧 Updating test user password...\n");

    // Hash password
    const passwordHash = await bcrypt.hash("password123", 10);

    // Update test client
    const client = await prisma.client.update({
      where: { username: "test21" },
      data: {
        passwordHash: passwordHash,
      },
    });

    console.log("✅ Updated test client:");
    console.log(`   - Username: ${client.username}`);
    console.log(`   - ID: ${client.id}`);
    console.log(`   - New Password: password123`);
  } catch (error) {
    console.error("❌ Error updating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUser();
