#!/usr/bin/env node

const bitcoin = require("bitcoinjs-lib");
const crypto = require("crypto");

async function generateSimplePSBT() {
  console.log("🔧 Generating simple test PSBTs...");

  try {
    // Create a simple unsigned PSBT for testing
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

    // Add a dummy input
    psbt.addInput({
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      index: 0,
      witnessUtxo: {
        script: Buffer.from("001234567890abcdef", "hex"),
        value: 1000000, // 0.01 BTC
      },
    });

    // Add output
    psbt.addOutput({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      value: 999000, // 0.00999 BTC (minus fee)
    });

    // Serialize the PSBT
    const psbtBase64 = psbt.toBase64();

    console.log("\n📄 Generated unsigned PSBT:");
    console.log(`   Length: ${psbtBase64.length} characters`);
    console.log(`   Base64: ${psbtBase64.substring(0, 50)}...`);

    // Save to file
    const fs = require("fs");
    fs.writeFileSync("tests/test-unsigned.psbt", psbtBase64);
    console.log("\n💾 Saved to: tests/test-unsigned.psbt");

    // Create a signed version for testing signature detection
    const signedPsbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    signedPsbt.addInput({
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      index: 0,
      witnessUtxo: {
        script: Buffer.from("001234567890abcdef", "hex"),
        value: 1000000,
      },
    });
    signedPsbt.addOutput({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      value: 999000,
    });

    // Add a partial signature
    signedPsbt.updateInput(0, {
      partialSig: [
        {
          pubkey: Buffer.from("02" + "0".repeat(64), "hex"),
          signature: Buffer.from("30" + "0".repeat(70), "hex"),
        },
      ],
    });

    const signedPsbtBase64 = signedPsbt.toBase64();
    fs.writeFileSync("tests/test-signed.psbt", signedPsbtBase64);
    console.log("💾 Saved to: tests/test-signed.psbt");

    console.log("\n✅ Test PSBTs generated successfully!");
    console.log(
      "🔍 You can now test the signature request feature with these PSBTs."
    );
    console.log(
      "📝 Note: These are dummy PSBTs for testing the upload/validation flow."
    );
  } catch (error) {
    console.error("❌ Error generating test PSBTs:", error);
  }
}

generateSimplePSBT();
