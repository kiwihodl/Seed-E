const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupSignatureRequests() {
  try {
    // Delete signature requests with empty psbtData
    const result = await prisma.signatureRequest.deleteMany({
      where: {
        psbtData: "",
      },
    });

    console.log(
      `✅ Deleted ${result.count} signature requests with empty PSBT data`
    );
  } catch (error) {
    console.error("❌ Error cleaning up signature requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSignatureRequests();
