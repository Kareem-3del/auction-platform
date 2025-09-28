// Script to remove auctions with broken images
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupBrokenImages() {
  try {
    console.log('🔧 Cleaning up auctions with broken images...');
    
    // Find auctions using external Unsplash URLs that might be broken
    const auctionsWithExternalImages = await prisma.product.findMany({
      where: {
        images: {
          contains: 'unsplash.com'
        }
      },
      select: {
        id: true,
        title: true,
        images: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${auctionsWithExternalImages.length} auctions with external images`);
    
    // Also find auctions with missing local images (those that would 404)
    const suspiciousLocalImages = await prisma.product.findMany({
      where: {
        OR: [
          { images: { contains: 'rolex1-box.jpg' } },
          { images: { contains: 'bmw1-interior.jpg' } },
          { images: { contains: 'iphone1-box.jpg' } },
          { images: { contains: 'art1-detail.jpg' } }
        ]
      },
      select: {
        id: true,
        title: true,
        images: true
      }
    });
    
    console.log(`Found ${suspiciousLocalImages.length} auctions with potentially broken local images`);
    
    // Combine all problematic auctions
    const problematicAuctions = [
      ...auctionsWithExternalImages,
      ...suspiciousLocalImages
    ];
    
    // Remove duplicates
    const uniqueProblematic = problematicAuctions.filter((auction, index, self) => 
      index === self.findIndex(a => a.id === auction.id)
    );
    
    console.log(`Total problematic auctions to remove: ${uniqueProblematic.length}`);
    
    uniqueProblematic.forEach(auction => {
      console.log(`- ${auction.title} (ID: ${auction.id})`);
    });
    
    if (uniqueProblematic.length === 0) {
      console.log('✅ No problematic auctions found');
      return;
    }
    
    // Remove the problematic auctions
    const deleteResult = await prisma.product.deleteMany({
      where: {
        id: {
          in: uniqueProblematic.map(auction => auction.id)
        }
      }
    });
    
    console.log(`✅ Successfully removed ${deleteResult.count} auctions with broken images`);
    
    // Show final count
    const finalCount = await prisma.product.count({
      where: {
        status: 'APPROVED'
      }
    });
    
    console.log(`📊 Final count of approved auctions: ${finalCount}`);
    
    // Show remaining high-quality auctions
    const qualityAuctions = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        images: {
          not: {
            contains: 'unsplash.com'
          }
        }
      },
      select: {
        id: true,
        title: true,
        currentBid: true,
        auctionStatus: true,
        images: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n🎯 High-quality auctions remaining:');
    qualityAuctions.forEach(auction => {
      const imageCount = JSON.parse(auction.images || '[]').length;
      console.log(`- ${auction.title} ($${auction.currentBid || 0}) [${auction.auctionStatus}] - ${imageCount} images`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBrokenImages();