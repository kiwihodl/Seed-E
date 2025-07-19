const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Hash function
function hashXpub(xpub) {
  const secret = process.env.XPUB_HASH_SECRET;

  if (!secret) {
    throw new Error("XPUB_HASH_SECRET environment variable is not set");
  }

  const hash = crypto.createHmac("sha256", secret);
  hash.update(xpub);

  return hash.digest("hex");
}

// Generate a test provider
async function createTestProvider() {
  const provider = await prisma.provider.create({
    data: {
      username: "testprovider",
      passwordHash: "$2a$10$test.hash.for.testing",
      penaltyCount: 0,
    },
  });

  console.log("✅ Created test provider:", provider.username);
  return provider;
}

// Generate test services with hashed xpubs
async function createTestServices(providerId) {
  const testXpubs = [
    "xpub6Ceq1PQ6ooeEnTo77oy1xV6kuTqQphHbE8rjyg6UgLaRGBED4BNjM2cZL4ZoBEirxt7LzYCV8xT1wpNKELUbTBN7Fj99Bat9zPuDVp6xVWW",
    "xpub6BhJ9ve5tg5RT1f67T23NGifiB7JdgqTWmmey1jDRh6ef6FwZKLEgbh6KkWJ3VrmeK13EGit7qZbB5H6y6vsAGBEVgCW8fromWieoY9oaff",
    "xpub6BroNtmopcuMJb9MmLKXrXDHfJhbfNURaLpEXKUcixjGH2QXeeWvUMjuvfwJKJhNmtKvwyVZLdoceKuE9ErXq1D6pBtMi6jFZwWY1f9UMy1",
  ];

  const services = [];

  for (let i = 0; i < testXpubs.length; i++) {
    const xpub = testXpubs[i];
    const xpubHash = hashXpub(xpub);

    const service = await prisma.service.create({
      data: {
        providerId: providerId,
        policyType: "P2WSH",
        xpubHash: xpubHash,
        controlSignature: "test_signature_" + i,
        initialBackupFee: BigInt(50000 + i * 10000),
        perSignatureFee: BigInt(1000),
        minTimeDelay: 168,
        bolt12Offer: "test_bolt12_offer_" + i,
        isActive: true,
        isPurchased: false,
      },
    });

    services.push(service);
    console.log(
      `✅ Created service ${i + 1}: ${service.id} (hash: ${xpubHash.substring(
        0,
        16
      )}...)`
    );
  }

  return services;
}

// Generate a test client
async function createTestClient() {
  const client = await prisma.client.create({
    data: {
      username: "testclient",
      passwordHash: "$2a$10$test.hash.for.testing",
    },
  });

  console.log("✅ Created test client:", client.username);
  return client;
}

async function main() {
  try {
    console.log("🚀 Creating test data with hashed xpubs...\n");

    // Create test provider
    const provider = await createTestProvider();

    // Create test services
    const services = await createTestServices(provider.id);

    // Create test client
    const client = await createTestClient();

    console.log("\n✅ Test data created successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Provider: ${provider.username} (${provider.id})`);
    console.log(`   - Services: ${services.length} created`);
    console.log(`   - Client: ${client.username} (${client.id})`);
    console.log("\n🔐 All xpubs are now hashed and secure!");
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
