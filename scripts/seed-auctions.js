#!/usr/bin/env node
/**
 * Seed script to create realistic auction data for the home page
 * This ensures the API returns real data instead of mock data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auctionData = [
  {
    title: 'Picasso Original Sketch',
    description: 'An authentic original sketch by Pablo Picasso, featuring his signature cubist style. This rare piece dates from his blue period and showcases his masterful line work.',
    shortDescription: 'Authentic Picasso sketch from his blue period',
    category: 'art-collectibles',
    condition: 'EXCELLENT',
    location: 'Paris, France',
    images: [
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center'
    ],
    estimatedValueMin: 150000,
    estimatedValueMax: 200000,
    startingBid: 120000,
    currentBid: 180000,
    bidIncrement: 5000,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    viewCount: 2847,
    favoriteCount: 234,
    bidCount: 23,
    uniqueBidders: 15
  },
  {
    title: 'Rolex Submariner 16610 - Vintage',
    description: 'Classic Rolex Submariner reference 16610 in exceptional condition. This iconic diving watch features the legendary black dial and bezel combination.',
    shortDescription: 'Vintage Rolex Submariner in pristine condition',
    category: 'watches-jewelry',
    condition: 'EXCELLENT',
    location: 'Geneva, Switzerland',
    images: [
      'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&h=600&fit=crop&crop=center'
    ],
    estimatedValueMin: 8000,
    estimatedValueMax: 12000,
    startingBid: 6500,
    currentBid: 9750,
    bidIncrement: 250,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    viewCount: 1923,
    favoriteCount: 156,
    bidCount: 31,
    uniqueBidders: 19
  },
  {
    title: '1965 Ferrari 250 GT California Spider',
    description: 'Exceptional 1965 Ferrari 250 GT California Spider, one of the most coveted classic cars ever produced. Recently restored to concours condition.',
    shortDescription: 'Iconic Ferrari 250 GT California in concours condition',
    category: 'vehicles',
    condition: 'EXCELLENT',
    location: 'Monaco',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c5bdc5?w=800&h=600&fit=crop&crop=center'
    ],
    estimatedValueMin: 8000000,
    estimatedValueMax: 12000000,
    startingBid: 7000000,
    currentBid: 9500000,
    bidIncrement: 100000,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    viewCount: 4231,
    favoriteCount: 456,
    bidCount: 12,
    uniqueBidders: 8
  },
  {
    title: 'Hermès Birkin Himalaya Crocodile 30cm',
    description: 'Ultra-rare Hermès Birkin Himalaya in Niloticus crocodile with 18k white gold and diamond hardware. This is one of the most coveted luxury handbags.',
    shortDescription: 'Ultra-rare Hermès Birkin Himalaya with diamond hardware',
    category: 'art-collectibles',
    condition: 'NEW',
    location: 'Paris, France',
    images: [
      'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&crop=center'
    ],
    estimatedValueMin: 300000,
    estimatedValueMax: 450000,
    startingBid: 250000,
    currentBid: 385000,
    bidIncrement: 10000,
    auctionStatus: 'LIVE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    viewCount: 1567,
    favoriteCount: 198,
    bidCount: 28,
    uniqueBidders: 16
  }
];

async function seedAuctions() {
  try {
    console.log('🌱 Starting auction data seeding...');

    // First, make sure we have categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'art-collectibles' },
        create: {
          name: 'Art & Collectibles',
          slug: 'art-collectibles',
          description: 'Fine art, sculptures, and collectible items',
          iconUrl: '/icons/art.svg',
          sortOrder: 1,
        },
        update: {},
      }),
      prisma.category.upsert({
        where: { slug: 'watches-jewelry' },
        create: {
          name: 'Watches & Jewelry',
          slug: 'watches-jewelry',
          description: 'Luxury watches, jewelry, and accessories',
          iconUrl: '/icons/watches.svg',
          sortOrder: 2,
        },
        update: {},
      }),
      prisma.category.upsert({
        where: { slug: 'vehicles' },
        create: {
          name: 'Vehicles',
          slug: 'vehicles',
          description: 'Cars, motorcycles, boats, and other vehicles',
          iconUrl: '/icons/vehicles.svg',
          sortOrder: 3,
        },
        update: {},
      })
    ]);

    console.log('📂 Categories created/updated');

    // Check if we have an agent to assign products to
    let agent = await prisma.agent.findFirst({
      where: { status: 'APPROVED' }
    });

    if (!agent) {
      // Create a demo user and agent
      const demoUser = await prisma.user.create({
        data: {
          email: 'demo-agent@auction.com',
          firstName: 'Demo',
          lastName: 'Agent',
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy', // placeholder hash
          anonymousDisplayName: 'Auction House',
          userType: 'AGENT',
          isActive: true,
          emailVerified: true,
        }
      });

      agent = await prisma.agent.create({
        data: {
          userId: demoUser.id,
          displayName: 'Premium Auction House',
          businessName: 'Premium Auction House Ltd.',
          logoUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop&crop=center',
          status: 'APPROVED',
          rating: 4.9,
          reviewCount: 145,
        }
      });

      console.log('👤 Demo agent created');
    }

    // Create auction products
    for (const item of auctionData) {
      const category = categories.find(cat => cat.slug === item.category);
      if (!category) {
        console.warn(`Category ${item.category} not found, skipping item: ${item.title}`);
        continue;
      }

      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: { title: item.title }
      });

      if (existingProduct) {
        console.log(`Product "${item.title}" already exists, updating...`);
        await prisma.product.update({
          where: { id: existingProduct.id },
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

    console.log('🎯 Auction data seeding completed successfully!');
    console.log(`Created/updated ${auctionData.length} auction items`);

  } catch (error) {
    console.error('❌ Error seeding auction data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedAuctions()
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAuctions };