// Script to remove auctions with broken images - fixed version
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupBrokenImages() {
  try {
    console.log('🔧 Cleaning up auctions with broken images...');
    
    // Get all auctions
    const allAuctions = await prisma.product.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        title: true,
        images: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${allAuctions.length} approved auctions to check`);
    
    const problematicAuctions = [];
    
    for (const auction of allAuctions) {
      const images = JSON.parse(auction.images || '[]');
      let hasProblems = false;
      
      for (const imagePath of images) {
        // Check for external Unsplash URLs
        if (imagePath.includes('unsplash.com')) {
          hasProblems = true;
          break;
        }
        
        // Check for known broken local images
        const brokenImages = [
          'rolex1-box.jpg',
          'bmw1-interior.jpg', 
          'iphone1-box.jpg',
          'art1-detail.jpg'
        ];
        
        if (brokenImages.some(broken => imagePath.includes(broken))) {
          hasProblems = true;
          break;
        }
      }
      
      if (hasProblems) {
        problematicAuctions.push(auction);
      }
    }
    
    console.log(`Found ${problematicAuctions.length} auctions with image issues:`);
    problematicAuctions.forEach(auction => {
      console.log(`- ${auction.title} (ID: ${auction.id})`);
    });
    
    if (problematicAuctions.length === 0) {
      console.log('✅ No problematic auctions found');
      return;
    }
    
    // Remove the problematic auctions
    const deleteResult = await prisma.product.deleteMany({
      where: {
        id: {
          in: problematicAuctions.map(auction => auction.id)
        }
      }
    });
    
    console.log(`✅ Successfully removed ${deleteResult.count} auctions with broken images`);
    
    // Show final high-quality auctions
    const finalAuctions = await prisma.product.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        title: true,
        currentBid: true,
        auctionStatus: true,
        images: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Final count: ${finalAuctions.length} high-quality auctions`);
    console.log('\n🎯 Remaining auctions:');
    finalAuctions.forEach(auction => {
      const images = JSON.parse(auction.images || '[]');
      console.log(`- ${auction.title} ($${auction.currentBid || 0}) [${auction.auctionStatus}] - ${images.length} images`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBrokenImages();