#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function checkMasterFingerprints() {
  console.log("🔍 Checking master fingerprints in database...");

  try {
    const services = await prisma.service.findMany({
      select: {
        id: true,
        policyType: true,
        masterFingerprint: true,
        derivationPath: true,
        encryptedXpub: true,
      },
    });

    console.log(`📊 Found ${services.length} services:`);
    services.forEach((service, index) => {
      console.log(`\n${index + 1}. Service ID: ${service.id}`);
      console.log(`   Policy Type: ${service.policyType}`);
      console.log(`   Master Fingerprint: "${service.masterFingerprint}"`);
      console.log(`   Derivation Path: "${service.derivationPath}"`);
      console.log(`   Xpub: ${service.encryptedXpub.substring(0, 20)}...`);
      
      if (service.masterFingerprint) {
        console.log(`   Fingerprint length: ${service.masterFingerprint.length} characters`);
        console.log(`   Is hex: ${/^[0-9A-Fa-f]+$/.test(service.masterFingerprint)}`);
      }
    });
  } catch (error) {
    console.error("❌ Error checking master fingerprints:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMasterFingerprints(); 