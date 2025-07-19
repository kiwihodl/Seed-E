const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Test the hashing function
function hashXpub(xpub) {
  const secret = process.env.XPUB_HASH_SECRET;

  if (!secret) {
    throw new Error("XPUB_HASH_SECRET environment variable is not set");
  }

  const hash = crypto.createHmac("sha256", secret);
  hash.update(xpub);

  return hash.digest("hex");
}

async function testXpubHashing() {
  try {
    console.log("🔐 Testing xpub hashing functionality...\n");

    // Test with a sample xpub
    const testXpub =
      "xpub6Ceq1PQ6ooeEnTo77oy1xV6kuTqQphHbE8rjyg6UgLaRGBED4BNjM2cZL4ZoBEirxt7LzYCV8xT1wpNKELUbTBN7Fj99Bat9zPuDVp6xVWW";

    console.log("Original xpub:", testXpub);
    console.log("Length:", testXpub.length);

    const hashedXpub = hashXpub(testXpub);
    console.log("Hashed xpub:", hashedXpub);
    console.log("Hash length:", hashedXpub.length);

    // Test verification
    const isValid = hashXpub(testXpub) === hashedXpub;
    console.log("Verification test:", isValid ? "✅ PASSED" : "❌ FAILED");

    // Test with different xpub
    const differentXpub =
      "xpub6BhJ9ve5tg5RT1f67T23NGifiB7JdgqTWmmey1jDRh6ef6FwZKLEgbh6KkWJ3VrmeK13EGit7qZbB5H6y6vsAGBEVgCW8fromWieoY9oaff";
    const differentHash = hashXpub(differentXpub);
    console.log("Different xpub hash:", differentHash);
    console.log(
      "Hashes are different:",
      hashedXpub !== differentHash ? "✅ PASSED" : "❌ FAILED"
    );

    console.log("\n✅ Xpub hashing test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing xpub hashing:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testXpubHashing();
