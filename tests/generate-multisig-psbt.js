#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");
const bitcoin = require("bitcoinjs-lib");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");
const crypto = require("crypto");

config();

// Initialize Bitcoin libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const prisma = new PrismaClient();

async function generateMultisigPSBT() {
  console.log("🔧 Generating real multisig PSBTs for testing...");

  try {
    // Get all P2WSH services
    const services = await prisma.service.findMany({
      where: {
        policyType: "P2WSH",
        isActive: true,
      },
      select: {
        id: true,
        masterFingerprint: true,
        derivationPath: true,
        encryptedXpub: true,
      },
    });

    console.log(`📊 Found ${services.length} P2WSH services:`);
    services.forEach((service, index) => {
      console.log(`\n${index + 1}. Service ID: ${service.id}`);
      console.log(`   Master Fingerprint: ${service.masterFingerprint}`);
      console.log(`   Derivation Path: ${service.derivationPath}`);
      console.log(`   Xpub: ${service.encryptedXpub.substring(0, 20)}...`);
    });

    if (services.length < 3) {
      console.log("❌ Need at least 3 P2WSH services for 2-of-3 multisig");
      return;
    }

    // Use the first 3 services for 2-of-3 multisig
    const [service1, service2, service3] = services.slice(0, 3);

    console.log("\n🔑 Creating 2-of-3 multisig setup:");
    console.log(
      `   Key 1: ${service1.masterFingerprint} - ${service1.derivationPath}`
    );
    console.log(
      `   Key 2: ${service2.masterFingerprint} - ${service2.derivationPath}`
    );
    console.log(
      `   Key 3: ${service3.masterFingerprint} - ${service3.derivationPath}`
    );

    // Extract public keys from xpubs
    const pubkeys = [];
    for (const service of [service1, service2, service3]) {
      try {
        // Parse the xpub
        const xpub = bip32.fromBase58(service.encryptedXpub);
        // Get the public key and convert to proper format
        const pubkey = ecc.pointCompress(xpub.publicKey);
        pubkeys.push(pubkey);
        console.log(
          `   Extracted pubkey: ${pubkey.toString("hex").substring(0, 20)}...`
        );
      } catch (error) {
        console.error(
          `   Error extracting pubkey from ${service.id}:`,
          error.message
        );
      }
    }

    if (pubkeys.length < 3) {
      console.log("❌ Could not extract all 3 public keys");
      return;
    }

    // Create 2-of-3 multisig
    const { address, redeem } = bitcoin.payments.p2wsh({
      redeem: bitcoin.payments.p2ms({ m: 2, pubkeys }),
    });

    console.log(`\n📍 Multisig Address: ${address}`);

    // Create a simple PSBT for testing
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

    // Add input (we'll create a dummy input for testing)
    psbt.addInput({
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      index: 0,
      witnessUtxo: {
        script: Buffer.from([]),
        value: 1000000, // 0.01 BTC
      },
      redeemScript: redeem.output,
    });

    // Add output
    psbt.addOutput({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      value: 999000, // 0.00999 BTC (minus fee)
    });

    // Serialize the PSBT
    const psbtBase64 = psbt.toBase64();

    console.log("\n📄 Generated PSBT:");
    console.log(`   Length: ${psbtBase64.length} characters`);
    console.log(`   Base64: ${psbtBase64.substring(0, 50)}...`);

    // Save to file
    const fs = require("fs");
    fs.writeFileSync("tests/test-unsigned-2of3.psbt", psbtBase64);
    console.log("\n💾 Saved to: tests/test-unsigned-2of3.psbt");

    // Also create a signed version for testing signature detection
    // (This would normally be signed by the actual keys)
    const signedPsbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    signedPsbt.addInput({
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      index: 0,
      witnessUtxo: {
        script: Buffer.from([]),
        value: 1000000,
      },
      redeemScript: redeem.output,
      partialSig: [
        {
          pubkey: pubkeys[0],
          signature: Buffer.from("30" + "0".repeat(70), "hex"),
        },
      ],
    });
    signedPsbt.addOutput({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      value: 999000,
    });

    const signedPsbtBase64 = signedPsbt.toBase64();
    fs.writeFileSync("tests/test-signed-2of3.psbt", signedPsbtBase64);
    console.log("💾 Saved to: tests/test-signed-2of3.psbt");

    console.log("\n✅ Multisig PSBTs generated successfully!");
    console.log(
      "🔍 You can now test the signature request feature with these PSBTs."
    );
  } catch (error) {
    console.error("❌ Error generating multisig PSBT:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMultisigPSBT();
