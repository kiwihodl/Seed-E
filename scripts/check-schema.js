#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkSchema() {
  console.log("🔍 Checking database schema for encrypted fields...\n");

  try {
    // Check Service table
    console.log("📋 Service table:");
    const serviceFields = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Service' 
      AND column_name LIKE '%encrypted%'
      ORDER BY column_name
    `;

    if (serviceFields.length > 0) {
      serviceFields.forEach((field) => {
        console.log(`   ✅ ${field.column_name} (${field.data_type})`);
      });
    } else {
      console.log("   ❌ No encrypted fields found in Service table");
    }

    // Check ServicePurchase table
    console.log("\n📋 ServicePurchase table:");
    const purchaseFields = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ServicePurchase' 
      AND column_name LIKE '%encrypted%'
      ORDER BY column_name
    `;

    if (purchaseFields.length > 0) {
      purchaseFields.forEach((field) => {
        console.log(`   ✅ ${field.column_name} (${field.data_type})`);
      });
    } else {
      console.log("   ❌ No encrypted fields found in ServicePurchase table");
    }

    // Check SignatureRequest table
    console.log("\n📋 SignatureRequest table:");
    const requestFields = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'SignatureRequest' 
      AND column_name LIKE '%encrypted%'
      ORDER BY column_name
    `;

    if (requestFields.length > 0) {
      requestFields.forEach((field) => {
        console.log(`   ✅ ${field.column_name} (${field.data_type})`);
      });
    } else {
      console.log("   ❌ No encrypted fields found in SignatureRequest table");
    }

    // Summary
    const totalEncryptedFields =
      serviceFields.length + purchaseFields.length + requestFields.length;
    console.log(
      `\n📊 SUMMARY: ${totalEncryptedFields} encrypted fields found in database`
    );

    if (totalEncryptedFields >= 4) {
      console.log("✅ Database schema is ready for Phase 1.5 encryption!");
    } else {
      console.log("❌ Database schema needs to be updated for encryption");
    }
  } catch (error) {
    console.error("❌ Error checking schema:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema().catch(console.error);
