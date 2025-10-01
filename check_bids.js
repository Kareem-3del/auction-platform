const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBids() {
  try {
    // Find products with LIVE auctions
    const products = await prisma.product.findMany({
      where: { auctionStatus: 'LIVE' },
      select: {
        id: true,
        title: true,
        currentBid: true,
        bidCount: true,
        highestBidderId: true,
      },
      take: 5,
    });

    console.log('\n=== LIVE Auctions ===');
    for (const product of products) {
      console.log('\nProduct: ' + product.title);
      console.log('ID: ' + product.id);
      console.log('Current Bid (from DB): $' + product.currentBid);
      console.log('Bid Count: ' + product.bidCount);
      
      // Get actual highest bid from Bid table
      const highestBid = await prisma.bid.findFirst({
        where: { productId: product.id },
        orderBy: { amount: 'desc' },
        select: {
          amount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      
      if (highestBid) {
        console.log('Highest Bid (from Bids table): $' + highestBid.amount);
        console.log('Bidder: ' + highestBid.user.firstName + ' ' + highestBid.user.lastName);
        console.log('Bid Time: ' + highestBid.createdAt);
        
        // Check if they match
        if (Number(product.currentBid) !== Number(highestBid.amount)) {
          console.log('❌ MISMATCH DETECTED!');
        } else {
          console.log('✅ Bid amounts match');
        }
      } else {
        console.log('No bids found for this product');
      }
      
      // Get recent bids
      const recentBids = await prisma.bid.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          amount: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      
      console.log('\nRecent Bids:');
      recentBids.forEach((bid, index) => {
        const num = index + 1;
        console.log('  ' + num + '. $' + bid.amount + ' by ' + bid.user.firstName + ' ' + bid.user.lastName + ' at ' + bid.createdAt);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBids();
