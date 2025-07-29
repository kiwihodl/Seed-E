#!/usr/bin/env node

/**
 * Clean up test data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');

  try {
    // Delete in reverse order to avoid foreign key constraints
    console.log('✅ Deleting signature requests...');
    const deletedRequests = await prisma.signatureRequest.deleteMany();
    console.log(`   Deleted ${deletedRequests.count} signature requests`);

    console.log('✅ Deleting service purchases...');
    const deletedPurchases = await prisma.servicePurchase.deleteMany();
    console.log(`   Deleted ${deletedPurchases.count} purchases`);

    console.log('✅ Deleting services...');
    const deletedServices = await prisma.service.deleteMany();
    console.log(`   Deleted ${deletedServices.count} services`);

    console.log('✅ Deleting clients...');
    const deletedClients = await prisma.client.deleteMany();
    console.log(`   Deleted ${deletedClients.count} clients`);

    console.log('✅ Deleting providers...');
    const deletedProviders = await prisma.provider.deleteMany();
    console.log(`   Deleted ${deletedProviders.count} providers`);

    console.log('\n🎉 Cleanup complete! Database is now empty.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData().catch(console.error); 