#!/usr/bin/env node
/**
 * Create fallback products with specific IDs so mock data links work
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const fallbackProducts = [
  {
    id: 'cmf2k2dbx0006yc8c4ir9kgla',
    title: 'Patek Philippe Nautilus 5711/1A',
    description: 'Rare stainless steel Patek Philippe Nautilus with blue dial. One of the most coveted luxury watches in the world.',
    shortDescription: 'Rare Patek Philippe Nautilus with blue dial',
    category: 'watches-jewelry',
    condition: 'EXCELLENT',
    location: 'Geneva, Switzerland',
    images: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&h=600&fit=crop&crop=center'],
    estimatedValueMin: 180000,
    estimatedValueMax: 220000,
    startingBid: 150000,
    currentBid: 195000,
    bidIncrement: 5000,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    viewCount: 1923,
    favoriteCount: 234,
    bidCount: 18,
    uniqueBidders: 12
  },
  {
    id: 'cmf2k2dc50008yc8c7xm9qnpd',
    title: 'Picasso - Woman with a Hat (1962)',
    description: 'Exceptional Picasso artwork from his later period, featuring his signature style and vibrant use of color.',
    shortDescription: 'Exceptional Picasso artwork from his later period',
    category: 'art-collectibles',
    condition: 'EXCELLENT',
    location: 'Paris, France',
    images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop&crop=center'],
    estimatedValueMin: 2500000,
    estimatedValueMax: 3500000,
    startingBid: 2000000,
    currentBid: 2750000,
    bidIncrement: 50000,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    viewCount: 3456,
    favoriteCount: 289,
    bidCount: 7,
    uniqueBidders: 5
  },
  {
    id: 'cmf2k2dcd000ayc8cbt7h4mjk',
    title: 'Hermès Birkin Himalaya Crocodile 30cm',
    description: 'Ultra-rare Hermès Birkin in Himalaya Niloticus crocodile with 18k white gold and diamond hardware.',
    shortDescription: 'Ultra-rare Hermès Birkin Himalaya with diamond hardware',
    category: 'art-collectibles',
    condition: 'NEW',
    location: 'Paris, France',
    images: ['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&h=600&fit=crop&crop=center'],
    estimatedValueMin: 150000,
    estimatedValueMax: 200000,
    startingBid: 120000,
    currentBid: 175000,
    bidIncrement: 5000,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    viewCount: 1567,
    favoriteCount: 198,
    bidCount: 22,
    uniqueBidders: 14
  }
];

async function createFallbackProducts() {
  try {
    console.log('🔧 Creating fallback products for mock data links...');

    // Get categories
    const categories = await Promise.all([
      prisma.category.findFirst({ where: { slug: 'art-collectibles' } }),
      prisma.category.findFirst({ where: { slug: 'watches-jewelry' } })
    ]);

    // Get agent
    const agent = await prisma.agent.findFirst({
      where: { status: 'APPROVED' }
    });

    if (!agent) {
      console.error('No approved agent found. Please run seed script first.');
      return;
    }

    for (const item of fallbackProducts) {
      const category = categories.find(cat => cat?.slug === item.category);
      if (!category) {
        console.warn(`Category ${item.category} not found, skipping ${item.title}`);
        continue;
      }

      // Check if product already exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: item.id }
      });

      if (existingProduct) {
        console.log(`Product with ID ${item.id} already exists, skipping...`);
        continue;
      }

      console.log(`Creating fallback product: ${item.title}`);
      await prisma.product.create({
        data: {
          id: item.id,
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

    console.log('✅ Fallback products created successfully!');

  } catch (error) {
    console.error('❌ Error creating fallback products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
if (require.main === module) {
  createFallbackProducts()
    .catch((error) => {
      console.error('Creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createFallbackProducts };