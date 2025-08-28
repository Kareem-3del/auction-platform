import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  console.log('📂 Creating categories...');
  const artCategory = await prisma.category.upsert({
    where: { slug: 'art-collectibles' },
    create: {
      name: 'Art & Collectibles',
      slug: 'art-collectibles',
      description: 'Fine art, sculptures, and collectible items',
      iconUrl: '/icons/art.svg',
      sortOrder: 1,
    },
    update: {},
  });

  const vehiclesCategory = await prisma.category.upsert({
    where: { slug: 'vehicles' },
    create: {
      name: 'Vehicles',
      slug: 'vehicles',
      description: 'Cars, motorcycles, boats, and other vehicles',
      iconUrl: '/icons/vehicles.svg',
      sortOrder: 2,
    },
    update: {},
  });

  const watchesCategory = await prisma.category.upsert({
    where: { slug: 'watches-jewelry' },
    create: {
      name: 'Watches & Jewelry',
      slug: 'watches-jewelry',
      description: 'Luxury watches, jewelry, and accessories',
      iconUrl: '/icons/watches.svg',
      sortOrder: 3,
    },
    update: {},
  });

  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronics' },
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Computers, phones, and electronic devices',
      iconUrl: '/icons/electronics.svg',
      sortOrder: 4,
    },
    update: {},
  });

  // Create subcategories
  await Promise.all([
    prisma.category.upsert({
      where: { slug: 'paintings' },
      create: {
        name: 'Paintings',
        slug: 'paintings',
        description: 'Oil paintings, watercolors, and mixed media',
        parentId: artCategory.id,
        sortOrder: 1,
      },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'sculptures' },
      create: {
        name: 'Sculptures',
        slug: 'sculptures',
        description: 'Stone, metal, and wood sculptures',
        parentId: artCategory.id,
        sortOrder: 2,
      },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'classic-cars' },
      create: {
        name: 'Classic Cars',
        slug: 'classic-cars',
        description: 'Vintage and classic automobiles',
        parentId: vehiclesCategory.id,
        sortOrder: 1,
      },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'motorcycles' },
      create: {
        name: 'Motorcycles',
        slug: 'motorcycles',
        description: 'Vintage and modern motorcycles',
        parentId: vehiclesCategory.id,
        sortOrder: 2,
      },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'luxury-watches' },
      create: {
        name: 'Luxury Watches',
        slug: 'luxury-watches',
        description: 'High-end timepieces and collectible watches',
        parentId: watchesCategory.id,
        sortOrder: 1,
      },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'jewelry' },
      create: {
        name: 'Jewelry',
        slug: 'jewelry',
        description: 'Rings, necklaces, and precious stones',
        parentId: watchesCategory.id,
        sortOrder: 2,
      },
      update: {},
    }),
  ]);


  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await argon2.hash('Admin@123!');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@auction.com' },
    create: {
      email: 'admin@auction.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      userType: 'SUPER_ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      kycStatus: 'VERIFIED',
      kycVerifiedAt: new Date(),
      anonymousDisplayName: 'System Admin',
      anonymousAvatarUrl: '/avatars/admin.png',
      balanceReal: 0,
      balanceVirtual: 0,
      virtualMultiplier: 1,
    },
    update: {},
  });

  // Create demo buyer user
  console.log('🛒 Creating demo buyer...');
  const buyerPassword = await argon2.hash('Buyer@123!');
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    create: {
      email: 'buyer@demo.com',
      passwordHash: buyerPassword,
      firstName: 'John',
      lastName: 'Doe',
      userType: 'BUYER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      kycStatus: 'VERIFIED',
      kycVerifiedAt: new Date(),
      anonymousDisplayName: 'Silent Collector',
      anonymousAvatarUrl: '/avatars/buyer-1.png',
      balanceReal: 1000,
      balanceVirtual: 3000,
      virtualMultiplier: 3,
    },
    update: {},
  });

  // Create demo agent user
  console.log('🏢 Creating demo agent...');
  const agentPassword = await argon2.hash('Agent@123!');
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    create: {
      email: 'agent@demo.com',
      passwordHash: agentPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      userType: 'AGENT',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      kycStatus: 'VERIFIED',
      kycVerifiedAt: new Date(),
      anonymousDisplayName: 'Premium Dealer',
      anonymousAvatarUrl: '/avatars/agent-1.png',
      balanceReal: 500,
      balanceVirtual: 1500,
      virtualMultiplier: 3,
    },
    update: {},
  });

  // Create agent profile
  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    create: {
      userId: agentUser.id,
      businessName: 'Premium Collectibles Ltd.',
      displayName: 'Premium Collectibles',
      bio: 'Specializing in rare collectibles and luxury items with over 20 years of experience in the auction industry.',
      businessType: 'CORPORATION',
      licenseNumber: 'AUC-2024-001',
      status: 'APPROVED',
      commissionRate: 0.05,
      totalSales: 50000,
      totalCommissions: 2500,
      totalAuctions: 25,
      successfulAuctions: 23,
      averageAuctionValue: 2000,
      rating: 4.8,
      reviewCount: 15,
      complianceScore: 95,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    },
    update: {},
  });

  // Create brands
  console.log('🏷️ Creating brands...');
  const rolexBrand = await prisma.brand.upsert({
    where: { name: 'Rolex' },
    create: {
      name: 'Rolex',
      slug: 'rolex',
      description: 'Swiss luxury watch manufacturer founded in 1905, known for precision and prestige.',
      logoUrl: '/images/brands/rolex-logo.png',
      websiteUrl: 'https://www.rolex.com',
      isActive: true,
    },
    update: {},
  });

  const appleBrand = await prisma.brand.upsert({
    where: { name: 'Apple' },
    create: {
      name: 'Apple',
      slug: 'apple',
      description: 'American technology company known for innovative consumer electronics.',
      logoUrl: '/images/brands/apple-logo.png',
      websiteUrl: 'https://www.apple.com',
      isActive: true,
    },
    update: {},
  });

  const independentBrand = await prisma.brand.upsert({
    where: { name: 'Independent Artists' },
    create: {
      name: 'Independent Artists',
      slug: 'independent-artists',
      description: 'Collection of works from independent artists and creators.',
      logoUrl: '/images/brands/independent-logo.png',
      isActive: true,
    },
    update: {},
  });

  // Create tags
  console.log('🏷️ Creating tags...');
  const vintageTa2010g = await prisma.tag.upsert({
    where: { name: 'Vintage' },
    create: {
      name: 'Vintage',
      slug: 'vintage',
      description: 'Items from past eras with historical significance',
      color: '#8B4513',
      isActive: true,
    },
    update: {},
  });

  const luxuryTag = await prisma.tag.upsert({
    where: { name: 'Luxury' },
    create: {
      name: 'Luxury',
      slug: 'luxury',
      description: 'High-end premium items',
      color: '#FFD700',
      isActive: true,
    },
    update: {},
  });

  const rareTag = await prisma.tag.upsert({
    where: { name: 'Rare' },
    create: {
      name: 'Rare',
      slug: 'rare',
      description: 'Uncommon and hard-to-find items',
      color: '#DC143C',
      isActive: true,
    },
    update: {},
  });

  const collectibleTag = await prisma.tag.upsert({
    where: { name: 'Collectible' },
    create: {
      name: 'Collectible',
      slug: 'collectible',
      description: 'Items sought after by collectors',
      color: '#4169E1',
      isActive: true,
    },
    update: {},
  });

  const handmadeTag = await prisma.tag.upsert({
    where: { name: 'Handmade' },
    create: {
      name: 'Handmade',
      slug: 'handmade',
      description: 'Items crafted by hand with artisanal quality',
      color: '#228B22',
      isActive: true,
    },
    update: {},
  });

  // Create sample products with unified auction functionality
  console.log('📦 Creating sample products with auction features...');
  const now = new Date();
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

  const product1 = await prisma.product.create({
    data: {
      agentId: agent.id,
      categoryId: artCategory.id,
      brandId: independentBrand.id,
      title: 'Original Oil Painting - "Sunset Over the Harbor"',
      description: `This stunning original oil painting captures the serene beauty of a harbor at sunset. 
      Created by renowned artist Maria Rodriguez in 2023, this piece showcases masterful use of color and light. 
      The painting depicts fishing boats gently swaying in the golden light of the setting sun, with seagulls 
      soaring overhead. The artist's signature brushwork and attention to detail make this a truly exceptional piece.
      
      Dimensions: 24" x 36" (61cm x 91cm)
      Medium: Oil on canvas
      Frame: Included - Premium gold leaf frame
      Certificate of Authenticity: Included
      
      This piece has been professionally photographed and is ready for immediate shipping worldwide.`,
      shortDescription: 'Stunning original oil painting by Maria Rodriguez featuring a harbor sunset scene.',
      condition: 'EXCELLENT',
      location: 'New York, NY',
      images: JSON.stringify([
        '/images/products/painting-1-main.jpg',
        '/images/products/painting-1-detail.jpg',
        '/images/products/painting-1-frame.jpg',
        '/images/products/painting-1-signature.jpg',
      ]),
      specifications: JSON.stringify({
        artist: 'Maria Rodriguez',
        year: '2023',
        medium: 'Oil on canvas',
        dimensions: '24" x 36" (61cm x 91cm)',
        frame: 'Premium gold leaf frame included',
        weight: '8.5 lbs',
        provenance: 'Direct from artist studio',
      }),
      estimatedValueMin: 1200,
      estimatedValueMax: 1800,
      reservePrice: 1000,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      shippingInfo: JSON.stringify({
        domestic: { available: true, cost: 25 },
        international: { available: true, cost: 75 },
        insurance: 'Included up to full value',
        handling: '2-3 business days',
      }),
      pickupAvailable: true,
      pickupAddress: '123 Gallery Street, New York, NY 10001',
      // Auction fields (unified into Product model)
      startingBid: 800,
      currentBid: 850,
      bidIncrement: 25,
      auctionType: 'LIVE',
      auctionStatus: 'LIVE',
      startTime: new Date(now.getTime() - 60 * 1000), // Started 1 minute ago
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      bidCount: 3,
      uniqueBidders: 2,
      autoExtend: true,
      extensionTriggerMinutes: 2,
      extensionDurationMinutes: 5,
      maxExtensions: 3,
      timezone: 'America/New_York',
      buyNowPrice: 2000,
    },
  });

  const luxuryWatchCategory = await prisma.category.findFirst({
    where: { slug: 'luxury-watches' },
  });

  const product2 = await prisma.product.create({
    data: {
      agentId: agent.id,
      categoryId: luxuryWatchCategory!.id,
      brandId: rolexBrand.id,
      title: '1985 Rolex Submariner 16800 - Vintage Diving Watch',
      description: `Exceptional vintage Rolex Submariner ref. 16800 from 1985. This iconic diving watch represents 
      one of the most sought-after references in the Submariner line. Features the classic black dial and bezel 
      combination that has become synonymous with luxury sports watches.
      
      This particular example is in outstanding condition with original bracelet, crystal, and bezel insert. 
      The movement has been recently serviced by an authorized Rolex service center and comes with a 2-year warranty.
      
      Key Features:
      - 40mm stainless steel case
      - Automatic movement Cal. 3035
      - Unidirectional rotating bezel
      - 300m water resistance
      - Original Oyster bracelet with diving extension
      - Tritium lume plots (matching patina)
      
      Complete set includes original box, papers, and service documentation.`,
      shortDescription: '1985 Rolex Submariner 16800 in exceptional condition with box and papers.',
      condition: 'EXCELLENT',
      location: 'Geneva, Switzerland',
      images: JSON.stringify([
        '/images/products/rolex-1-main.jpg',
        '/images/products/rolex-1-dial.jpg',
        '/images/products/rolex-1-bracelet.jpg',
        '/images/products/rolex-1-case.jpg',
        '/images/products/rolex-1-papers.jpg',
      ]),
      specifications: JSON.stringify({
        brand: 'Rolex',
        model: 'Submariner',
        reference: '16800',
        year: '1985',
        case: '40mm stainless steel',
        movement: 'Automatic Cal. 3035',
        dial: 'Black with luminous markers',
        bracelet: 'Original Oyster bracelet',
        waterResistance: '300m',
        condition: 'Excellent, recently serviced',
      }),
      estimatedValueMin: 8000,
      estimatedValueMax: 12000,
      reservePrice: 7500,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      shippingInfo: JSON.stringify({
        domestic: { available: true, cost: 50 },
        international: { available: true, cost: 150 },
        insurance: 'Fully insured shipping included',
        handling: '1-2 business days',
        signature: 'Required upon delivery',
      }),
      pickupAvailable: true,
      pickupAddress: 'Luxury Watch Boutique, Geneva',
      // Auction fields (unified into Product model)
      startingBid: 5000,
      currentBid: 5200,
      bidIncrement: 100,
      auctionType: 'LIVE',
      auctionStatus: 'LIVE',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 minutes ago
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      bidCount: 5,
      uniqueBidders: 3,
      autoExtend: true,
      extensionTriggerMinutes: 2,
      extensionDurationMinutes: 5,
      maxExtensions: 5,
      timezone: 'Europe/Zurich',
    },
  });

  // Create a third product for electronics category
  const product3 = await prisma.product.create({
    data: {
      agentId: agent.id,
      categoryId: electronicsCategory.id,
      brandId: appleBrand.id,
      title: 'iPhone 15 Pro Max 256GB - Natural Titanium (New)',
      description: `Brand new, sealed iPhone 15 Pro Max in Natural Titanium with 256GB storage. 
      This is the latest flagship device from Apple, featuring the revolutionary A17 Pro chip 
      and advanced camera system with 5x optical zoom.
      
      Key Features:
      - 6.7-inch Super Retina XDR display with ProMotion
      - A17 Pro chip with 6-core GPU
      - Pro camera system with 48MP main camera
      - 5x optical zoom telephoto camera
      - Titanium design with textured matte glass back
      - USB-C connectivity
      - Face ID for secure authentication
      
      Includes original box, USB-C cable, and documentation. Full manufacturer warranty.`,
      shortDescription: 'Brand new iPhone 15 Pro Max 256GB in Natural Titanium with full warranty.',
      condition: 'NEW',
      location: 'San Francisco, CA',
      images: JSON.stringify([
        '/images/products/iphone-15-main.jpg',
        '/images/products/iphone-15-back.jpg',
        '/images/products/iphone-15-box.jpg',
        '/images/products/iphone-15-accessories.jpg',
      ]),
      specifications: JSON.stringify({
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        storage: '256GB',
        color: 'Natural Titanium',
        display: '6.7-inch Super Retina XDR',
        chip: 'A17 Pro',
        camera: '48MP Pro camera system',
        connectivity: 'USB-C, 5G',
        condition: 'Brand new, sealed',
      }),
      estimatedValueMin: 1100,
      estimatedValueMax: 1300,
      reservePrice: 1000,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      shippingInfo: JSON.stringify({
        domestic: { available: true, cost: 15 },
        international: { available: true, cost: 45 },
        insurance: 'Fully insured',
        handling: '1 business day',
      }),
      pickupAvailable: false,
      // Auction fields - scheduled to start in future
      startingBid: 800,
      currentBid: 0,
      bidIncrement: 50,
      auctionType: 'LIVE',
      auctionStatus: 'SCHEDULED',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Starts in 24 hours
      endTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // Ends in 8 days
      bidCount: 0,
      uniqueBidders: 0,
      autoExtend: true,
      extensionTriggerMinutes: 5,
      extensionDurationMinutes: 10,
      maxExtensions: 2,
      timezone: 'America/Los_Angeles',
      buyNowPrice: 1200,
    },
  });

  // Create product-tag associations
  console.log('🔗 Creating product-tag associations...');
  await prisma.productTag.createMany({
    data: [
      // Product 1 (Oil painting) tags
      { productId: product1.id, tagId: handmadeTag.id },
      { productId: product1.id, tagId: collectibleTag.id },
      
      // Product 2 (Rolex) tags
      { productId: product2.id, tagId: vintageTa2010g.id },
      { productId: product2.id, tagId: luxuryTag.id },
      { productId: product2.id, tagId: rareTag.id },
      { productId: product2.id, tagId: collectibleTag.id },
      
      // Product 3 (iPhone) tags
      { productId: product3.id, tagId: luxuryTag.id },
    ],
  });

  // Create sample transactions for buyer
  console.log('💰 Creating sample transactions...');
  await prisma.transaction.create({
    data: {
      userId: buyerUser.id,
      transactionType: 'DEPOSIT',
      amountReal: 1000,
      amountVirtual: 3000,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'BINANCE_PAY',
      externalReference: 'BINANCE_' + nanoid(),
      description: 'Initial deposit via Binance Pay',
      processedAt: new Date(),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: agentUser.id,
      transactionType: 'DEPOSIT',
      amountReal: 500,
      amountVirtual: 1500,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'BINANCE_PAY',
      externalReference: 'BINANCE_' + nanoid(),
      description: 'Agent account funding',
      processedAt: new Date(),
    },
  });

  // Create sample notifications
  console.log('🔔 Creating sample notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: buyerUser.id,
        notificationType: 'SYSTEM_ALERT',
        title: 'Welcome to Global Auction Platform!',
        message: 'Thank you for joining our platform. Start exploring amazing auctions now!',
        deliveryMethod: 'IN_APP',
        sentAt: new Date(),
      },
      {
        userId: agentUser.id,
        notificationType: 'AGENT_APPROVED',
        title: 'Agent Application Approved',
        message: 'Congratulations! Your agent application has been approved. You can now start listing items.',
        deliveryMethod: 'EMAIL',
        sentAt: new Date(),
      },
      {
        userId: buyerUser.id,
        notificationType: 'AUCTION_STARTING',
        title: 'Auction Starting Soon',
        message: 'The auction for "Sunset Over the Harbor" starts in 24 hours. Don\'t miss out!',
        deliveryMethod: 'IN_APP',
        sentAt: new Date(),
      },
    ],
  });

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      targetId: adminUser.id,
      entityType: 'system',
      entityId: 'seed-script',
      action: 'database_seed',
      newValues: JSON.stringify({
        categories: 6,
        users: 3,
        agents: 1,
        brands: 3,
        tags: 5,
        products: 3,
        productTags: 7,
        transactions: 2,
        notifications: 3,
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'Database Seed Script',
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Created:');
  console.log('- 6 categories (4 main + 2 subcategories)');
  console.log('- 3 users (1 admin, 1 buyer, 1 agent)');
  console.log('- 1 agent profile');
  console.log('- 3 brands (Rolex, Apple, Independent Artists)');
  console.log('- 5 tags (Vintage, Luxury, Rare, Collectible, Handmade)');
  console.log('- 3 products with unified auction functionality');
  console.log('- 7 product-tag associations');
  console.log('- 2 transactions');
  console.log('- 3 notifications');
  console.log('\n🔑 Demo Credentials:');
  console.log('Admin: admin@auction.com / Admin@123!');
  console.log('Buyer: buyer@demo.com / Buyer@123!');
  console.log('Agent: agent@demo.com / Agent@123!');
  console.log('\n🚀 Products with Auction Status:');
  console.log('- Oil Painting: LIVE (ends in 7 days)');
  console.log('- Rolex Submariner: LIVE (ends in 7 days)');
  console.log('- iPhone 15 Pro Max: SCHEDULED (starts in 24 hours)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });