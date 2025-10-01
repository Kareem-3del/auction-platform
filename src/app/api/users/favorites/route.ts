import { prisma } from 'src/lib/prisma';
import { withAuth } from 'src/lib/middleware/auth';
import {
  handleAPIError,
  validateMethod,
  successResponse,
} from 'src/lib/api-response';

// GET /api/users/favorites - Get user's favorite products
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);

    const userId = request.user.id;

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            currentBid: true,
            startingBid: true,
            bidCount: true,
            auctionStatus: true,
            endTime: true,
            images: true,
            thumbnailIndex: true,
            favoriteCount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedFavorites = favorites.map((fav) => fav.product);

    return successResponse({
      data: {
        favorites: formattedFavorites,
        total: favorites.length,
      },
      message: 'Favorites retrieved successfully',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });

// POST /api/users/favorites - Add product to favorites
export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);

    const userId = request.user.id;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Product ID is required',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return handleAPIError({
        name: 'NotFoundError',
        message: 'Product not found',
      });
    }

    // Check if already favorited
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      return successResponse({
        data: { favorite: existing },
        message: 'Product already in favorites',
      });
    }

    // Add to favorites
    const favorite = await prisma.$transaction(async (tx) => {
      const newFavorite = await tx.userFavorite.create({
        data: {
          userId,
          productId,
        },
      });

      // Increment favorite count
      await tx.product.update({
        where: { id: productId },
        data: {
          favoriteCount: {
            increment: 1,
          },
        },
      });

      return newFavorite;
    });

    return successResponse({
      data: { favorite },
      message: 'Added to favorites',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}, { required: true });
