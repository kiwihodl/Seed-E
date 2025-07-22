const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupInvalidSignatureRequests() {
  try {
    console.log("🧹 Cleaning up invalid signature requests...");

    // Find signature requests that were created during payment but never had PSBT data
    const invalidRequests = await prisma.signatureRequest.findMany({
      where: {
        OR: [
          {
            psbtData: "", // Empty PSBT data
          },
          {
            paymentConfirmed: false, // Payment not confirmed
          },
        ],
      },
    });

    console.log(
      `Found ${invalidRequests.length} invalid signature requests to clean up`
    );

    if (invalidRequests.length > 0) {
      // Delete the invalid requests
      await prisma.signatureRequest.deleteMany({
        where: {
          OR: [
            {
              psbtData: "", // Empty PSBT data
            },
            {
              paymentConfirmed: false, // Payment not confirmed
            },
          ],
        },
      });

      console.log("✅ Cleaned up invalid signature requests");
    } else {
      console.log("✅ No invalid signature requests found");
    }

    // Show remaining valid requests
    const validRequests = await prisma.signatureRequest.findMany({
      include: {
        client: true,
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    console.log(`\n📊 Remaining signature requests: ${validRequests.length}`);
    validRequests.forEach((request, index) => {
      console.log(`${index + 1}. ID: ${request.id}`);
      console.log(`   Client: ${request.client.username}`);
      console.log(`   Provider: ${request.service.provider.username}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Payment Confirmed: ${request.paymentConfirmed}`);
      console.log(`   PSBT Data Length: ${request.psbtData?.length || 0}`);
      console.log(`   Created: ${request.createdAt}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error cleaning up signature requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInvalidSignatureRequests();
