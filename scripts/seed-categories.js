const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Art & Collectibles',
    slug: 'art-collectibles',
    description: 'Paintings, sculptures, rare collectibles and artistic masterpieces',
    imageUrl: '/images/categories/art-collectibles.jpg',
    isActive: true,
    isFeatured: true,
    sortOrder: 10
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets, smartphones, laptops and electronic devices',
    imageUrl: '/images/categories/electronics.jpg',
    isActive: true,
    isFeatured: true,
    sortOrder: 20
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Cars, motorcycles, boats and luxury vehicles',
    imageUrl: '/images/categories/vehicles.jpg',
    isActive: true,
    isFeatured: true,
    sortOrder: 30
  },
  {
    name: 'Watches & Jewelry',
    slug: 'watches-jewelry',
    description: 'Luxury timepieces, fine jewelry and precious accessories',
    imageUrl: '/images/categories/watches-jewelry.jpg',
    isActive: true,
    isFeatured: true,
    sortOrder: 40
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');

    for (const categoryData of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug }
      });

      if (existingCategory) {
        console.log(`✅ Category "${categoryData.name}" already exists, updating...`);
        await prisma.category.update({
          where: { slug: categoryData.slug },
          data: {
            ...categoryData,
            updatedAt: new Date()
          }
        });
      } else {
        console.log(`🆕 Creating category "${categoryData.name}"...`);
        await prisma.category.create({
          data: categoryData
        });
      }
    }

    console.log('✅ Categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories };