const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function generateTestPSBT() {
  try {
    // Get a service to use for testing
    const service = await prisma.service.findFirst({
      where: {
        isActive: true,
      },
      include: {
        provider: true,
      },
    });

    if (!service) {
      console.log("❌ No active service found. Please create a service first.");
      return;
    }

    console.log(
      `✅ Using service: ${service.provider.username} - ${service.policyType}`
    );

    // Create a simple test PSBT structure
    // This is a minimal PSBT that represents an unsigned transaction
    const testPSBT = {
      // PSBT magic bytes (0x70736274)
      magic: Buffer.from([0x70, 0x73, 0x62, 0x74]),

      // Version 0
      version: Buffer.from([0x00, 0x00, 0x00, 0x00]),

      // Global transaction (simplified)
      globalTx: {
        version: Buffer.from([0x01, 0x00, 0x00, 0x00]), // Version 1
        inputs: [
          {
            // Previous transaction hash (32 bytes of zeros for testing)
            prevTxHash: Buffer.alloc(32, 0),
            // Previous output index (4 bytes, little endian)
            prevOutputIndex: Buffer.from([0x00, 0x00, 0x00, 0x00]),
            // Sequence (4 bytes, little endian)
            sequence: Buffer.from([0xff, 0xff, 0xff, 0xff]),
          },
        ],
        outputs: [
          {
            // Amount (8 bytes, little endian) - 1000 sats
            amount: Buffer.from([
              0xe8, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]),
            // Script (P2WPKH output)
            script: Buffer.from([0x16, 0x00, 0x14]), // OP_0 + OP_PUSHBYTES_20 + 20-byte hash
          },
        ],
        locktime: Buffer.from([0x00, 0x00, 0x00, 0x00]),
      },

      // Input data (no signatures yet - that's what makes it unsigned)
      inputs: [
        {
          // No witness data (unsigned)
          witnessUtxo: {
            amount: Buffer.from([
              0xe8, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]), // 1000 sats
            scriptPubKey: Buffer.from([0x16, 0x00, 0x14]), // P2WPKH
          },
          // No partial signatures (unsigned)
          partialSigs: [],
          // No sighash type
          sighashType: null,
          // No redeem script
          redeemScript: null,
          // No witness script
          witnessScript: null,
        },
      ],

      // Output data
      outputs: [
        {
          // No redeem script
          redeemScript: null,
          // No witness script
          witnessScript: null,
        },
      ],

      // End marker
      endMarker: Buffer.from([0x00]),
    };

    // Convert to base64 (this is a simplified representation)
    // In reality, PSBTs have a specific binary format
    const psbtString = Buffer.concat([
      testPSBT.magic,
      testPSBT.version,
      // Simplified global transaction
      Buffer.from([0x00, 0x00]), // Global transaction length (simplified)
      // Inputs
      Buffer.from([0x01]), // Number of inputs
      Buffer.from([0x00, 0x00]), // Input data length (simplified)
      // Outputs
      Buffer.from([0x01]), // Number of outputs
      Buffer.from([0x00, 0x00]), // Output data length (simplified)
      testPSBT.endMarker,
    ]).toString("base64");

    console.log("✅ Generated test unsigned PSBT:");
    console.log(`📄 PSBT (Base64): ${psbtString}`);
    console.log(`📏 Length: ${psbtString.length} characters`);

    // Save to file for easy testing
    const fs = require("fs");
    fs.writeFileSync("tests/test-unsigned.psbt", psbtString);
    console.log("💾 Saved to: tests/test-unsigned.psbt");

    console.log("\n📋 To test the signature request:");
    console.log("1. Go to client dashboard");
    console.log("2. Click 'Request Signature'");
    console.log("3. Pay the fee");
    console.log("4. Upload the file: tests/test-unsigned.psbt");
    console.log("5. Submit the request");
  } catch (error) {
    console.error("❌ Error generating test PSBT:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestPSBT();
