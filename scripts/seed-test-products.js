const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestProducts() {
  try {
    console.log('🌱 Seeding test products...');

    // Get or create a default agent
    let agent = await prisma.agent.findFirst();
    if (!agent) {
      console.log('🆕 Creating default agent...');
      
      // First create a user for the agent
      const agentUser = await prisma.user.create({
        data: {
          email: 'agent@lebanon-auction.com',
          firstName: 'Lebanon',
          lastName: 'Auction House',
          userType: 'AGENT',
          emailVerified: true,
        }
      });

      agent = await prisma.agent.create({
        data: {
          userId: agentUser.id,
          businessName: 'Lebanon Auction House',
          businessNameAr: 'دار المزادات اللبنانية',
          contactEmail: 'info@lebanon-auction.com',
          contactPhone: '+961 1 234 567',
          address: 'Beirut, Lebanon',
          website: 'https://lebanon-auction.com',
          logoUrl: '/logo/logo-full.png',
          isVerified: true,
          isActive: true,
        }
      });
      
      console.log('✅ Default agent created');
    }

    // Get categories
    const categories = await prisma.category.findMany({
      where: { isActive: true }
    });

    if (categories.length === 0) {
      console.log('❌ No categories found. Please seed categories first.');
      return;
    }

    console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
    console.log(`Using agent: ${agent.businessName}`);

    // Sample products for each category
    const testProducts = [
      // Art & Collectibles
      {
        title: 'Vintage Oil Painting - Mountain Landscape',
        description: 'Beautiful vintage oil painting depicting a serene mountain landscape. Painted in the 1960s by a local artist. Canvas measures 24x18 inches with original wooden frame.',
        categoryName: 'Art & Collectibles',
        condition: 'GOOD',
        location: 'Beirut, Lebanon',
        images: ['/images/products/art1.jpg', '/images/products/art1-detail.jpg'],
        estimatedValueMin: 800,
        estimatedValueMax: 1200,
        provenance: 'Private collection',
        dimensions: '24x18 inches',
        materials: 'Oil on canvas',
        authenticity: 'Original artwork',
        auctionStatus: 'LIVE',
        startingBid: 500,
        currentBid: 750,
        bidCount: 3,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: 'Antique Persian Carpet',
        description: 'Authentic hand-woven Persian carpet from the 19th century. Features intricate geometric patterns in deep reds and blues. Excellent condition with minimal wear.',
        categoryName: 'Art & Collectibles',
        condition: 'EXCELLENT',
        location: 'Tripoli, Lebanon',
        images: ['/images/products/carpet1.jpg'],
        estimatedValueMin: 2500,
        estimatedValueMax: 4000,
        provenance: 'Estate sale',
        dimensions: '9x12 feet',
        materials: 'Hand-woven wool',
        authenticity: 'Certified authentic',
        status: 'APPROVED',
      },
      
      // Electronics
      {
        title: 'iPhone 14 Pro Max - 256GB Space Black',
        description: 'Latest iPhone 14 Pro Max in excellent condition. 256GB storage, Space Black color. Includes original box, charger, and unused accessories. Battery health at 98%.',
        categoryName: 'Electronics',
        condition: 'EXCELLENT',
        location: 'Beirut, Lebanon',
        images: ['/images/products/iphone1.jpg', '/images/products/iphone1-box.jpg'],
        estimatedValueMin: 1200,
        estimatedValueMax: 1400,
        auctionStatus: 'SCHEDULED',
        startingBid: 1000,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: 'MacBook Pro 16" M2 Max',
        description: 'Powerful MacBook Pro with M2 Max chip, 32GB RAM, 1TB SSD. Perfect for professionals. Barely used, still under warranty.',
        categoryName: 'Electronics',
        condition: 'EXCELLENT',
        location: 'Jounieh, Lebanon',
        images: ['/images/products/macbook1.jpg'],
        estimatedValueMin: 3200,
        estimatedValueMax: 3800,
        status: 'APPROVED',
      },

      // Vehicles
      {
        title: '2018 BMW 320i - Low Mileage',
        description: 'Beautiful BMW 320i in pristine condition. Only 45,000km on the odometer. Full service history, leather interior, navigation system.',
        categoryName: 'Vehicles',
        condition: 'EXCELLENT',
        location: 'Beirut, Lebanon',
        images: ['/images/products/bmw1.jpg', '/images/products/bmw1-interior.jpg'],
        estimatedValueMin: 22000,
        estimatedValueMax: 28000,
        auctionStatus: 'LIVE',
        startingBid: 20000,
        currentBid: 23500,
        bidCount: 8,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },

      // Watches & Jewelry
      {
        title: 'Rolex Submariner Date - Black Dial',
        description: 'Authentic Rolex Submariner Date with black dial and ceramic bezel. Excellent condition with box and papers. Service history available.',
        categoryName: 'Watches & Jewelry',
        condition: 'EXCELLENT',
        location: 'Beirut, Lebanon',
        images: ['/images/products/rolex1.jpg', '/images/products/rolex1-box.jpg'],
        estimatedValueMin: 8000,
        estimatedValueMax: 12000,
        provenance: 'Authorized dealer',
        authenticity: 'Certified authentic with papers',
        auctionStatus: 'LIVE',
        startingBid: 7000,
        currentBid: 9500,
        bidCount: 15,
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      },
      {
        title: 'Diamond Tennis Bracelet',
        description: 'Stunning diamond tennis bracelet with 2.5 carats total weight. 18k white gold setting. Perfect for special occasions.',
        categoryName: 'Watches & Jewelry',
        condition: 'NEW',
        location: 'Beirut, Lebanon',
        images: ['/images/products/bracelet1.jpg'],
        estimatedValueMin: 4500,
        estimatedValueMax: 6000,
        materials: '18k white gold, diamonds',
        authenticity: 'GIA certified diamonds',
        status: 'APPROVED',
      }
    ];

    // Create products
    for (const productData of testProducts) {
      const category = categories.find(c => c.name === productData.categoryName);
      if (!category) {
        console.log(`❌ Category "${productData.categoryName}" not found`);
        continue;
      }

      // Separate specifications from main fields
      const { provenance, dimensions, materials, authenticity, categoryName, ...mainFields } = productData;
      
      const specifications = {};
      if (provenance) specifications.provenance = provenance;
      if (dimensions) specifications.dimensions = dimensions;
      if (materials) specifications.materials = materials;
      if (authenticity) specifications.authenticity = authenticity;

      const productCreateData = {
        ...mainFields,
        categoryId: category.id,
        agentId: agent.id,
        status: productData.status || 'APPROVED',
        specifications: Object.keys(specifications).length > 0 ? specifications : {},
      };

      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: { title: productData.title }
      });

      if (existingProduct) {
        console.log(`✅ Product "${productData.title}" already exists, updating...`);
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            ...productCreateData,
            updatedAt: new Date(),
          }
        });
      } else {
        console.log(`🆕 Creating product "${productData.title}"...`);
        await prisma.product.create({
          data: productCreateData
        });
      }
    }

    console.log('✅ Test products seeded successfully!');
    
    // Show count per category
    for (const category of categories) {
      const count = await prisma.product.count({
        where: { categoryId: category.id }
      });
      console.log(`📊 ${category.name}: ${count} products`);
    }

  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedTestProducts();
}

module.exports = { seedTestProducts };