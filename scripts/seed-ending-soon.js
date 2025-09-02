#!/usr/bin/env node
/**
 * Add some ENDING_SOON auction items for testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const endingSoonData = [
  {
    title: 'Monet Water Lilies Painting - Limited Edition Print',
    description: 'Beautiful limited edition print of Monet\'s famous Water Lilies series. Professionally framed and authenticated.',
    shortDescription: 'Monet Water Lilies limited edition print',
    category: 'art-collectibles',
    condition: 'EXCELLENT',
    location: 'London, UK',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop&crop=center'
    ],
    estimatedValueMin: 5000,
    estimatedValueMax: 8000,
    startingBid: 4000,
    currentBid: 6500,
    bidIncrement: 100,
    auctionStatus: 'LIVE',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    viewCount: 834,
    favoriteCount: 67,
    bidCount: 18,
    uniqueBidders: 12
  },
  {
    title: 'Vintage Cartier Santos Watch - Gold',
    description: 'Classic Cartier Santos in 18k yellow gold. Recently serviced with original box and papers.',
    shortDescription: 'Vintage Cartier Santos in 18k gold',
    category: 'watches-jewelry',
    condition: 'GOOD',
    location: 'New York, USA',
    images: [
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&h=600&fit=crop&crop=center'
    ],
    estimatedValueMin: 12000,
    estimatedValueMax: 15000,
    startingBid: 10000,
    currentBid: 13500,
    bidIncrement: 500,
    auctionStatus: 'LIVE',
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    viewCount: 567,
    favoriteCount: 43,
    bidCount: 22,
    uniqueBidders: 14
  }
];

async function seedEndingSoon() {
  try {
    console.log('🌱 Adding ENDING_SOON auction items...');

    // Get existing categories and agent
    const artCategory = await prisma.category.findFirst({ where: { slug: 'art-collectibles' } });
    const watchCategory = await prisma.category.findFirst({ where: { slug: 'watches-jewelry' } });
    const agent = await prisma.agent.findFirst({ where: { status: 'APPROVED' } });

    if (!artCategory || !watchCategory || !agent) {
      console.error('Missing required categories or agent. Please run seed-auctions.js first.');
      return;
    }

    for (const item of endingSoonData) {
      const category = item.category === 'art-collectibles' ? artCategory : watchCategory;

      // Check if product already exists
      const existing = await prisma.product.findFirst({ where: { title: item.title } });

      if (existing) {
        console.log(`Updating existing product: ${item.title}`);
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            description: item.description,
            shortDescription: item.shortDescription,
            condition: item.condition,
            location: item.location,
            images: JSON.stringify(item.images),
            estimatedValueMin: item.estimatedValueMin,
            estimatedValueMax: item.estimatedValueMax,
            startingBid: item.startingBid,
            currentBid: item.currentBid,
            bidIncrement: item.bidIncrement,
            auctionStatus: item.auctionStatus,
            startTime: item.startTime,
            endTime: item.endTime,
            viewCount: item.viewCount,
            favoriteCount: item.favoriteCount,
            bidCount: item.bidCount,
            uniqueBidders: item.uniqueBidders,
            categoryId: category.id,
            agentId: agent.id,
            status: 'APPROVED',
          }
        });
      } else {
        console.log(`Creating new product: ${item.title}`);
        await prisma.product.create({
          data: {
            title: item.title,
            description: item.description,
            shortDescription: item.shortDescription,
            condition: item.condition,
            location: item.location,
            images: JSON.stringify(item.images),
            estimatedValueMin: item.estimatedValueMin,
            estimatedValueMax: item.estimatedValueMax,
            startingBid: item.startingBid,
            currentBid: item.currentBid,
            bidIncrement: item.bidIncrement,
            auctionStatus: item.auctionStatus,
            startTime: item.startTime,
            endTime: item.endTime,
            viewCount: item.viewCount,
            favoriteCount: item.favoriteCount,
            bidCount: item.bidCount,
            uniqueBidders: item.uniqueBidders,
            categoryId: category.id,
            agentId: agent.id,
            status: 'APPROVED',
          }
        });
      }
    }

    console.log('🎯 ENDING_SOON items created successfully!');
  } catch (error) {
    console.error('❌ Error seeding ending soon data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEndingSoon();