// Script to remove auctions with broken images - handling foreign keys
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
      let images;
      
      // Handle both JSON string and array formats
      if (typeof auction.images === 'string') {
        try {
          images = JSON.parse(auction.images);
        } catch (e) {
          // If parsing fails, treat as single image path
          images = [auction.images];
        }
      } else if (Array.isArray(auction.images)) {
        images = auction.images;
      } else {
        images = [];
      }
      
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
    } else {
      console.log('🗑️ Removing problematic auctions...');
      
      // For each problematic auction, delete related data first
      for (const auction of problematicAuctions) {
        console.log(`Removing ${auction.title}...`);
        
        // Delete related bids first
        await prisma.bid.deleteMany({
          where: {
            productId: auction.id
          }
        });
        
        // Delete any other related data if needed
        // (notifications, watchlist items, etc.)
        
        // Finally delete the auction
        await prisma.product.delete({
          where: {
            id: auction.id
          }
        });
        
        console.log(`  ✅ Removed ${auction.title}`);
      }
      
      console.log(`✅ Successfully removed ${problematicAuctions.length} auctions with broken images`);
    }
    
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
    console.log('\n🎯 Remaining auctions with working images:');
    finalAuctions.forEach((auction, index) => {
      if (index < 10) { // Show first 10
        let images;
        if (typeof auction.images === 'string') {
          try {
            images = JSON.parse(auction.images);
          } catch (e) {
            images = [auction.images];
          }
        } else if (Array.isArray(auction.images)) {
          images = auction.images;
        } else {
          images = [];
        }
        console.log(`- ${auction.title} ($${auction.currentBid || 0}) [${auction.auctionStatus}] - ${images.length} images`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBrokenImages();