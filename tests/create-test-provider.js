const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestProvider() {
  try {
    // Check if provider already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { username: "testuser" },
    });

    if (existingProvider) {
      console.log("Provider testuser already exists");
      return;
    }

    // Create test provider
    const provider = await prisma.provider.create({
      data: {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "dummy-hash-for-testing",
        isActive: true,
      },
    });

    console.log("Created test provider:", provider);
  } catch (error) {
    console.error("Error creating test provider:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProvider();
