const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCategoryProducts() {
  try {
    console.log('🔍 Debugging category-product associations...\n');

    // Get all categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    console.log('📊 Categories Overview:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}): ${cat._count.products} products`);
    });
    console.log();

    // Get a specific category and its products
    const electronicsCategory = categories.find(c => c.slug === 'electronics');
    if (electronicsCategory) {
      console.log(`🔍 Products in "${electronicsCategory.name}" category:`);
      
      const products = await prisma.product.findMany({
        where: { 
          categoryId: electronicsCategory.id,
          status: 'APPROVED'
        },
        include: {
          category: true,
          agent: {
            include: {
              user: true
            }
          }
        }
      });

      console.log(`Found ${products.length} products:`);
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title}`);
        console.log(`     - ID: ${product.id}`);
        console.log(`     - Status: ${product.status}`);
        console.log(`     - Auction Status: ${product.auctionStatus}`);
        console.log(`     - Category: ${product.category.name}`);
        console.log(`     - Agent: ${product.agent.businessName}`);
        console.log(`     - Price: $${product.estimatedValueMin} - $${product.estimatedValueMax}`);
        console.log();
      });
    }

    // Test API query simulation - old logic (excluding ended auctions)
    console.log('🧪 Testing API query simulation (OLD - excluding ended auctions)...');
    
    const testCategoryId = electronicsCategory?.id;
    if (testCategoryId) {
      const apiResultOld = await prisma.product.findMany({
        where: {
          categoryId: testCategoryId,
          status: 'APPROVED',
          NOT: [
            { status: 'SOLD' },
            { auctionStatus: 'ENDED' },
            { auctionStatus: 'CANCELLED' }
          ]
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          agent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      console.log(`OLD API logic found ${apiResultOld.length} products for electronics category`);
      
      // Test NEW API query simulation - including ended auctions
      console.log('🧪 Testing API query simulation (NEW - including ended auctions)...');
      
      const apiResultNew = await prisma.product.findMany({
        where: {
          categoryId: testCategoryId,
          status: 'APPROVED',
          NOT: [
            { status: 'SOLD' },
            { auctionStatus: 'CANCELLED' }
          ]
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          agent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      console.log(`NEW API logic found ${apiResultNew.length} products for electronics category`);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugCategoryProducts();
}

module.exports = { debugCategoryProducts };