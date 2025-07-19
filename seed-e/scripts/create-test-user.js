const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("🔧 Creating test user...\n");

    // Hash password
    const passwordHash = await bcrypt.hash("password123", 10);

    // Create test client
    const client = await prisma.client.create({
      data: {
        username: "test21",
        passwordHash: passwordHash,
      },
    });

    console.log("✅ Created test client:");
    console.log(`   - Username: ${client.username}`);
    console.log(`   - ID: ${client.id}`);
    console.log(`   - Password: password123`);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
