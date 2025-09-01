import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { apiResponse } from 'src/lib/api-response';

// Validation schema for search suggestions
const suggestionsParamsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.string().transform(val => Math.min(parseInt(val) || 6, 10)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams: urlParams } = new URL(request.url);
    const params = suggestionsParamsSchema.parse(Object.fromEntries(urlParams.entries()));
    
    const { q: query, limit = 6 } = params;

    // Search across multiple entities in parallel
    const [products, categories, brands] = await Promise.all([
      // Search products (excluding sold items and ended auctions)
      prisma.product.findMany({
        where: {
          status: 'APPROVED',
          NOT: [
            { status: 'SOLD' },
            { auctionStatus: 'ENDED' },
            { auctionStatus: 'CANCELLED' }
          ],
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          category: {
            select: { name: true },
          },
          agent: {
            select: {
              displayName: true,
              businessName: true,
              rating: true,
            },
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: Math.ceil(limit * 0.7), // 70% of results from products
      }),

      // Search categories
      prisma.category.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          isActive: true,
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
        take: 2,
      }),

      // Search brands
      prisma.brand.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          isActive: true,
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
        take: 2,
      }),
    ]);

    // Transform products to suggestions
    const productSuggestions = products.map(product => {
      const isAuction = product.auctionStatus && ['SCHEDULED', 'LIVE', 'ENDED'].includes(product.auctionStatus);
      const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      
      // Ensure image is a proper URL, not base64
      let imageUrl = null;
      if (images?.[0]) {
        const image = images[0];
        // If it's already a URL path, use it as is
        if (typeof image === 'string' && image.startsWith('/uploads/')) {
          imageUrl = image;
        }
        // If it's base64 or other format, skip it (should use proper upload system)
        else if (typeof image === 'string' && !image.startsWith('data:')) {
          imageUrl = image;
        }
      }
      
      return {
        id: product.id,
        title: product.title,
        type: isAuction ? 'auction' : 'product',
        image: imageUrl,
        price: isAuction 
          ? (Number(product.currentBid) || Number(product.startingBid) || Number(product.estimatedValueMin))
          : Number(product.estimatedValueMin),
        category: product.category?.name,
        location: product.location,
        endTime: product.endTime,
        isLive: product.auctionStatus === 'LIVE',
        agent: product.agent?.displayName || product.agent?.businessName,
        rating: product.agent?.rating ? Number(product.agent.rating) : null,
      };
    });

    // Transform categories to suggestions
    const categorySuggestions = categories.map(category => ({
      id: category.id,
      title: category.name,
      type: 'category' as const,
      image: category.imageUrl,
      count: category._count.products,
      description: `${category._count.products} products`,
    }));

    // Transform brands to suggestions
    const brandSuggestions = brands.map(brand => ({
      id: brand.id,
      title: brand.name,
      type: 'brand' as const,
      image: brand.logoUrl,
      count: brand._count.products,
      description: `${brand._count.products} products`,
    }));

    // Combine and limit results
    const allSuggestions = [
      ...productSuggestions,
      ...categorySuggestions,
      ...brandSuggestions,
    ].slice(0, limit);

    // Get popular searches for empty queries or few results
    const popularSearches = allSuggestions.length < 3 ? [
      'Rolex watches',
      'Vintage cars',
      'Diamond jewelry',
      'Modern art',
      'Luxury handbags',
      'Antique furniture'
    ].filter(search => 
      search.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit - allSuggestions.length) : [];

    return apiResponse.success('Search suggestions retrieved successfully', {
      suggestions: allSuggestions,
      popularSearches,
      query,
      totalResults: allSuggestions.length,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest('Invalid search parameters', {
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error('Search suggestions error:', error);
    return apiResponse.internalServerError('Failed to fetch search suggestions');
  }
}