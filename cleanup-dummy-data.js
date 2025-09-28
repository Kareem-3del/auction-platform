// Script to remove dummy auction data and keep only real auctions
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDummyData() {
  try {
    console.log('🧹 Starting dummy data cleanup...');
    
    // Identify dummy auctions based on title patterns
    const dummyTitles = [
      'abada',
      'asd',
      'test',
      'dummy',
      'sample'
    ];
    
    // Find dummy auctions
    const dummyAuctions = await prisma.product.findMany({
      where: {
        OR: [
          // Exact matches for clearly dummy titles
          { title: { in: dummyTitles } },
          // Very short titles (likely test data)
          { title: { contains: 'asd' } },
          { title: { contains: 'test' } },
          { description: { contains: 'sddsss' } },
          { description: { contains: 'deasd' } },
          // Malformed or obviously fake descriptions
          { description: { contains: 'sdd' } },
          { location: { contains: 'dfsdfsdf' } },
          { location: { contains: 'cairo' } } // This seems to be test data based on the description
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        images: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${dummyAuctions.length} dummy auctions:`);
    dummyAuctions.forEach(auction => {
      console.log(`- ${auction.title} (ID: ${auction.id})`);
    });
    
    if (dummyAuctions.length === 0) {
      console.log('✅ No dummy auctions found to remove');
      return;
    }
    
    // Ask for confirmation (we'll proceed automatically for this script)
    console.log('🗑️ Removing dummy auctions...');
    
    // Remove the dummy auctions
    const deleteResult = await prisma.product.deleteMany({
      where: {
        id: {
          in: dummyAuctions.map(auction => auction.id)
        }
      }
    });
    
    console.log(`✅ Successfully removed ${deleteResult.count} dummy auctions`);
    
    // Show remaining auctions count
    const remainingCount = await prisma.product.count({
      where: {
        status: 'APPROVED'
      }
    });
    
    console.log(`📊 Remaining approved auctions: ${remainingCount}`);
    
    // Show sample of remaining auctions
    const sampleAuctions = await prisma.product.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        title: true,
        currentBid: true,
        auctionStatus: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📋 Sample of remaining auctions:');
    sampleAuctions.forEach(auction => {
      console.log(`- ${auction.title} ($${auction.currentBid || 0}) [${auction.auctionStatus}]`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDummyData();