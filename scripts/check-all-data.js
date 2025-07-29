#!/usr/bin/env node

/**
 * Check all data in database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllData() {
  console.log('🔍 Checking all database data...\n');

  try {
    // Check all tables
    const providers = await prisma.provider.findMany();
    const clients = await prisma.client.findMany();
    const services = await prisma.service.findMany();
    const purchases = await prisma.servicePurchase.findMany();
    const requests = await prisma.signatureRequest.findMany();

    console.log('📊 DATABASE CONTENTS:');
    console.log(`   Providers: ${providers.length}`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Services: ${services.length}`);
    console.log(`   Purchases: ${purchases.length}`);
    console.log(`   Signature Requests: ${requests.length}`);

    if (providers.length > 0) {
      console.log('\n👥 PROVIDERS:');
      providers.forEach(p => console.log(`   - ${p.username} (${p.id})`));
    }

    if (clients.length > 0) {
      console.log('\n👤 CLIENTS:');
      clients.forEach(c => console.log(`   - ${c.username} (${c.id})`));
    }

    if (services.length > 0) {
      console.log('\n🔧 SERVICES:');
      services.forEach(s => console.log(`   - ${s.policyType} (${s.id})`));
    }

    if (purchases.length > 0) {
      console.log('\n💰 PURCHASES:');
      purchases.forEach(p => console.log(`   - ${p.id}`));
    }

    if (requests.length > 0) {
      console.log('\n📝 SIGNATURE REQUESTS:');
      requests.forEach(r => console.log(`   - ${r.status} (${r.id})`));
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAllData().catch(console.error); 