import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/response';
import { prisma } from 'src/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes 
} from 'src/lib/api-response';

// GET /api/search - Advanced search for products and auctions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const conditions = searchParams.get('conditions')?.split(',').filter(Boolean) || [];
    const auctionStatuses = searchParams.get('auctionStatuses')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions: any = {
      AND: []
    };

    // Text search across multiple fields
    if (query.trim()) {
      searchConditions.AND.push({
        OR: [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } },
          { shortDescription: { contains: query.trim(), mode: 'insensitive' } },
          { brand: { name: { contains: query.trim(), mode: 'insensitive' } } },
          { category: { name: { contains: query.trim(), mode: 'insensitive' } } },
          { agent: { businessName: { contains: query.trim(), mode: 'insensitive' } } },
          { agent: { displayName: { contains: query.trim(), mode: 'insensitive' } } },
        ]
      });
    }

    // Category filter
    if (categories.length > 0) {
      searchConditions.AND.push({
        category: {
          name: { in: categories }
        }
      });
    }

    // Location filter
    if (locations.length > 0) {
      searchConditions.AND.push({
        location: { in: locations }
      });
    }

    // Condition filter
    if (conditions.length > 0) {
      searchConditions.AND.push({
        condition: { in: conditions }
      });
    }

    // Auction status filter
    if (auctionStatuses.length > 0) {
      searchConditions.AND.push({
        auctionStatus: { in: auctionStatuses }
      });
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceCondition: any = {};
      
      if (minPrice !== undefined) {
        priceCondition.OR = [
          { estimatedValueMin: { gte: minPrice } },
          { currentBid: { gte: minPrice } },
          { startingBid: { gte: minPrice } }
        ];
      }
      
      if (maxPrice !== undefined) {
        if (priceCondition.OR) {
          // Combine with AND if both min and max are specified
          priceCondition.AND = [
            { OR: priceCondition.OR },
            {
              OR: [
                { estimatedValueMax: { lte: maxPrice } },
                { currentBid: { lte: maxPrice } },
                { startingBid: { lte: maxPrice } }
              ]
            }
          ];
          delete priceCondition.OR;
        } else {
          priceCondition.OR = [
            { estimatedValueMax: { lte: maxPrice } },
            { currentBid: { lte: maxPrice } },
            { startingBid: { lte: maxPrice } }
          ];
        }
      }
      
      searchConditions.AND.push(priceCondition);
    }

    // Only include approved products, exclude ended/cancelled auctions
    searchConditions.AND.push({
      status: 'APPROVED',
      NOT: [
        { auctionStatus: 'ENDED' },
        { auctionStatus: 'CANCELLED' }
      ]
    });

    // Build sort conditions
    let orderBy: any = {};
    switch (sortBy) {
      case 'price_low':
        orderBy = [
          { currentBid: 'asc' },
          { startingBid: 'asc' },
          { estimatedValueMin: 'asc' }
        ];
        break;
      case 'price_high':
        orderBy = [
          { currentBid: 'desc' },
          { startingBid: 'desc' },
          { estimatedValueMax: 'desc' }
        ];
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'ending_soon':
        orderBy = [
          { endTime: 'asc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'relevance':
      default:
        // For relevance, we'll use a combination of factors
        orderBy = [
          { bidCount: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
    }

    // Execute search with count
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: searchConditions,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              slug: true
            }
          },
          brand: {
            select: {
              id: true,
              name: true,
              logoUrl: true
            }
          },
          agent: {
            select: {
              id: true,
              businessName: true,
              displayName: true,
              logoUrl: true,
              rating: true
            }
          },
          _count: {
            select: {
              bids: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({
        where: searchConditions
      })
    ]);

    // Transform products to match frontend expectations
    const transformedProducts = products.map(product => {
      const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      
      // Ensure image URLs are proper paths
      const processedImages = images?.map((image: any) => {
        if (typeof image === 'string') {
          // If it's already a URL path, use it as is
          if (image.startsWith('/uploads/')) {
            return image;
          }
          // If it's base64 or other format, skip it
          else if (!image.startsWith('data:')) {
            return image;
          }
        }
        return null;
      }).filter(Boolean) || [];

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        type: product.auctionStatus && ['SCHEDULED', 'LIVE', 'ENDED'].includes(product.auctionStatus) ? 'auction' : 'product',
        status: product.auctionStatus,
        images: processedImages,
        price: product.auctionStatus === 'LIVE' 
          ? Number(product.currentBid || product.startingBid || product.estimatedValueMin || 0)
          : Number(product.estimatedValueMin || 0),
        location: product.location,
        condition: product.condition,
        endTime: product.endTime,
        bidCount: product._count?.bids || 0,
        viewCount: product.viewCount || 0,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          nameAr: product.category.nameAr,
          slug: product.category.slug
        } : null,
        brand: product.brand ? {
          id: product.brand.id,
          name: product.brand.name,
          logoUrl: product.brand.logoUrl
        } : null,
        agent: {
          id: product.agent.id,
          displayName: product.agent.displayName || product.agent.businessName,
          businessName: product.agent.businessName,
          logoUrl: product.agent.logoUrl,
          rating: product.agent.rating ? Number(product.agent.rating) : null
        },
        tags: [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      items: transformedProducts,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      filters: {
        query: query.trim() || null,
        categories: categories.length > 0 ? categories : null,
        locations: locations.length > 0 ? locations : null,
        conditions: conditions.length > 0 ? conditions : null,
        auctionStatuses: auctionStatuses.length > 0 ? auctionStatuses : null,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Search failed', 500);
  }
}