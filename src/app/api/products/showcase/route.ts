import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { handleAPIError, validateMethod, successResponse } from 'src/lib/api-response';

const showcaseParamsSchema = z.object({
  section: z.enum(['ending-soon', 'coming-soon', 'featured', 'recent', 'trending']).default('featured'),
  limit: z.string().transform(val => Math.min(parseInt(val) || 8, 20)).default('8'),
}).partial();

export async function GET(request: NextRequest) {
  try {
    validateMethod(request, ['GET']);

    const { searchParams: urlParams } = new URL(request.url);
    const { section = 'featured', limit = 8 } = showcaseParamsSchema.parse(Object.fromEntries(urlParams.entries()));

    // Check if database connection exists
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return successResponse([], {
        meta: {
          section,
          title: section === 'trending' ? 'Trending Now' : section === 'featured' ? 'Featured Products' : 'Products',
          count: 0,
          hasMore: false,
        },
      });
    }

    const now = new Date();

    let whereClause: any = {
      status: 'APPROVED',
      // Exclude sold items and ended/cancelled auctions from all showcase sections
      NOT: [
        { status: 'SOLD' },
        { auctionStatus: 'ENDED' },
        { auctionStatus: 'CANCELLED' }
      ],
    };
    let orderBy: any = { createdAt: 'desc' };
    let sectionTitle = 'Featured Products';

    switch (section) {
      case 'ending-soon': {
        // Products with auctions ending within next 24-48 hours
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        whereClause = {
          ...whereClause,
          auctionStatus: 'LIVE',
          endTime: {
            gte: now,
            lte: in48Hours,
          },
        };
        orderBy = { endTime: 'asc' }; // Ending soonest first
        sectionTitle = 'Ending Soon';
        break;
      }

      case 'coming-soon': {
        // Products with auctions scheduled to start soon
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        whereClause = {
          ...whereClause,
          auctionStatus: 'SCHEDULED',
          startTime: {
            gte: now,
            lte: nextWeek,
          },
        };
        orderBy = { startTime: 'asc' }; // Starting soonest first
        sectionTitle = 'Coming Soon';
        break;
      }

      case 'trending': {
        // Get any approved products for trending (not just live auctions)
        whereClause = {
          ...whereClause,
        };
        orderBy = { createdAt: 'desc' };
        sectionTitle = 'Trending Now';
        break;
      }

      case 'recent': {
        // Get any approved products for recent section
        whereClause = {
          ...whereClause,
        };
        orderBy = { createdAt: 'desc' };
        sectionTitle = 'Recently Added';
        break;
      }

      case 'featured':
      default: {
        // Get any approved products for featured section
        whereClause = {
          ...whereClause,
          // Remove value restriction to show all approved products
        };
        orderBy = { createdAt: 'desc' };
        sectionTitle = 'Featured Products';
        break;
      }
    }

    console.log('Showcase API - whereClause:', JSON.stringify(whereClause, null, 2));
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            displayName: true,
            businessName: true,
            logoUrl: true,
            rating: true,
            reviewCount: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        // Get bid count for auction products
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    console.log(`Showcase API - Found ${products.length} products for section ${section}`);

    const productsData = products.map((product: any) => ({
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      estimatedValueMin: Number(product.estimatedValueMin),
      estimatedValueMax: Number(product.estimatedValueMax),
      reservePrice: product.reservePrice ? Number(product.reservePrice) : null,
      startingBid: product.startingBid ? Number(product.startingBid) : null,
      currentBid: product.currentBid ? Number(product.currentBid) : 0,
      bidIncrement: product.bidIncrement ? Number(product.bidIncrement) : null,
      buyNowPrice: product.buyNowPrice ? Number(product.buyNowPrice) : null,
      bidCount: product._count.bids || 0,
      // Calculate time remaining for auctions
      timeRemaining: product.endTime ? {
        endTime: product.endTime,
        isActive: product.auctionStatus === 'LIVE' && new Date(product.endTime) > new Date(),
      } : null,
      // Calculate time to start for scheduled auctions
      timeToStart: product.startTime ? {
        startTime: product.startTime,
        isScheduled: product.auctionStatus === 'SCHEDULED' && new Date(product.startTime) > new Date(),
      } : null,
    }));

    return successResponse(productsData, {
      meta: {
        section,
        title: sectionTitle,
        count: productsData.length,
        hasMore: productsData.length === limit,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid showcase parameters',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}