const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listPendingPurchases() {
  try {
    console.log('🔍 Listing all pending purchases...');
    
    const purchases = await prisma.servicePurchase.findMany({
      where: {
        isActive: false, // Only pending purchases
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                username: true,
              },
            },
          },
        },
        client: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (purchases.length === 0) {
      console.log('✅ No pending purchases found');
      return;
    }

    console.log(`📋 Found ${purchases.length} pending purchase(s):`);
    console.log('');
    
    purchases.forEach((purchase, index) => {
      console.log(`${index + 1}. Purchase ID: ${purchase.id}`);
      console.log(`   Payment Hash: ${purchase.paymentHash}`);
      console.log(`   Client: ${purchase.client.username}`);
      console.log(`   Provider: ${purchase.service.provider.username}`);
      console.log(`   Service: ${purchase.service.policyType}`);
      console.log(`   Amount: ${purchase.service.initialBackupFee} sats`);
      console.log(`   Created: ${purchase.createdAt.toISOString()}`);
      console.log('');
    });

    console.log('💡 To confirm a payment, use:');
    console.log('   node confirm-payment.js <payment-hash>');
    console.log('');
    console.log('Example:');
    console.log(`   node confirm-payment.js ${purchases[0]?.paymentHash || 'PAYMENT_HASH_HERE'}`);

  } catch (error) {
    console.error('❌ Error listing purchases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listPendingPurchases(); 