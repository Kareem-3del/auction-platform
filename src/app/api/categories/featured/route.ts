import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { prisma } from 'src/lib/prisma';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse 
} from 'src/lib/api-response';

const searchParamsSchema = z.object({
  limit: z.string().transform(val => Math.min(parseInt(val) || 6, 20)).optional(),
  productsPerCategory: z.string().transform(val => Math.min(parseInt(val) || 4, 10)).optional(),
}).partial();

// GET /api/categories/featured - Get featured categories with their products
export async function GET(request: NextRequest) {
  try {
    validateMethod(request, ['GET']);

    const { searchParams: urlParams } = new URL(request.url);
    const { limit = 6, productsPerCategory = 4 } = searchParamsSchema.parse(Object.fromEntries(urlParams.entries()));

    // Get featured categories (categories with most active products or manually marked as featured)
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Only top-level categories
      },
      include: {
        products: {
          where: {
            status: 'APPROVED',
            // Exclude sold items and ended auctions from live displays
            NOT: [
              { status: 'SOLD' },
              { auctionStatus: 'ENDED' },
              { auctionStatus: 'CANCELLED' }
            ],
          },
          include: {
            agent: {
              select: {
                id: true,
                displayName: true,
                businessName: true,
              },
            },
          },
          orderBy: [
            { viewCount: 'desc' },
            { favoriteCount: 'desc' },
            { createdAt: 'desc' },
          ],
          take: productsPerCategory,
        },
        _count: {
          select: {
            products: {
              where: {
                status: 'APPROVED',
                // Exclude sold items and ended auctions from count
                NOT: [
                  { status: 'SOLD' },
                  { auctionStatus: 'ENDED' },
                  { auctionStatus: 'CANCELLED' }
                ],
              },
            },
          },
        },
      },
      orderBy: [
        {
          products: {
            _count: 'desc',
          },
        },
        { name: 'asc' },
      ],
      take: limit,
    });

    // Filter categories that have at least some products
    const featuredCategories = categories
      .filter(category => category._count.products > 0)
      .map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: category._count.products,
        products: category.products.map((product: any) => ({
          id: product.id,
          title: product.title,
          images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
          estimatedValueMin: Number(product.estimatedValueMin),
          estimatedValueMax: Number(product.estimatedValueMax),
          currentBid: product.currentBid ? Number(product.currentBid) : null,
          auctionStatus: product.auctionStatus,
          status: product.status,
          viewCount: product.viewCount,
          favoriteCount: product.favoriteCount,
          createdAt: product.createdAt,
          agent: product.agent,
        })),
      }));

    return successResponse({
      data: featuredCategories,
      message: 'Featured categories retrieved successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid parameters',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}